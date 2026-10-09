"""Private CPU speech worker. No conversation engine, recognition, tools or credentials."""
import argparse
import gc
import io
import json
import os
import threading
import wave
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

VOICES = {"en": ("english", "anna"), "es": ("spanish", "lola"), "de": ("german", "juergen"),
          "pt": ("portuguese", "rafael"), "fr": ("french", "estelle"),
          "it": ("italian", "giovanni"), "nl": ("dutch", "daan")}
MAX_TEXT = 600
MAX_SAMPLES = 24000 * 31


def validate(value):
    if (not isinstance(value, dict) or set(value) != {"text", "locale"}
            or value["locale"] not in VOICES or not isinstance(value["text"], str)
            or not value["text"].strip() or len(value["text"]) > MAX_TEXT
            or any(ord(c) < 32 and c not in "\n\r\t" for c in value["text"])):
        raise ValueError("Invalid speech request")
    return value["text"].strip(), value["locale"]


class Synthesizer:
    def __init__(self):
        import torch
        from pocket_tts import TTSModel
        self.torch, self.model_type = torch, TTSModel
        torch.set_num_threads(2)
        torch.set_num_interop_threads(1)
        self.model = self.state = self.locale = None
        self.lock = threading.Lock()

    def load(self, locale):
        if self.locale == locale:
            return
        # One language resident at a time; multilingual models must not accumulate.
        self.model = self.state = self.locale = None
        gc.collect()
        language, voice = VOICES[locale]
        model = self.model_type.load_model(language=language)
        state = model.get_state_for_audio_prompt(voice)
        self.model, self.state, self.locale = model, state, locale

    def speech(self, text, locale):
        self.load(locale)
        chunks, samples = [], 0
        for chunk in self.model.generate_audio_stream(self.state, text):
            chunk = chunk.detach().cpu().reshape(-1)
            samples += chunk.numel()
            if samples > MAX_SAMPLES:
                raise ValueError("Speech exceeds duration limit")
            chunks.append(chunk)
        if not chunks or self.model.sample_rate != 24000:
            raise ValueError("Invalid speech output")
        audio = self.torch.cat(chunks).clamp(-1, 1).mul(32767).to(self.torch.int16).numpy().astype('<i2').tobytes()
        output = io.BytesIO()
        with wave.open(output, 'wb') as wav:
            wav.setnchannels(1)
            wav.setsampwidth(2)
            wav.setframerate(24000)
            wav.writeframes(audio)
        return output.getvalue()


def handler(synth):
    class Handler(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass  # Never log user text or model prompts.

        def send(self, status, data, content_type='application/json'):
            self.send_response(status)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(data)))
            self.send_header('Cache-Control', 'no-store')
            self.end_headers()
            try:
                self.wfile.write(data)
            except (BrokenPipeError, ConnectionResetError):
                pass

        def do_GET(self):
            if self.path != '/healthz':
                return self.send(404, b'{}')
            self.send(200, json.dumps({'ready': synth.model is not None, 'engine': 'pocket-tts',
                                      'version': '3.3.0', 'voices': {k: v[1] for k, v in VOICES.items()}}).encode())

        def do_POST(self):
            # Host adapters enforce user auth/consent. Reject browser access here.
            if self.path != '/speech' or self.headers.get('Origin') or self.headers.get('Content-Type') != 'application/json':
                return self.send(403, b'{}')
            self.connection.settimeout(5)
            try:
                size = int(self.headers.get('Content-Length', '0'))
                if not 0 < size <= 8192:
                    raise ValueError()
                text, locale = validate(json.loads(self.rfile.read(size)))
            except (ValueError, TypeError, KeyError, TimeoutError):
                return self.send(400, b'{}')
            if not synth.lock.acquire(blocking=False):
                return self.send(429, b'{}')
            try:
                self.send(200, synth.speech(text, locale), 'audio/wav')
            except Exception:
                self.send(503, b'{}')
            finally:
                synth.lock.release()
    return Handler


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--port', type=int, default=43947)
    parser.add_argument('--prefetch', nargs='+', choices=list(VOICES))
    args = parser.parse_args()
    os.environ.update(CUDA_VISIBLE_DEVICES='', OMP_NUM_THREADS='2', MKL_NUM_THREADS='2',
                      HF_HUB_DISABLE_IMPLICIT_TOKEN='1', HF_HUB_DISABLE_XET='1',
                      HF_HUB_OFFLINE='0' if args.prefetch else '1')
    synth = Synthesizer()
    if args.prefetch:
        for locale in args.prefetch:
            synth.load(locale)
        return
    synth.load('en')
    server = ThreadingHTTPServer(('127.0.0.1', args.port), handler(synth))
    server.daemon_threads = True
    print('Pocket speech ready on private loopback.', flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == '__main__':
    main()
