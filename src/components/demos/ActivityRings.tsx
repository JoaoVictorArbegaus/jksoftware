/*
 * ActivityRings: adaptado do Apple Activity Card do kokonutui (https://kokonutui.com, MIT).
 * Metas da semana em anéis: cada anel se desenha quando aparece na tela, um depois do outro, com o número
 * contando junto; meta batida pulsa no topo e o que passa da meta dá outra volta por cima, com sombra na ponta.
 * Mudanças: TypeScript sem Tailwind, m.* do LazyMotion, cores verde-água e areia da página, textos em português.
 */
import { animate, m, useInView, useReducedMotion } from 'motion/react';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';

type Ring = { label: string; color: string; colorEnd: string; size: number; current: number; target: number; unit: string };

const EASE: [number, number, number, number] = [0.23, 1, 0.32, 1];
const STROKE = 15;
const STAGGER = 0.18;
const DRAW_S = 1.2;
const OVER_S = 0.6;
const MAX_LAPS = 3;

const RINGS: Ring[] = [
  { label: 'Vendas', color: '#9DE8DE', colorEnd: '#D6FBF6', size: 184, current: 96, target: 120, unit: 'pedidos' },
  { label: 'Atendimentos', color: '#E9C98A', colorEnd: '#F6E2B8', size: 146, current: 52, target: 40, unit: 'clientes' },
  { label: 'Entregas no prazo', color: '#5FB8C9', colorEnd: '#A4E0EA', size: 108, current: 28, target: 32, unit: 'entregas' },
];

const ratioOf = (r: Ring) => (r.target > 0 ? Math.min(Math.max(r.current / r.target, 0), MAX_LAPS) : 0);
const drawSeconds = (ratio: number) => DRAW_S + OVER_S * Math.min(Math.max(ratio - 1, 0), 1);

type Nodes = { base: SVGCircleElement | null; lap: SVGCircleElement | null; cap: SVGGElement | null; pulse: SVGCircleElement | null };

/** Um quadro do anel direto no DOM: `p` é o progresso em voltas (1 = meta). */
function paint(nodes: Nodes, count: HTMLSpanElement | null, ring: Ring, p: number, ratio: number) {
  const radius = (ring.size - STROKE) / 2;
  const c = radius * 2 * Math.PI;
  nodes.base?.setAttribute('stroke-dashoffset', `${(1 - Math.min(p, 1)) * c}`);
  const over = p > 1;
  const rest = over ? p - Math.floor(p) || 1 : 0;
  if (nodes.lap) {
    nodes.lap.setAttribute('stroke-dashoffset', `${(1 - rest) * c}`);
    nodes.lap.style.opacity = over ? '1' : '0';
  }
  if (nodes.cap) {
    nodes.cap.style.transform = `rotate(${rest * 360}deg)`;
    nodes.cap.style.opacity = over ? '1' : '0';
  }
  if (count) count.textContent = p >= ratio ? `${ring.current}` : `${Math.round((p / ratio) * ring.current)}`;
}

function RingSvg({ ring, index, inView, reduce, dimmed, onActive, countRef }: { ring: Ring; index: number; inView: boolean; reduce: boolean; dimmed: boolean; onActive: (on: boolean) => void; countRef: { current: HTMLSpanElement | null } }) {
  const radius = (ring.size - STROKE) / 2;
  const c = radius * 2 * Math.PI;
  const center = ring.size / 2;
  const ratio = ratioOf(ring);
  const gid = useId();
  const sid = useId();
  const nodes = useRef<Nodes>({ base: null, lap: null, cap: null, pulse: null });
  const shown = useRef<number | null>(null);

  useEffect(() => {
    if (!inView) return;
    const n = nodes.current;
    if (reduce || ratio === 0) {
      paint(n, countRef.current, ring, ratio, ratio);
      shown.current = ratio;
      return;
    }
    const from = shown.current;
    if (from === null) paint(n, countRef.current, ring, 0, ratio);
    let pulsed = (from ?? 0) >= 1;
    const controls = animate(from ?? 0, ratio, {
      duration: drawSeconds(ratio),
      delay: from === null ? index * STAGGER : 0,
      ease: EASE,
      onUpdate: (p) => {
        shown.current = p;
        paint(n, countRef.current, ring, p, ratio);
        // meta batida: a ponta pulsa uma vez no topo do anel
        if (!pulsed && p >= 1) {
          pulsed = true;
          n.pulse?.animate([{ transform: 'scale(1)', opacity: 0.6 }, { transform: 'scale(2.4)', opacity: 0 }], { duration: 560, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
        }
      },
    });
    return () => controls.stop();
  }, [inView, reduce, ring, ratio, index, countRef]);

  return (
    <m.div className="rings__layer" initial={{ opacity: 0, scale: 0.96 }} animate={inView ? { opacity: 1, scale: 1 } : undefined} transition={{ duration: 0.3, delay: index * STAGGER, ease: EASE }}>
      <svg
        className={dimmed ? 'rings__svg is-dim' : 'rings__svg'}
        width={ring.size}
        height={ring.size}
        viewBox={`0 0 ${ring.size} ${ring.size}`}
        role="img"
        tabIndex={0}
        aria-label={`${ring.label}: ${ring.current} de ${ring.target} ${ring.unit}, ${Math.round(ratio * 100)}%`}
        onFocus={() => onActive(true)}
        onBlur={() => onActive(false)}
        style={{ '--ring': ring.color, '--ring-end': ring.colorEnd } as CSSProperties}
      >
        <defs>
          <linearGradient id={gid} x1="0%" x2="100%" y1="0%" y2="100%">
            <stop offset="0%" stopColor={ring.color} />
            <stop offset="100%" stopColor={ring.colorEnd} />
          </linearGradient>
          <filter id={sid} x="-100%" y="-100%" width="300%" height="300%">
            <feDropShadow dx="0" dy="-2.5" floodColor="#021015" floodOpacity="0.6" stdDeviation="2" />
          </filter>
        </defs>
        {/* trilho: é o alvo do hover, então cada anel só reage sobre a própria faixa */}
        <circle
          className="rings__track"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          strokeWidth={STROKE}
          pointerEvents="stroke"
          onPointerEnter={(e) => e.pointerType === 'mouse' && onActive(true)}
          onPointerLeave={() => onActive(false)}
        />
        <circle ref={(el) => void (nodes.current.base = el)} cx={center} cy={center} r={radius} fill="none" stroke={`url(#${gid})`} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} pointerEvents="none" />
        <circle ref={(el) => void (nodes.current.lap = el)} cx={center} cy={center} r={radius} fill="none" stroke={ring.colorEnd} strokeWidth={STROKE} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c} pointerEvents="none" style={{ opacity: 0 }} />
        <g ref={(el) => void (nodes.current.cap = el)} pointerEvents="none" style={{ opacity: 0, transformBox: 'view-box', transformOrigin: 'center' }}>
          <circle cx={center + radius} cy={center} r={STROKE / 2} fill={ring.colorEnd} filter={`url(#${sid})`} />
        </g>
        <circle ref={(el) => void (nodes.current.pulse = el)} cx={center + radius} cy={center} r={STROKE / 2} fill="none" stroke={ring.colorEnd} strokeWidth={2} pointerEvents="none" style={{ opacity: 0, transformBox: 'fill-box', transformOrigin: 'center' }} />
      </svg>
    </m.div>
  );
}

export function ActivityRings() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState<number | null>(null);
  const countRefs = useRef(RINGS.map(() => ({ current: null as HTMLSpanElement | null })));
  const box = RINGS[0].size;

  return (
    <div className="rings" ref={ref}>
      <div className="rings__stack" style={{ width: box, height: box }}>
        {RINGS.map((r, i) => (
          <RingSvg
            key={r.label}
            ring={r}
            index={i}
            inView={inView}
            reduce={reduce}
            dimmed={active !== null && active !== i}
            countRef={countRefs.current[i]}
            onActive={(on) => setActive((prev) => (on ? i : prev === i ? null : prev))}
          />
        ))}
      </div>
      <m.ul className="rings__legend" initial={{ opacity: 0, x: 16 }} animate={inView ? { opacity: 1, x: 0 } : undefined} transition={{ duration: 0.5, delay: 0.3, ease: EASE }}>
        {RINGS.map((r, i) => (
          <li
            key={r.label}
            className={active !== null && active !== i ? 'is-dim' : undefined}
            onPointerEnter={(e) => e.pointerType === 'mouse' && setActive(i)}
            onPointerLeave={() => setActive(null)}
          >
            <span className="rings__name">{r.label}</span>
            <span className="rings__num" style={{ color: r.color }}>
              <span className="sr-only">
                {r.current} de {r.target} {r.unit}
              </span>
              <span aria-hidden="true">
                <span ref={(el) => void (countRefs.current[i].current = el)}>{r.current}</span>/{r.target}
                <small> {r.unit}</small>
              </span>
            </span>
          </li>
        ))}
      </m.ul>
    </div>
  );
}
