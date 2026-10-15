/*
 * CurvedLoop: adaptado de React Bits (https://reactbits.dev, MIT).
 * Faixa de texto correndo num arco. Dá para arrastar (e arremessar: ela continua no sentido do arremesso) e
 * acelera um pouco com a rolagem da página. Parada fora da tela; com movimento reduzido, fica parada.
 * Mudanças: TypeScript, só o formato em arco, separador colorido e borda em fade; tipografia vinda do CSS.
 */
import { Fragment, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type PointerEvent } from 'react';

const VIEW_WIDTH = 1440;
const MAX_FLING = 4000;

const wrap = (v: number, len: number) => (len > 0 ? (((v % len) + len) % len) - len : v);

/** Máscara de fade nas pontas, com rampa suave (smootherstep). */
function edgeMask(amount: number) {
  const size = Math.min(Math.max(amount, 0), 1) * 50;
  if (size <= 0) return undefined;
  const left: string[] = [];
  const right: string[] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const a = (t * t * t * (t * (t * 6 - 15) + 10)).toFixed(3);
    left.push(`rgba(0, 0, 0, ${a}) ${(t * size).toFixed(2)}%`);
    right.unshift(`rgba(0, 0, 0, ${a}) ${(100 - t * size).toFixed(2)}%`);
  }
  return `linear-gradient(to right, ${[...left, ...right].join(', ')})`;
}

type Props = {
  text: string;
  separator: string;
  /** px por quadro a 60 fps */
  speed?: number;
  curveAmount?: number;
  fontSize?: number;
  edgeFade?: number;
  scrollBoost?: number;
};

export function CurvedLoop({ text, separator, speed = 1.2, curveAmount = 220, fontSize = 72, edgeFade = 0.18, scrollBoost = 0.5 }: Props) {
  const body = text.replace(/\s+$/, '');
  const full = `${body} ${separator} `;
  const pathId = `curva-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;
  const jacketRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const measureRef = useRef<SVGTextElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const textPaths = useRef<SVGTextPathElement[]>([]);
  const [spacing, setSpacing] = useState(0);
  const [pathLength, setPathLength] = useState(0);
  const [dragging, setDragging] = useState(false);
  const spacingRef = useRef(0);
  const offset = useRef(0);
  const velocity = useRef(0);
  const direction = useRef(-1);
  const scroll = useRef({ distance: 0, level: 0 });
  const drag = useRef({ active: false, x: 0, time: 0, scale: 1, velocity: 0 });

  const d = `M-100,70 Q500,${70 + curveAmount} 1540,70`;
  const ready = spacing > 0;
  const copies = ready ? Math.ceil((pathLength || 1800) / spacing) + 2 : 1;
  const mask = useMemo(() => edgeMask(edgeFade), [edgeFade]);

  const apply = () => {
    for (const n of textPaths.current) n.setAttribute('startOffset', `${offset.current}px`);
  };

  // mede a largura de uma repetição (de novo quando a fonte carrega ou o tamanho muda)
  useLayoutEffect(() => {
    const measure = () => {
      if (measureRef.current) setSpacing(measureRef.current.getComputedTextLength());
    };
    measure();
    let alive = true;
    document.fonts?.ready.then(() => alive && measure());
    const ro = new ResizeObserver(measure);
    if (svgRef.current) ro.observe(svgRef.current);
    return () => {
      alive = false;
      ro.disconnect();
    };
  }, [full, fontSize]);

  useLayoutEffect(() => {
    if (pathRef.current) setPathLength(pathRef.current.getTotalLength());
  }, [d]);

  useLayoutEffect(() => {
    if (!ready) return;
    spacingRef.current = spacing;
    offset.current = wrap(offset.current, spacing);
  }, [ready, spacing]);

  useLayoutEffect(() => {
    textPaths.current = svgRef.current ? Array.from(svgRef.current.querySelectorAll('textPath')) : [];
    apply();
  });

  // a rolagem da página dá um empurrão na faixa
  useEffect(() => {
    if (!scrollBoost) return;
    let prev = window.scrollY;
    const onScroll = () => {
      scroll.current.distance += Math.abs(window.scrollY - prev);
      prev = window.scrollY;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [scrollBoost]);

  useEffect(() => {
    if (!ready) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let last = 0;
    let visible = true;
    const tick = (now: number) => {
      frame = 0;
      if (!visible) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const sc = scroll.current;
      const rate = dt > 0 ? sc.distance / dt : 0;
      sc.distance = 0;
      sc.level += (rate - sc.level) * (1 - Math.exp(-dt * (rate > sc.level ? 10 : 2.4)));
      if (!drag.current.active) {
        const target = reduce ? 0 : direction.current * speed * 60;
        const extra = reduce ? 0 : direction.current * sc.level * scrollBoost * 0.3;
        velocity.current += (target - velocity.current) * (1 - Math.exp(-dt * 3));
        const step = (velocity.current + extra) * dt;
        if (Math.abs(step) > 0.0001) {
          offset.current = wrap(offset.current + step, spacingRef.current);
          apply();
        }
      }
      frame = requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      if (visible && !frame) {
        last = 0;
        scroll.current.level = 0;
        frame = requestAnimationFrame(tick);
      }
    });
    if (jacketRef.current) io.observe(jacketRef.current);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      io.disconnect();
    };
  }, [ready, speed, scrollBoost]);

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!ready) return;
    const w = svgRef.current?.getBoundingClientRect().width || VIEW_WIDTH;
    drag.current = { active: true, x: e.clientX, time: performance.now(), scale: VIEW_WIDTH / w, velocity: 0 };
    velocity.current = 0;
    setDragging(true);
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const g = drag.current;
    if (!g.active) return;
    const now = performance.now();
    const delta = (e.clientX - g.x) * g.scale;
    const dt = Math.max(now - g.time, 1) / 1000;
    g.x = e.clientX;
    g.time = now;
    g.velocity = g.velocity * 0.5 + (delta / dt) * 0.5;
    offset.current = wrap(offset.current + delta, spacingRef.current);
    apply();
  };
  const endDrag = () => {
    const g = drag.current;
    if (!g.active) return;
    g.active = false;
    setDragging(false);
    // arremesso: a faixa segue a velocidade da mão e passa a correr para aquele lado
    const fling = performance.now() - g.time > 100 ? 0 : Math.max(-MAX_FLING, Math.min(MAX_FLING, g.velocity));
    velocity.current = fling;
    if (Math.abs(fling) > 60) direction.current = fling > 0 ? 1 : -1;
  };

  return (
    <div
      ref={jacketRef}
      className={dragging ? 'curved-loop is-dragging' : 'curved-loop'}
      style={{ visibility: ready ? 'visible' : 'hidden', maskImage: mask, WebkitMaskImage: mask }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onLostPointerCapture={endDrag}
    >
      <svg ref={svgRef} className="curved-loop__svg" viewBox={`0 0 ${VIEW_WIDTH} 200`} style={{ fontSize }} role="img" aria-label={`${body.replaceAll(` ${separator} `, ', ')}`}>
        <text ref={measureRef} xmlSpace="preserve" style={{ visibility: 'hidden', opacity: 0, pointerEvents: 'none' }}>
          {full}
        </text>
        <defs>
          <path ref={pathRef} id={pathId} d={d} fill="none" stroke="transparent" />
        </defs>
        {ready && (
          <text xmlSpace="preserve" className="curved-loop__text">
            <textPath href={`#${pathId}`} xmlSpace="preserve">
              {Array.from({ length: copies }, (_, i) => (
                <Fragment key={i}>
                  {body.split(` ${separator} `).map((part, j, arr) => (
                    <Fragment key={j}>
                      {part}
                      {' '}
                      {j < arr.length - 1 && (
                        <>
                          <tspan className="curved-loop__sep">{separator}</tspan>
                          {' '}
                        </>
                      )}
                    </Fragment>
                  ))}
                  <tspan className="curved-loop__sep">{separator}</tspan>
                  {' '}
                </Fragment>
              ))}
            </textPath>
          </text>
        )}
      </svg>
    </div>
  );
}
