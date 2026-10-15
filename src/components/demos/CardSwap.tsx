/*
 * CardSwap: adaptado de React Bits (https://reactbits.dev, MIT).
 * Pilha de cards em perspectiva que troca sozinha: o da frente sai com mola e vai para o fundo. Dá para arrastar
 * e jogar o da frente para qualquer lado, clicar num card de trás para trazê-lo e usar as setas do teclado;
 * com o mouse em cima, a pilha se abre um pouco e segue o cursor (paralaxe).
 * Mudanças: TypeScript, cards vindos como filhos (sem a lista de fotos nem @hugeicons), cores no CSS da página.
 */
import { Children, useEffect, useLayoutEffect, useMemo, useRef, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';

const PERSPECTIVE = 900;
const TAU = Math.PI * 2;
const STEP = 1 / 240;
const PAD = 32;
const AXES = ['x', 'y', 'z', 'r', 'p'] as const;
const DOWN = { x: 0, y: 1 };

type Axis = (typeof AXES)[number];
type Vec = Record<Axis, number>;
type Card = Vec & {
  el: HTMLDivElement | null;
  shade: HTMLSpanElement | null;
  index: number;
  pos: number;
  from: number;
  hold: number;
  nudge: number;
  phase: 'rest' | 'exit' | 'enter' | 'drag';
  dir: { x: number; y: number };
  tilt: number;
  top: number;
  under: boolean;
  v: Vec;
};

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function stackBounds(width: number, height: number, dx: number, dy: number, dz: number, skew: number, visible: number, hoverSpread: number) {
  const slope = Math.tan((skew * Math.PI) / 180);
  const spread = 1 + Math.max(0, hoverSpread);
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (let i = 0; i < visible; i++) {
    const scale = PERSPECTIVE / (PERSPECTIVE + i * dz);
    for (const u of [-width / 2, width / 2]) {
      for (const v of [-height / 2, height / 2]) {
        const x = (i * dx * spread + u) * scale;
        const y = (-i * dy * spread + v + u * slope) * scale;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  }
  return { width: Math.ceil(maxX - minX + PAD * 2), height: Math.ceil(maxY - minY + PAD * 2), originX: PAD - minX, originY: PAD - minY };
}

type Props = {
  children: ReactNode;
  label: string;
  width?: number;
  height?: number;
  cardDistance?: number;
  verticalDistance?: number;
  depth?: number;
  skewAmount?: number;
  delay?: number;
  bounce?: number;
  parallax?: number;
  hoverSpread?: number;
  dim?: number;
  onChange?: (front: number) => void;
};

export function CardSwap({ children, label, width = 400, height = 280, cardDistance = 50, verticalDistance = 56, depth = 90, skewAmount = 5, delay = 3800, bounce = 0.35, parallax = 0.5, hoverSpread = 0.12, dim = 0.5, onChange }: Props) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const slotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const shadeRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const apiRef = useRef<{ next: () => void; prev: () => void } | null>(null);
  const cards = useMemo(() => Children.toArray(children), [children]);
  const count = cards.length;
  const visible = count;
  const bounds = useMemo(() => stackBounds(width, height, cardDistance, verticalDistance, depth, skewAmount, visible, hoverSpread), [width, height, cardDistance, verticalDistance, depth, skewAmount, visible, hoverSpread]);
  const settings = useRef({ width, height, dx: cardDistance, dy: verticalDistance, dz: depth, skew: skewAmount, visible, delay, bounce, parallax, hoverSpread, dim, bounds, onChange });
  settings.current = { width, height, dx: cardDistance, dy: verticalDistance, dz: depth, skew: skewAmount, visible, delay, bounce, parallax, hoverSpread, dim, bounds, onChange };

  useIsoLayout(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage || !count) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = performance.now();
    const deck: Card[] = Array.from({ length: count }, (_, index) => ({
      el: slotRefs.current[index],
      shade: shadeRefs.current[index],
      index,
      pos: index,
      from: index,
      hold: 0,
      nudge: 0,
      phase: 'rest',
      dir: { x: 0, y: 1 },
      tilt: 0,
      top: 0,
      under: false,
      x: 0,
      y: 0,
      z: 0,
      r: 0,
      p: 0,
      v: { x: 0, y: 0, z: 0, r: 0, p: 0 },
    }));
    const st = {
      order: deck.map((c) => c.index),
      raf: 0,
      last: 0,
      timer: 0,
      queue: [] as number[],
      layers: 0,
      scale: 1,
      hovered: false,
      overCard: false,
      inView: true,
      drag: null as null | { id: number; index: number; startX: number; startY: number; active: boolean; samples: { x: number; y: number; t: number }[] },
      spread: 0,
      spreadV: 0,
      px: 0,
      py: 0,
      pvx: 0,
      pvy: 0,
      tx: 0,
      ty: 0,
      dragged: false,
    };
    type S = typeof settings.current;

    const slot = (position: number, s: S): Vec => {
      const q = Math.min(position, s.visible);
      const spread = 1 + st.spread;
      return { x: q * s.dx * spread, y: -q * s.dy * spread, z: -q * s.dz, r: 0, p: q };
    };
    const clearance = (s: S, dir: { x: number; y: number }) => Math.abs(dir.x) * s.width + Math.abs(dir.y) * s.height + 12;
    const targetOf = (c: Card, s: S, time: number): Vec => {
      if (c.phase === 'exit') {
        const base = slot(0, s);
        const reach = clearance(s, c.dir) * 1.3;
        return { x: base.x + c.dir.x * reach, y: base.y + c.dir.y * reach, z: base.z, r: c.tilt, p: 0 };
      }
      if (c.phase === 'enter') {
        const base = slot(0, s);
        return { x: base.x, y: base.y + clearance(s, DOWN) * 1.3, z: base.z, r: 0, p: c.p };
      }
      return slot(Math.max(0, (time < c.hold ? c.from : c.pos) + c.nudge), s);
    };
    const layerOf = (c: Card) => (c.top ? 1000 + c.top : c.under ? 1 : 10 + (count - c.pos) * 2);
    const write = (c: Card, s: S) => {
      const { el, shade } = c;
      if (!el) return;
      el.style.transform = `translate3d(${c.x.toFixed(2)}px, ${c.y.toFixed(2)}px, ${c.z.toFixed(2)}px) rotate(${c.r.toFixed(3)}deg) skewY(${s.skew}deg)`;
      el.style.zIndex = String(layerOf(c));
      const fade = clamp(s.visible - c.p, 0, 1);
      el.style.opacity = fade < 1 ? fade.toFixed(3) : '';
      el.style.visibility = fade <= 0.001 ? 'hidden' : '';
      if (shade) shade.style.opacity = (s.dim * 0.62 * clamp(c.p / Math.max(1, s.visible - 1), 0, 1)).toFixed(3);
      el.style.cursor = c.phase === 'drag' ? 'grabbing' : c.pos > 0 ? 'pointer' : 'grab';
      if (c.pos === 0) el.setAttribute('data-front', '');
      else el.removeAttribute('data-front');
      el.setAttribute('aria-hidden', c.pos === 0 ? 'false' : 'true');
    };
    const writeStage = (s: S) => {
      stage.style.perspectiveOrigin = `${(s.bounds.originX + st.px).toFixed(2)}px ${(s.bounds.originY + st.py).toFixed(2)}px`;
    };
    const integrate = (c: Card, target: Vec, omega: number, zeta: number, dt: number) => {
      const k = omega * omega;
      const d = 2 * zeta * omega;
      const steps = Math.max(1, Math.ceil(dt / STEP));
      const h = dt / steps;
      for (let i = 0; i < steps; i++) {
        for (const a of AXES) {
          c.v[a] += (k * (target[a] - c[a]) - d * c.v[a]) * h;
          c[a] += c.v[a] * h;
        }
      }
    };
    const scalar = (value: number, velocity: number, target: number, omega: number, zeta: number, dt: number) => {
      const k = omega * omega;
      const d = 2 * zeta * omega;
      const steps = Math.max(1, Math.ceil(dt / STEP));
      const h = dt / steps;
      let x = value;
      let v = velocity;
      for (let i = 0; i < steps; i++) {
        v += (k * (target - x) - d * v) * h;
        x += v * h;
      }
      return [x, v] as const;
    };

    const frame = (time: number) => {
      st.raf = 0;
      const s = settings.current;
      const dt = st.last ? Math.min(0.05, (time - st.last) / 1000) : 1 / 60;
      st.last = time;
      const restOmega = TAU * 1.7;
      const restZeta = reduce ? 1 : 1 - 0.72 * s.bounce;
      const exitOmega = TAU * 1.9;
      let busy = false;
      const spreadTarget = st.hovered && !reduce ? s.hoverSpread : 0;
      [st.spread, st.spreadV] = scalar(st.spread, st.spreadV, spreadTarget, TAU * 1.4, 0.9, dt);
      [st.px, st.pvx] = scalar(st.px, st.pvx, reduce ? 0 : st.tx, TAU * 1.1, 1, dt);
      [st.py, st.pvy] = scalar(st.py, st.pvy, reduce ? 0 : st.ty, TAU * 1.1, 1, dt);
      if (Math.abs(st.spread - spreadTarget) > 0.0005 || Math.abs(st.spreadV) > 0.0005 || Math.abs(st.px - st.tx) > 0.05 || Math.abs(st.py - st.ty) > 0.05 || Math.abs(st.pvx) + Math.abs(st.pvy) > 0.05) busy = true;
      writeStage(s);
      for (const c of deck) {
        if (c.phase === 'drag') {
          busy = true;
          write(c, s);
          continue;
        }
        const target = targetOf(c, s, time);
        const moving = c.phase === 'exit' || c.phase === 'enter';
        integrate(c, target, moving ? exitOmega : restOmega, moving ? 1 : restZeta, dt);
        if (c.phase === 'exit') {
          const base = slot(0, s);
          if ((c.x - base.x) * c.dir.x + (c.y - base.y) * c.dir.y >= clearance(s, c.dir)) {
            c.phase = 'rest';
            c.top = 0;
            c.hold = 0;
          }
        } else if (c.phase === 'enter') {
          const base = slot(0, s);
          if (c.y - base.y >= clearance(s, DOWN)) {
            c.phase = 'rest';
            c.under = false;
            c.hold = 0;
          }
        }
        if (c.hold > time || c.phase !== 'rest') busy = true;
        for (const a of AXES) {
          const limit = a === 'p' ? 0.001 : 0.02;
          if (Math.abs(target[a] - c[a]) > limit || Math.abs(c.v[a]) > limit) busy = true;
        }
        write(c, s);
      }
      if (busy) st.raf = requestAnimationFrame(frame);
      else {
        st.last = 0;
        for (const c of deck) if (c.top && c.phase === 'rest') c.top = 0;
      }
    };
    const wake = () => {
      if (!st.raf) st.raf = requestAnimationFrame(frame);
    };
    const paused = () => count < 2 || st.overCard || !!st.drag || !st.inView || document.visibilityState === 'hidden';
    const schedule = () => {
      window.clearTimeout(st.timer);
      st.timer = 0;
      if (paused()) return;
      st.timer = window.setTimeout(() => {
        st.timer = 0;
        shift(1);
      }, Math.max(400, settings.current.delay));
    };
    const settleOrder = (time: number, stagger: number) => {
      st.order.forEach((index, position) => {
        const c = deck[index];
        if (c.pos === position) return;
        c.from = c.pos;
        c.pos = position;
        c.hold = time + Math.max(0, position) * stagger;
      });
    };
    const shift = (direction: number, opts: { dir?: { x: number; y: number }; tilt?: number; velocity?: { x: number; y: number } } = {}) => {
      if (count < 2) return;
      const time = performance.now();
      if (direction > 0) {
        const front = deck[st.order[0]];
        st.order = [...st.order.slice(1), front.index];
        settleOrder(time, 50);
        front.phase = 'exit';
        front.dir = opts.dir ?? DOWN;
        front.tilt = opts.tilt ?? 0;
        front.top = ++st.layers;
        front.under = false;
        front.nudge = 0;
        front.hold = 0;
        if (opts.velocity) {
          front.v.x = opts.velocity.x;
          front.v.y = opts.velocity.y;
        }
      } else {
        const back = deck[st.order[count - 1]];
        st.order = [back.index, ...st.order.slice(0, count - 1)];
        settleOrder(time, 50);
        back.phase = 'enter';
        back.top = 0;
        back.under = true;
        back.nudge = 0;
        back.hold = 0;
      }
      deck.forEach((c) => {
        if (c.phase === 'rest') c.nudge = 0;
      });
      settings.current.onChange?.(st.order[0]);
      wake();
      schedule();
    };
    const goTo = (position: number) => {
      st.queue.forEach(window.clearTimeout);
      st.queue = [];
      for (let i = 0; i < position; i++) st.queue.push(window.setTimeout(() => shift(1), i * 110));
    };
    const fit = () => {
      const s = settings.current;
      const scale = Math.min(1, root.clientWidth / s.bounds.width, root.clientHeight > 0 ? root.clientHeight / s.bounds.height : 1);
      st.scale = scale > 0 ? scale : 1;
      stage.style.transform = `translate(-50%, -50%) scale(${st.scale.toFixed(4)})`;
    };
    const local = (e: PointerEvent) => {
      const b = root.getBoundingClientRect();
      return { x: e.clientX - b.left, y: e.clientY - b.top, w: b.width, h: b.height };
    };
    const onMove = (e: PointerEvent) => {
      const s = settings.current;
      if (e.pointerType !== 'touch') {
        const pt = local(e);
        st.tx = clamp((pt.x / Math.max(1, pt.w)) * 2 - 1, -1, 1) * s.parallax * 0.35 * s.bounds.width;
        st.ty = clamp((pt.y / Math.max(1, pt.h)) * 2 - 1, -1, 1) * s.parallax * 0.35 * s.bounds.height;
        st.hovered = true;
        const over = !!(e.target as Element).closest?.('[data-swap-index]');
        if (over !== st.overCard) {
          st.overCard = over;
          schedule();
        }
        wake();
      }
      const g = st.drag;
      if (!g || g.id !== e.pointerId) return;
      const dx = (e.clientX - g.startX) / st.scale;
      const dy = (e.clientY - g.startY) / st.scale;
      if (!g.active) {
        if (Math.hypot(dx, dy) < 5) return;
        g.active = true;
        st.dragged = true;
        const c = deck[g.index];
        c.phase = 'drag';
        c.v = { x: 0, y: 0, z: 0, r: 0, p: 0 };
        root.setPointerCapture?.(e.pointerId);
        root.style.cursor = 'grabbing';
      }
      const c = deck[g.index];
      const base = slot(0, s);
      c.x = base.x + dx;
      c.y = base.y + dy;
      c.z = base.z;
      c.r = clamp(dx * 0.035, -9, 9);
      c.p = 0;
      const time = performance.now();
      g.samples.push({ x: c.x, y: c.y, t: time });
      while (g.samples.length > 2 && time - g.samples[0].t > 90) g.samples.shift();
      const next = deck[st.order[1]];
      if (next && next.phase === 'rest') next.nudge = -0.22 * clamp(Math.hypot(dx, dy) / (Math.min(s.width, s.height) * 0.3), 0, 1);
      wake();
    };
    const onLeave = (e: PointerEvent) => {
      if (e.pointerType === 'touch' || st.drag?.active) return;
      st.hovered = false;
      st.overCard = false;
      st.tx = st.ty = 0;
      schedule();
      wake();
    };
    const onDown = (e: PointerEvent) => {
      st.dragged = false;
      if (e.button > 0 || count < 2) return;
      const target = (e.target as Element).closest?.('[data-swap-index]');
      if (!target || !root.contains(target)) return;
      const index = Number(target.getAttribute('data-swap-index'));
      if (index !== st.order[0] || deck[index].phase !== 'rest') return;
      st.drag = { id: e.pointerId, index, startX: e.clientX, startY: e.clientY, active: false, samples: [] };
      schedule();
    };
    const onUp = (e: PointerEvent) => {
      const g = st.drag;
      if (!g || g.id !== e.pointerId) return;
      st.drag = null;
      root.style.cursor = '';
      if (!g.active) return schedule();
      root.releasePointerCapture?.(e.pointerId);
      const s = settings.current;
      const c = deck[g.index];
      const base = slot(0, s);
      const first = g.samples[0];
      const last = g.samples[g.samples.length - 1];
      const span = first && last ? Math.max(0.016, (last.t - first.t) / 1000) : 1;
      const velocity = first && last && last !== first ? { x: (last.x - first.x) / span, y: (last.y - first.y) / span } : { x: 0, y: 0 };
      const off = { x: c.x - base.x, y: c.y - base.y };
      const next = deck[st.order[1]];
      if (next) next.nudge = 0;
      if (e.type !== 'pointercancel' && (Math.hypot(off.x, off.y) > Math.min(s.width, s.height) * 0.3 || Math.hypot(velocity.x, velocity.y) > 700)) {
        const aim = { x: off.x + velocity.x * 0.12, y: off.y + velocity.y * 0.12 };
        const len = Math.hypot(aim.x, aim.y) || 1;
        c.phase = 'rest';
        shift(1, { dir: { x: aim.x / len, y: aim.y / len }, tilt: c.r, velocity });
      } else {
        c.phase = 'rest';
        c.v.x = velocity.x;
        c.v.y = velocity.y;
        wake();
        schedule();
      }
    };
    const onClick = (e: MouseEvent) => {
      if (st.dragged) {
        st.dragged = false;
        return;
      }
      const target = (e.target as Element).closest?.('[data-swap-index]');
      if (!target || !root.contains(target)) return;
      const position = st.order.indexOf(Number(target.getAttribute('data-swap-index')));
      if (position > 0) goTo(position);
    };
    const onVisibility = () => schedule();

    apiRef.current = { next: () => shift(1), prev: () => shift(-1) };

    if (!reduce) {
      deck.forEach((c) => {
        c.from = 0;
        c.hold = now + c.pos * 70;
      });
      stage.animate?.([{ opacity: 0 }, { opacity: 1 }], { duration: 420, easing: 'ease-out' });
    } else deck.forEach((c) => Object.assign(c, slot(c.pos, settings.current)));
    fit();
    writeStage(settings.current);
    deck.forEach((c) => write(c, settings.current));
    wake();

    const ro = new ResizeObserver(fit);
    ro.observe(root);
    const io = new IntersectionObserver((entries) => {
      st.inView = entries[entries.length - 1]?.isIntersecting ?? true;
      schedule();
    });
    io.observe(root);
    root.addEventListener('pointermove', onMove);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('pointerdown', onDown);
    root.addEventListener('pointerup', onUp);
    root.addEventListener('pointercancel', onUp);
    root.addEventListener('click', onClick);
    document.addEventListener('visibilitychange', onVisibility);
    schedule();
    return () => {
      cancelAnimationFrame(st.raf);
      window.clearTimeout(st.timer);
      st.queue.forEach(window.clearTimeout);
      ro.disconnect();
      io.disconnect();
      root.removeEventListener('pointermove', onMove);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('pointerdown', onDown);
      root.removeEventListener('pointerup', onUp);
      root.removeEventListener('pointercancel', onUp);
      root.removeEventListener('click', onClick);
      document.removeEventListener('visibilitychange', onVisibility);
      apiRef.current = null;
    };
  }, [count]);

  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      apiRef.current?.next();
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      apiRef.current?.prev();
    }
  };

  const style = {
    '--swap-w': `${width}px`,
    '--swap-h': `${height}px`,
    '--swap-ox': `${bounds.originX}px`,
    '--swap-oy': `${bounds.originY}px`,
    '--swap-stage-w': `${bounds.width}px`,
    '--swap-stage-h': `${bounds.height}px`,
    '--swap-ratio': `${bounds.width} / ${bounds.height}`,
  } as CSSProperties;

  return (
    <div ref={rootRef} className="card-swap" style={style} tabIndex={0} role="region" aria-roledescription="carrossel" aria-label={label} onKeyDown={onKey}>
      <div className="card-swap__sizer" aria-hidden="true">
        <span />
      </div>
      <div ref={stageRef} className="card-swap__stage">
        {cards.map((card, i) => (
          <div key={i} ref={(el) => void (slotRefs.current[i] = el)} className="card-swap__slot" data-swap-index={i}>
            {card}
            <span ref={(el) => void (shadeRefs.current[i] = el)} className="card-swap__shade" aria-hidden="true" />
          </div>
        ))}
      </div>
    </div>
  );
}
