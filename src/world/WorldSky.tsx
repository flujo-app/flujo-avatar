'use client';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { currentWorldSkySelection, type WorldSkyIntent, type WorldSkyLayer, type WorldSkyModel, type WorldSkySelection } from './selection.js';
import styles from './world-sky.module.css';

export interface WorldSkyProps {
  world: ReactNode;
  sky: ReactNode;
  model: WorldSkyModel | null;
  selection: WorldSkySelection | null;
  onNavigate(intent: WorldSkyIntent): void;
  initialLayer?: WorldSkyLayer;
  locale?: 'en' | 'es' | 'pt';
}

const copy = {
  en: { panorama: 'World and sky', world: 'FLUJO World', sky: 'Swarm sky', up: 'Look at the sky', down: 'Back to the world', sample: 'Sample data · sky preview', unavailable: 'Swarm observations unavailable', sources: 'registered sources' },
  es: { panorama: 'Mundo y cielo', world: 'FLUJO World', sky: 'Cielo del enjambre', up: 'Mirar al cielo', down: 'Volver al mundo', sample: 'Datos de ejemplo · vista del cielo', unavailable: 'Observaciones del enjambre no disponibles', sources: 'fuentes registradas' },
  pt: { panorama: 'Mundo e céu', world: 'FLUJO World', sky: 'Céu do enxame', up: 'Olhar para o céu', down: 'Voltar ao mundo', sample: 'Dados de exemplo · prévia do céu', unavailable: 'Observações do enxame indisponíveis', sources: 'fontes registradas' },
};
const useClientLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** A camera between existing host surfaces. Children keep their own runtime. */
export function WorldSky({ world, sky, model, selection, onNavigate, initialLayer = 'world', locale = 'en' }: WorldSkyProps) {
  const viewport = useRef<HTMLDivElement>(null), worldRegion = useRef<HTMLElement>(null), skyRegion = useRef<HTMLElement>(null);
  const [layer, setLayer] = useState<WorldSkyLayer>(initialLayer);
  const layerRef = useRef(initialLayer);
  const latest = useRef({ model, selection, onNavigate }); latest.current = { model, selection, onNavigate };
  const id = useId(), c = copy[locale];
  const visibleSelection = currentWorldSkySelection(model, selection);

  useClientLayoutEffect(() => {
    const element = viewport.current;
    if (!element) return;
    const position = () => { element.scrollTop = layerRef.current === 'world' ? element.clientHeight : 0; };
    position();
    const observer = new ResizeObserver(position); observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const recordLayer = (next: WorldSkyLayer) => {
    if (next === layerRef.current) return;
    layerRef.current = next; setLayer(next);
    const facts = latest.current;
    facts.onNavigate({ layer: next, selection: currentWorldSkySelection(facts.model, facts.selection) });
  };
  const travel = (next: WorldSkyLayer) => {
    const element = viewport.current;
    if (!element) return;
    element.scrollTo({ top: next === 'world' ? element.clientHeight : 0,
      behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    (next === 'world' ? worldRegion : skyRegion).current?.focus({ preventScroll: true });
  };

  return <div className={styles.shell} data-layer={layer}>
    <nav className={styles.camera} aria-label={c.panorama}>
      <button type="button" aria-controls={`${id}-${layer === 'world' ? 'sky' : 'world'}`} onClick={() => travel(layer === 'world' ? 'sky' : 'world')}>
        {layer === 'world' ? c.up : c.down} <span aria-hidden="true">{layer === 'world' ? '↑' : '↓'}</span>
      </button>
      <small role="status">{model?.sample ? c.sample : !model ? c.unavailable : `${model.sources.length} ${c.sources}`}</small>
    </nav>
    <div ref={viewport} className={styles.panorama} onScroll={event => {
      const element = event.currentTarget;
      if (element.clientHeight > 0) recordLayer(element.scrollTop >= element.clientHeight / 2 ? 'world' : 'sky');
    }}>
      <section id={`${id}-sky`} ref={skyRegion} className={styles.sky} aria-label={c.sky} tabIndex={-1}>
        {sky}
      </section>
      <section id={`${id}-world`} ref={worldRegion} className={styles.world} aria-label={c.world} tabIndex={-1}>
        {world}
      </section>
    </div>
    {layer === 'sky' && visibleSelection && <span className={styles.selection}>
      {model?.sources.find(source => source.id === visibleSelection.sourceId)?.label} · {visibleSelection.kind} {visibleSelection.id}
    </span>}
  </div>;
}
