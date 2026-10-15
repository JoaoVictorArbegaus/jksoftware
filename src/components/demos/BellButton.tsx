/*
 * BellButton: adaptado do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * "Avise quando chegar": o sino e o badalo são dois pêndulos no mesmo eixo; ao ligar, o sino balança, pega o
 * badalo com a borda e ele bate do outro lado (com ondinhas de som). Desligado, o badalo fica preso e o sino
 * só sacode abafado. O número de pessoas na lista rola.
 * Mudanças: TypeScript sem Tailwind, textos em português, cores da página.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';
import { milhar, RollingNumber } from './RollingNumber';

const STEP = 1 / 240;
const BELL_STIFFNESS = 380;
const BELL_DAMPING = 5;
const CLAPPER_STIFFNESS = 150;
const CLAPPER_DAMPING = 4;
const LIP = 13;
const RESTITUTION = 0.45;
const RECOIL = 0.18;
const STRIKE_SPEED = 260;
const RING_KICK = 600;
const NUDGE_KICK = 160;
const MUTE_KICK = 300;
const REST = 0.05;
const PIVOT = { x: 12, y: 2.5 };
const EASE_OUT = 'cubic-bezier(0.23, 1, 0.32, 1)';
const NA_LISTA = 1284;

const haptic = (ms: number) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
};

export function BellButton() {
  const [on, setOn] = useState(false);
  const bellRef = useRef<SVGGElement>(null);
  const clapperRef = useRef<SVGPathElement>(null);
  const leftRef = useRef<SVGPathElement>(null);
  const rightRef = useRef<SVGPathElement>(null);
  const sim = useRef({ bell: 0, bellSpeed: 0, clapper: 0, clapperSpeed: 0, muffled: true, raf: 0, last: 0, carry: 0, lastNudge: 0, reduce: false });

  const draw = useCallback(() => {
    const s = sim.current;
    bellRef.current?.setAttribute('transform', `rotate(${s.bell.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`);
    clapperRef.current?.setAttribute('transform', `rotate(${s.clapper.toFixed(2)} ${PIVOT.x} ${PIVOT.y})`);
  }, []);

  // duas ondinhas saem do lado que levou a batida
  const flare = useCallback((side: 1 | -1, strength: number) => {
    const wave = side > 0 ? rightRef.current : leftRef.current;
    if (!wave?.animate) return;
    const peak = Math.min(1, 0.45 + strength * 0.55);
    wave.animate([{ opacity: peak, transform: 'translateX(0px)' }, { opacity: 0, transform: `translateX(${side * 3}px)` }], { duration: 420, easing: EASE_OUT });
  }, []);

  const step = useCallback(() => {
    const s = sim.current;
    s.bellSpeed += (-s.bell * BELL_STIFFNESS - s.bellSpeed * BELL_DAMPING) * STEP;
    s.bell += s.bellSpeed * STEP;
    if (s.muffled) {
      s.clapper = s.bell;
      s.clapperSpeed = s.bellSpeed;
      return;
    }
    s.clapperSpeed += (-s.clapper * CLAPPER_STIFFNESS - s.clapperSpeed * CLAPPER_DAMPING) * STEP;
    s.clapper += s.clapperSpeed * STEP;
    const rel = s.clapper - s.bell;
    if (Math.abs(rel) <= LIP) return;
    const side = rel > 0 ? 1 : -1;
    const impact = (s.clapperSpeed - s.bellSpeed) * side;
    s.clapper = s.bell + side * LIP;
    if (impact <= 0) return;
    s.clapperSpeed -= side * impact * (1 + RESTITUTION);
    s.bellSpeed += side * impact * RECOIL;
    if (impact > STRIKE_SPEED) {
      flare(side as 1 | -1, impact / 1600);
      haptic(6);
    }
  }, [flare]);

  const tick = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      s.carry += s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP;
      s.last = now;
      while (s.carry >= STEP) {
        step();
        s.carry -= STEP;
      }
      draw();
      const energy = Math.abs(s.bell) + Math.abs(s.bellSpeed) * 0.02 + Math.abs(s.clapper) + Math.abs(s.clapperSpeed) * 0.02;
      if (energy < REST) {
        s.bell = s.bellSpeed = s.clapper = s.clapperSpeed = 0;
        s.last = 0;
        draw();
        return;
      }
      s.raf = requestAnimationFrame(tick);
    },
    [draw, step],
  );

  const kick = useCallback(
    (speed: number) => {
      const s = sim.current;
      if (s.reduce) return;
      s.bellSpeed += speed;
      if (!s.raf) s.raf = requestAnimationFrame(tick);
    },
    [tick],
  );

  useEffect(() => {
    const s = sim.current;
    s.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  const onClick = () => {
    const next = !on;
    setOn(next);
    const s = sim.current;
    if (next) {
      s.muffled = false;
      kick(s.bellSpeed >= 0 ? RING_KICK : -RING_KICK);
      if (s.reduce) {
        flare(1, 0.6);
        flare(-1, 0.6);
      }
      haptic(10);
    } else {
      s.muffled = true;
      kick(-MUTE_KICK);
    }
  };

  // passar o mouse balança um pouquinho (só mouse: no toque o "enter" vem logo antes do toque)
  const onEnter = (e: PointerEvent) => {
    const s = sim.current;
    if (e.pointerType !== 'mouse' || s.muffled || e.timeStamp - s.lastNudge < 700) return;
    s.lastNudge = e.timeStamp;
    kick(s.bellSpeed >= 0 ? NUDGE_KICK : -NUDGE_KICK);
  };

  const total = NA_LISTA + (on ? 1 : 0);
  return (
    <button type="button" className={on ? 'bell is-on' : 'bell'} aria-pressed={on} onClick={onClick} onPointerEnter={onEnter}>
      <svg className="bell__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path ref={rightRef} className="bell__wave" d="M21.5 4.5c1.2 1.6 1.8 3.4 1.8 5.5" />
        <path ref={leftRef} className="bell__wave" d="M2.5 4.5C1.3 6.1.7 7.9.7 10" />
        <path ref={clapperRef} d="M10.27 21a2 2 0 0 0 3.46 0" />
        <g ref={bellRef}>
          <path className="bell__body" d="M3.26 15.33A1 1 0 0 0 4 17h16a1 1 0 0 0 .74-1.67C19.41 13.96 18 12.5 18 8A6 6 0 0 0 6 8c0 4.5-1.41 5.96-2.74 7.33" />
          {/* risco de "mudo", que se apaga ao ligar */}
          <path className="bell__slash" d="M3 3l18 18" strokeDasharray="26" strokeDashoffset={on ? 26 : 0} />
        </g>
      </svg>
      <span className="bell__labels">
        <span aria-hidden={on}>Avise quando chegar</span>
        <span aria-hidden={!on}>Você será avisado</span>
      </span>
      <span className="bell__count">
        <RollingNumber value={milhar(total)} />
        <span className="sr-only">{milhar(total)} pessoas na lista</span>
      </span>
    </button>
  );
}
