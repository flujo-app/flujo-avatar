import assert from 'node:assert/strict';
import test from 'node:test';
import {createServer} from 'node:http';
import {once} from 'node:events';
import {localNativeVoiceTransport,snapshotNativeVoiceTransport,resetNativeHistory,voiceHeaders,type NativeVoiceTransport} from '../src/client/nativeVoiceTransport';

const previousStorage=Object.getOwnPropertyDescriptor(globalThis,'sessionStorage');
const values=new Map<string,string>();
Object.defineProperty(globalThis,'sessionStorage',{configurable:true,value:{getItem:(k:string)=>values.get(k)??null,setItem:(k:string,v:string)=>values.set(k,v)}});
test.after(()=>{if(previousStorage)Object.defineProperty(globalThis,'sessionStorage',previousStorage);else Reflect.deleteProperty(globalThis,'sessionStorage');});
const deferred=()=>{let resolve!:(v:Response)=>void;const promise=new Promise<Response>(r=>resolve=r);return {promise,resolve};};

test('local default preserves URLs and the same non-authorizing correlation header',async()=>{
 const original=globalThis.fetch;const requests:Array<{url:string;init:RequestInit}>=[];
 globalThis.fetch=(async(url,init)=>{requests.push({url:String(url),init:init!});return new Response('{}');}) as typeof fetch;
 try{
  const signal=new AbortController().signal;
  await resetNativeHistory(localNativeVoiceTransport,signal);
  await localNativeVoiceTransport.request('native-input',{method:'POST',headers:voiceHeaders(),body:'{"audio":"fixture"}',signal});
  assert.deepEqual(requests.map(r=>r.url),['/api/avatar/native-reset','/api/avatar/native-input']);
  assert.equal(requests[0].init.body,'{}');
  const a=new Headers(requests[0].init.headers),b=new Headers(requests[1].init.headers);
  assert.equal(a.get('x-flujo-avatar-client'),b.get('x-flujo-avatar-client'));
  assert.equal(a.has('authorization'),false);
  assert.equal(localNativeVoiceTransport.workletUrl,'/avatar-audio-capture.js');
 }finally{globalThis.fetch=original;}
});

test('same-owner resets serialize while a different authenticated scope remains independent',async()=>{
 const pending=deferred(),calls:string[]=[];
 const a:NativeVoiceTransport={scopeKey:'owner-a:workspace-1:revision-1',workletUrl:'/worklet.js',request:async()=>{calls.push('a');return calls.filter(x=>x==='a').length===1?pending.promise:new Response('{}');}};
 const b:NativeVoiceTransport={...a,scopeKey:'owner-b:workspace-1:revision-1',request:async()=>{calls.push('b');return new Response('{}');}};
 const first=resetNativeHistory(a,new AbortController().signal);
 const next=resetNativeHistory(a,new AbortController().signal);
 await resetNativeHistory(b,new AbortController().signal);
 assert.deepEqual(calls,['a','b']);
 pending.resolve(new Response('{}'));await Promise.all([first,next]);
 assert.deepEqual(calls,['a','b','a']);
});

test('a failed owner reset does not poison the next reconnect and an aborted queued reset never sends',async()=>{
 let count=0;
 const transport:NativeVoiceTransport={scopeKey:'reset-failure',workletUrl:'/worklet.js',request:async()=>{count++;return new Response('{}',{status:count===1?401:200});}};
 await assert.rejects(resetNativeHistory(transport,new AbortController().signal));
 await resetNativeHistory(transport,new AbortController().signal);
 const cancelled=new AbortController();cancelled.abort();
 await assert.rejects(resetNativeHistory(transport,cancelled.signal),{name:'AbortError'});
 assert.equal(count,2);
});

test('a session captures transport callback, scope and worklet instead of adopting later replacements',async()=>{
 let old=0,newer=0;
 const source={scopeKey:'old-principal',workletUrl:'/old-worklet.js',request:async()=>{old++;return new Response('{}');}};
 const captured=snapshotNativeVoiceTransport(source);
 source.scopeKey='new-principal';source.workletUrl='/new-worklet.js';source.request=async()=>{newer++;return new Response('{}');};
 await captured.request('voice',{method:'GET'});
 assert.equal(captured.scopeKey,'old-principal');assert.equal(captured.workletUrl,'/old-worklet.js');assert.equal(old,1);assert.equal(newer,0);assert.equal(Object.isFrozen(captured),true);
 assert.throws(()=>snapshotNativeVoiceTransport({...source,scopeKey:''}),/invalid_voice_transport/);
});

test('a real injected HTTP path preserves exact reset body, streaming and abort without provider calls',async()=>{
 const requests:Array<{url:string;body:string;authorization:string|undefined}>=[];
 const server=createServer(async(req,res)=>{
  let body='';for await(const chunk of req)body+=chunk;
  requests.push({url:req.url!,body,authorization:req.headers.authorization});
  if(req.url!.includes('native-input'))return; // Aborted client must not retry this request.
  if(req.url!.includes('native-turn')){res.writeHead(200,{'content-type':'application/x-ndjson'});res.write('{"type":"start"}\n');setTimeout(()=>res.end('{"type":"complete"}\n'),10);}
  else {res.writeHead(200,{'content-type':'application/json'});res.end('{}');}
 });
 server.listen(0,'127.0.0.1');await once(server,'listening');
 const origin='http://127.0.0.1:'+ (server.address() as {port:number}).port;
 const transport:NativeVoiceTransport={scopeKey:'fixture:dev-workspace:revision-4',workletUrl:'/static/avatar-audio-capture.js',request:(action,init)=>fetch(origin+'/bff/'+action+'?workspace=dev-workspace',{...init,headers:{...Object.fromEntries(new Headers(init.headers)),authorization:'Bearer fixture-only'}})};
 try{
  await resetNativeHistory(transport,new AbortController().signal);
  const output=await transport.request('native-turn',{method:'POST',body:'{"message":"fixture"}',signal:new AbortController().signal});
  assert.equal(output.headers.get('content-type'),'application/x-ndjson');
  assert.match(await output.text(),/start.*\n.*complete/s);
  const controller=new AbortController();const pending=transport.request('native-input',{method:'POST',body:'{}',signal:controller.signal});
  while(requests.length<3)await new Promise(r=>setTimeout(r,5));controller.abort();
  await assert.rejects(pending,{name:'AbortError'});
  assert.equal(requests[0].body,'{}');assert.equal(requests[0].url,'/bff/native-reset?workspace=dev-workspace');
  assert.equal(requests.length,3);assert.ok(requests.every(r=>r.authorization==='Bearer fixture-only'));
 }finally{server.closeAllConnections();await new Promise<void>(resolve=>server.close(()=>resolve()));}
});
