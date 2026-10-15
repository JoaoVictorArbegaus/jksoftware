/*
 * Stepper: adaptado de React Bits (https://reactbits.dev, MIT).
 * Fluxo em etapas: o indicador desliza com mola até a etapa atual, a altura do conteúdo acompanha e a etapa nova
 * entra deslizando do lado certo enquanto a anterior sai. Etapas feitas ganham um check que se desenha.
 * Mudanças: TypeScript sem @hugeicons, controlado pelo formulário (que valida antes de avançar), só o layout
 * horizontal com números, rótulos que somem em telas estreitas e cores no CSS da página.
 */
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { Icon } from './Icons';

const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;
const SPRING =
  'linear(0, 0.0603, 0.2033, 0.3821, 0.5633, 0.7258, 0.8584, 0.9574, 1.0242, 1.0634, 1.0809, 1.0828, 1.0747, 1.0613, 1.046, 1.0313, 1.0186, 1.0085, 1.0012, 0.9965, 0.994, 0.9931, 0.9933, 0.9941, 0.9953, 0.9966, 0.9978, 0.9988, 1)';
const SETTLE = 'cubic-bezier(0.22, 1, 0.36, 1)';
const spring = () => (typeof CSS !== 'undefined' && CSS.supports?.('transition-timing-function', 'linear(0, 1)') ? SPRING : 'cubic-bezier(0.34, 1.4, 0.64, 1)');
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export type StepDef = { title: string; content: ReactNode };

function Check() {
  const ref = useRef<SVGSVGElement>(null);
  useIsoLayout(() => {
    const path = ref.current?.querySelector('path');
    if (!path || reduced()) return;
    path.style.strokeDasharray = '24';
    path.animate([{ strokeDashoffset: 24 }, { strokeDashoffset: 0 }], { duration: 360, easing: SETTLE });
  }, []);
  return (
    <svg ref={ref} className="stepper__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7.5" />
    </svg>
  );
}

type Props = {
  steps: StepDef[];
  /** etapa atual, de 1 a steps.length */
  current: number;
  /** pedido para ir a uma etapa (o dono decide se deixa: valida as anteriores) */
  onGo: (step: number) => void;
  /** maior etapa já alcançada: só dá para pular pelo indicador até ela */
  reached: number;
  /** conteúdo do rodapé na última etapa (o botão de enviar) */
  finalAction: ReactNode;
  nextLabel?: string;
  backLabel?: string;
};

export function Stepper({ steps, current, onGo, reached, finalAction, nextLabel = 'Continuar', backLabel = 'Voltar' }: Props) {
  const total = steps.length;
  const [view, setView] = useState({ step: current, previous: null as number | null, direction: 1, id: 0 });
  if (view.step !== current) setView({ step: current, previous: view.step, direction: current > view.step ? 1 : -1, id: view.id + 1 });

  const trackRef = useRef<HTMLDivElement>(null);
  const gliderRef = useRef<HTMLSpanElement>(null);
  const segRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const viewportRef = useRef<HTMLDivElement>(null);
  const paneRef = useRef<HTMLDivElement>(null);
  const leavingRef = useRef<HTMLDivElement>(null);
  const heightRef = useRef(0);
  const placed = useRef(false);

  // altura atual do conteúdo, para animar até a da etapa nova
  useIsoLayout(() => {
    const vp = viewportRef.current;
    if (!vp) return;
    heightRef.current = vp.offsetHeight;
    const ro = new ResizeObserver(() => (heightRef.current = vp.offsetHeight));
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  // troca de etapa: altura com mola, a nova entra deslizando e a anterior sai para o outro lado
  useIsoLayout(() => {
    if (view.id === 0) return;
    const vp = viewportRef.current;
    const pane = paneRef.current;
    const leaving = leavingRef.current;
    const id = view.id;
    const finish = () => setView((s) => (s.id === id ? { ...s, previous: null } : s));
    // o foco vai para o primeiro campo da etapa nova
    pane?.querySelector<HTMLElement>('input, textarea, button[role="combobox"], [data-autofocus]')?.focus({ preventScroll: true });
    if (!vp || reduced()) return finish();
    for (const el of [vp, pane, leaving]) el?.getAnimations().forEach((a) => a.cancel());
    const from = heightRef.current;
    const to = vp.offsetHeight;
    if (Math.abs(from - to) > 0.5) vp.animate([{ height: `${from}px` }, { height: `${to}px` }], { duration: 560, easing: spring() });
    if (pane) {
      pane.animate([{ transform: `translateX(${view.direction * 36}px)` }, { transform: 'none' }], { duration: 560, easing: spring() });
      pane.animate([{ opacity: 0 }, { opacity: 0, offset: 0.25 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    }
    if (leaving) {
      leaving.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 140, easing: 'cubic-bezier(0.2, 0, 0.4, 1)', fill: 'forwards' });
      const exit = leaving.animate([{ transform: 'none' }, { transform: `translateX(${-view.direction * 36}px)` }], { duration: 200, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' });
      exit.onfinish = finish;
    } else finish();
  }, [view.id]);

  // o indicador desliza até a etapa atual
  useIsoLayout(() => {
    const track = trackRef.current;
    const glider = gliderRef.current;
    if (!track || !glider) return;
    const place = (animate: boolean) => {
      const seg = segRefs.current[current - 1];
      if (!seg) return;
      const sp = spring();
      glider.style.transition = animate ? `transform 560ms ${sp}, width 560ms ${sp}` : 'none';
      glider.style.transform = `translate3d(${seg.offsetLeft}px, ${seg.offsetTop}px, 0)`;
      glider.style.width = `${seg.offsetWidth}px`;
      glider.style.height = `${seg.offsetHeight}px`;
      glider.style.opacity = '1';
    };
    place(placed.current && !reduced());
    placed.current = true;
    const ro = new ResizeObserver(() => place(false));
    ro.observe(track);
    return () => ro.disconnect();
  }, [current]);

  const isLast = current === total;
  return (
    <div className="stepper">
      <div ref={trackRef} className="stepper__track">
        <span ref={gliderRef} className="stepper__glider" aria-hidden="true" />
        {steps.map((s, i) => {
          const n = i + 1;
          const status = n < current ? 'complete' : n === current ? 'active' : 'upcoming';
          return (
            <button
              key={s.title}
              ref={(el) => void (segRefs.current[i] = el)}
              type="button"
              className="stepper__segment"
              data-status={status}
              aria-label={`Etapa ${n} de ${total}: ${s.title}`}
              aria-current={n === current ? 'step' : undefined}
              disabled={n === current || n > reached}
              onClick={() => onGo(n)}
            >
              <span className="stepper__badge" data-status={status}>
                {status === 'complete' ? <Check /> : n}
              </span>
              <span className="stepper__title">{s.title}</span>
            </button>
          );
        })}
      </div>
      <div ref={viewportRef} className="stepper__viewport">
        {view.previous !== null && (
          <div key={view.id - 1} ref={leavingRef} className="stepper__pane stepper__pane--leaving" aria-hidden="true" inert>
            {steps[view.previous - 1]?.content}
          </div>
        )}
        <div key={view.id} ref={paneRef} className="stepper__pane">
          {steps[view.step - 1]?.content}
        </div>
      </div>
      <div className="stepper__footer">
        <button type="button" className="stepper__button stepper__button--back" data-hidden={current <= 1 ? '' : undefined} tabIndex={current <= 1 ? -1 : undefined} onClick={() => onGo(current - 1)}>
          <Icon name="arrow" className="stepper__back-ic" />
          {backLabel}
        </button>
        {/* chaves diferentes: o "Continuar" não pode virar o botão de enviar no meio do próprio clique
            (o React reaproveitaria o mesmo <button>, e o navegador terminaria o clique como envio) */}
        {isLast ? (
          <span key="final" className="stepper__final">
            {finalAction}
          </span>
        ) : (
          <button key="next" type="button" className="stepper__button stepper__button--next" onClick={() => onGo(current + 1)}>
            {nextLabel}
            <Icon name="arrow" />
          </button>
        )}
      </div>
    </div>
  );
}
