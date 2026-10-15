/*
 * TearButton: adaptado do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Cupom de desconto com canhoto: arraste o canhoto e a serrilha vai cedendo furo a furo (prende, solta, prende,
 * como papel de verdade); passou do ponto, ele se solta e cai girando. Pelo teclado, Enter destaca sozinho.
 * Mudanças: TypeScript sem Tailwind, cupom em português no verde-água da página, tamanho que cabe no celular.
 */
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';

const HEIGHT = 68;
const BODY_WIDTH = 206;
const STUB_WIDTH = 72;
const TEAR_ANGLE = 34;
const HOLES = 7;
const HOLD = 0.55;
const HOLD_SHARE = 0.3;
const SWING_STIFFNESS = 900;
const SWING_DAMPING = 42;
const RETURN_STIFFNESS = 520;
const RETURN_DAMPING = 22;
const GRAVITY = 2600;
const FALL_DISTANCE = 220;
const STEP = 1 / 120;
const RESET_AFTER = 2600;
const FIBRES = [1.6, 0.4, 2.2, 0.9, 1.8, 0.2, 2.4, 1.1, 0.5, 2, 1.4, 0.3, 2.3, 0.8, 1.7, 0.1, 2.1, 1.2, 0.6, 1.9];
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';

type Phase = 'idle' | 'tearing' | 'flying' | 'torn';

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);
const haptic = (ms: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
};

/** Puxão (0..1+) para quanto o rasgo andou, segurando em cada furo. */
function stickSlip(pull: number) {
  const scaled = clamp(pull, 0, 1) * HOLES;
  const hole = Math.min(Math.floor(scaled), HOLES - 1);
  const f = scaled - hole;
  const given = f < HOLD ? (f / HOLD) * HOLD_SHARE : HOLD_SHARE + ((f - HOLD) / (1 - HOLD)) * (1 - HOLD_SHARE);
  return (hole + given) / HOLES;
}

/** Um lado do rasgo como clip-path: irregular até `tip`, reto abaixo. */
function tornEdge(tip: number, width: number, side: 1 | -1) {
  const pts: string[] = [];
  const edge = side === 1 ? width : 0;
  const far = side === 1 ? 0 : width;
  pts.push(`${far}px 0px`);
  const rows = Math.ceil((tip / HEIGHT) * FIBRES.length);
  for (let k = 0; k <= rows; k++) {
    const y = Math.min((k / FIBRES.length) * HEIGHT, tip);
    pts.push(`${(edge - side * FIBRES[k % FIBRES.length]).toFixed(1)}px ${y.toFixed(1)}px`);
  }
  pts.push(`${edge}px ${tip.toFixed(1)}px`, `${edge}px ${HEIGHT}px`, `${far}px ${HEIGHT}px`);
  return `polygon(${pts.join(',')})`;
}

const NOTCH = 7;
const bodyMask = `radial-gradient(circle at 100% 0, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) top / 100% 51% no-repeat, radial-gradient(circle at 100% 100%, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) bottom / 100% 51% no-repeat`;
const stubMask = `radial-gradient(circle at 0 0, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) top / 100% 51% no-repeat, radial-gradient(circle at 0 100%, #0000 ${NOTCH}px, #000 ${NOTCH + 0.5}px) bottom / 100% 51% no-repeat`;

export function TearButton() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [generation, setGeneration] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const stubRef = useRef<HTMLButtonElement>(null);
  const sim = useRef({ angle: 0, speed: 0, target: 0, held: false, grabAngle: 0, hole: 0, raf: 0, last: 0, carry: 0, x: 0, y: 0, vx: 0, vy: 0, spin: 0, px: 0, py: 0, pt: 0, pvx: 0, pvy: 0, auto: 0, flying: false, reduce: false });

  const hinge = useCallback(() => {
    const r = rootRef.current?.getBoundingClientRect();
    return r ? { x: r.left + BODY_WIDTH, y: r.top + HEIGHT } : { x: 0, y: 0 };
  }, []);

  const drawTear = useCallback(() => {
    const s = sim.current;
    const tip = clamp(s.angle / TEAR_ANGLE, 0, 1) * HEIGHT;
    if (bodyRef.current) bodyRef.current.style.clipPath = tip > 0.5 ? tornEdge(tip, BODY_WIDTH, 1) : '';
    if (stubRef.current) {
      stubRef.current.style.clipPath = tip > 0.5 ? tornEdge(tip, STUB_WIDTH, -1) : '';
      stubRef.current.style.transform = `rotate(${s.angle.toFixed(2)}deg)`;
    }
  }, []);

  const drawFlight = useCallback(() => {
    const s = sim.current;
    const stub = stubRef.current;
    if (!stub) return;
    const fade = clamp(1 - (s.y - FALL_DISTANCE * 0.5) / (FALL_DISTANCE * 0.5), 0, 1);
    stub.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px) rotate(${s.angle.toFixed(1)}deg)`;
    stub.style.opacity = fade.toFixed(3);
  }, []);

  // solta: sai com o balanço que tinha, mais o arremesso da mão
  const detach = useCallback(() => {
    const s = sim.current;
    s.held = false;
    haptic(14);
    const rad = (s.angle * Math.PI) / 180;
    const tangential = ((s.speed * Math.PI) / 180) * HEIGHT;
    s.x = s.y = 0;
    s.vx = Math.cos(rad) * tangential + clamp(s.pvx, -900, 900) * 0.6 + 90;
    s.vy = Math.sin(rad) * tangential + clamp(s.pvy, -900, 900) * 0.6 - 120;
    s.spin = s.speed * 0.6 + 140;
    s.flying = true;
    if (stubRef.current) stubRef.current.style.transition = 'none';
    setPhase('flying');
  }, []);

  const stepSwing = useCallback(() => {
    const s = sim.current;
    const stiff = s.held || s.auto ? SWING_STIFFNESS : RETURN_STIFFNESS;
    const damp = s.held || s.auto ? SWING_DAMPING : RETURN_DAMPING;
    s.speed += ((s.target - s.angle) * stiff - s.speed * damp) * STEP;
    s.angle += s.speed * STEP;
    // um tique a cada furo que cede
    const hole = Math.floor(clamp(s.angle / TEAR_ANGLE, 0, 1) * HOLES);
    if (hole > s.hole) haptic(3);
    s.hole = hole;
    return s.angle >= TEAR_ANGLE * 0.995;
  }, []);

  const stepFlight = useCallback(() => {
    const s = sim.current;
    s.vy += GRAVITY * STEP;
    s.x += s.vx * STEP;
    s.y += s.vy * STEP;
    s.angle += s.spin * STEP;
    return s.y > FALL_DISTANCE;
  }, []);

  const advance = useCallback(
    (elapsed: number) => {
      const s = sim.current;
      s.carry += elapsed;
      let finished = false;
      while (s.carry >= STEP && !finished) {
        s.carry -= STEP;
        if (s.flying) finished = stepFlight();
        else if (s.auto) {
          s.target = Math.min(s.target + STEP * 60, TEAR_ANGLE * 1.05);
          finished = stepSwing();
        } else finished = stepSwing() && s.held;
      }
      return finished;
    },
    [stepFlight, stepSwing],
  );

  const tick = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      const elapsed = s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP;
      s.last = now;
      const flying = s.flying;
      const finished = advance(elapsed);
      if (flying) {
        drawFlight();
        if (finished) {
          s.last = 0;
          setPhase('torn');
          return;
        }
        s.raf = requestAnimationFrame(tick);
        return;
      }
      drawTear();
      if (finished) {
        s.auto = 0;
        detach();
        s.raf = requestAnimationFrame(tick);
        return;
      }
      if (s.held || s.auto || Math.abs(s.angle) >= 0.02 || Math.abs(s.speed) >= 0.05) {
        s.raf = requestAnimationFrame(tick);
        return;
      }
      s.angle = s.speed = 0;
      s.last = 0;
      drawTear();
      setPhase('idle');
    },
    [advance, detach, drawFlight, drawTear],
  );

  const wake = useCallback(() => {
    const s = sim.current;
    if (!s.raf) s.raf = requestAnimationFrame(tick);
  }, [tick]);

  useEffect(() => {
    const s = sim.current;
    s.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  // um canhoto novo, pouco depois do anterior cair
  useEffect(() => {
    if (phase !== 'torn') return;
    const id = window.setTimeout(() => {
      const s = sim.current;
      s.angle = s.speed = s.target = s.hole = 0;
      s.flying = false;
      setGeneration((g) => g + 1);
      setPhase('idle');
    }, RESET_AFTER);
    return () => window.clearTimeout(id);
  }, [phase]);

  // movimento reduzido: o canhoto não cai, só some onde rasgou
  useEffect(() => {
    if (phase !== 'flying' || !sim.current.reduce) return;
    const s = sim.current;
    cancelAnimationFrame(s.raf);
    s.raf = 0;
    s.last = 0;
    if (stubRef.current) {
      stubRef.current.style.transition = `opacity 180ms ${EASE_OUT}`;
      stubRef.current.style.opacity = '0';
    }
    const id = window.setTimeout(() => setPhase('torn'), 180);
    return () => window.clearTimeout(id);
  }, [phase]);

  const onDown = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    if (phase === 'flying' || phase === 'torn' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    const h = hinge();
    s.grabAngle = (Math.atan2(e.clientY - h.y, e.clientX - h.x) * 180) / Math.PI - s.angle;
    s.held = true;
    s.px = e.clientX;
    s.py = e.clientY;
    s.pt = e.timeStamp;
    s.pvx = s.pvy = 0;
    setPhase('tearing');
    wake();
  };

  const onMove = (e: PointerEvent<HTMLButtonElement>) => {
    const s = sim.current;
    if (!s.held) return;
    const dt = e.timeStamp - s.pt;
    if (dt > 0) {
      s.pvx = s.pvx * 0.5 + ((e.clientX - s.px) / dt) * 500;
      s.pvy = s.pvy * 0.5 + ((e.clientY - s.py) / dt) * 500;
    }
    s.px = e.clientX;
    s.py = e.clientY;
    s.pt = e.timeStamp;
    const h = hinge();
    const raw = (Math.atan2(e.clientY - h.y, e.clientX - h.x) * 180) / Math.PI - s.grabAngle;
    // empurrar de volta contra o cupom cede pouco
    const pull = raw < 0 ? raw * 0.15 : raw;
    s.target = pull >= TEAR_ANGLE ? TEAR_ANGLE * 1.05 : stickSlip(Math.max(pull, 0) / TEAR_ANGLE) * TEAR_ANGLE + Math.min(pull, 0);
    wake();
  };

  const onUp = () => {
    const s = sim.current;
    if (!s.held) return;
    s.held = false;
    s.target = 0;
    wake();
  };

  const onKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (phase !== 'idle' || e.repeat) return;
    sim.current.auto = 1;
    sim.current.target = 0;
    setPhase('tearing');
    wake();
  };

  const done = phase === 'flying' || phase === 'torn';
  return (
    <div className="tear" ref={rootRef} style={{ width: BODY_WIDTH + STUB_WIDTH, height: HEIGHT }}>
      <div className="tear__body" ref={bodyRef} style={{ width: BODY_WIDTH, mask: bodyMask, WebkitMask: bodyMask }}>
        <span className={done ? 'tear__chip is-done' : 'tear__chip'} aria-hidden="true">
          {done ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 5 5 19" />
              <circle cx="7" cy="7" r="2.5" />
              <circle cx="17" cy="17" r="2.5" />
            </svg>
          )}
        </span>
        <span className="tear__lines">
          <span className={done ? 'tear__line' : 'tear__line is-on'} aria-hidden={done}>
            <strong>Cupom de 10% off</strong>
            <span>Destaque o canhoto</span>
          </span>
          <span className={done ? 'tear__line is-on' : 'tear__line'} aria-hidden={!done}>
            <strong>Cupom ativado</strong>
            <span>Válido até domingo</span>
          </span>
        </span>
      </div>
      {phase !== 'torn' && (
        <button
          key={generation}
          ref={stubRef}
          type="button"
          className={phase === 'tearing' ? 'tear__stub is-grabbing' : 'tear__stub'}
          aria-label="Cupom de 10% off: destaque o canhoto para ativar"
          style={{ left: BODY_WIDTH, width: STUB_WIDTH, mask: stubMask, WebkitMask: stubMask }}
          onKeyDown={onKey}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
        >
          <span className="tear__perf" aria-hidden="true" />
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M6 6c6 0 12 3 12 11M14 14l4 4 4-4" />
          </svg>
          <span>Puxe</span>
        </button>
      )}
      <span className="sr-only" aria-live="polite">
        {done ? 'Cupom ativado' : ''}
      </span>
    </div>
  );
}
