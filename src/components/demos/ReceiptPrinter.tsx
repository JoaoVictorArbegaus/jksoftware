/*
 * ReceiptPrinter: adaptado do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Comanda que sai da impressora linha a linha quando aparece na tela. Fica pendurada balançando: puxe para
 * baixo e ela rasga na serrilha e fica na mão (dá para jogar); um puxão rápido arranca de uma vez.
 * Mudanças: TypeScript sem Tailwind (CSS em landing.css), comanda em português e reais, impressora no petróleo da página.
 */
import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react';

const SLOT_Y = 64;
const LINE = 15;
const FEED_RATE = 34;
const LINE_PAUSE = 0.055;
const LINE_JITTER = 0.05;
const STEP = 1 / 120;
const GRAVITY = 2600;
const DAMPING = 0.996;
const MAX_PULL = 18;
const TEAR_DRAG = 72;
const TEAR_SPEED = 900;
const GLIDE = 0.35;
const REST_EPSILON = 0.02;

type Phase = 'idle' | 'printing' | 'hanging' | 'held' | 'falling';

const ITENS = [
  { nome: 'Café coado', qtd: 2, preco: 6.5 },
  { nome: 'Pão de queijo', qtd: 3, preco: 4 },
  { nome: 'Bolo de fubá', qtd: 1, preco: 9 },
  { nome: 'Suco de laranja', qtd: 1, preco: 8.5 },
];
const SERVICO = 0.1;
const BARS = [2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 2, 1, 1, 2, 1, 3, 1, 1, 2, 2, 1, 1, 3, 1, 2];
const reais = (n: number) => n.toFixed(2).replace('.', ',');

const damp = (d: number, max: number) => max * (1 - Math.exp(-d / max));
const haptic = (ms = 8) => {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
};
/** Ponto local de uma folha girada por `angle`, a partir do canto. */
const turn = (px: number, py: number, a: number) => [px * Math.cos(a) - py * Math.sin(a), px * Math.sin(a) + py * Math.cos(a)];

function Comanda() {
  const subtotal = ITENS.reduce((s, i) => s + i.qtd * i.preco, 0);
  const servico = subtotal * SERVICO;
  return (
    <div className="receipt__body">
      <p className="receipt__shop">CAFÉ DA SERRA</p>
      <p className="receipt__muted">15 out 2026 · 08:42</p>
      <p className="receipt__muted">Mesa 7 · Comanda #0427</p>
      <p className="receipt__dash" aria-hidden="true">
        {'- '.repeat(40)}
      </p>
      {ITENS.map((i) => (
        <p className="receipt__row" key={i.nome}>
          <span>
            {i.qtd} × {i.nome}
          </span>
          <span>{reais(i.qtd * i.preco)}</span>
        </p>
      ))}
      <p className="receipt__dash" aria-hidden="true">
        {'- '.repeat(40)}
      </p>
      <p className="receipt__row receipt__muted">
        <span>Subtotal</span>
        <span>{reais(subtotal)}</span>
      </p>
      <p className="receipt__row receipt__muted">
        <span>Serviço 10%</span>
        <span>{reais(servico)}</span>
      </p>
      <p className="receipt__row receipt__total">
        <span>Total</span>
        <span>R$ {reais(subtotal + servico)}</span>
      </p>
      <div className="receipt__bars" aria-hidden="true">
        {BARS.map((w, i) => (
          <span key={i} style={{ width: w, background: i % 2 ? 'transparent' : undefined }} />
        ))}
      </div>
      <p className="receipt__muted receipt__thanks">Obrigado, volte sempre</p>
    </div>
  );
}

// Serrilha: a borda de baixo veio rasgada da última comanda; a de cima ganha a mesma quando esta é rasgada
const TOOTH = 8;
const edge = (side: 'top' | 'bottom') =>
  `conic-gradient(from ${side === 'bottom' ? '-45deg at 50% 100%' : '135deg at 50% 0'}, #0000, #000 1deg 89deg, #0000 90deg) 50% ${side === 'bottom' ? '100%' : '0'} / ${TOOTH}px ${TOOTH / 2}px repeat-x`;
const FILL = `linear-gradient(#000 0 0) 0 ${TOOTH / 2}px / 100% calc(100% - ${TOOTH}px) no-repeat`;
const MASK_RESTING = `${edge('bottom')}, linear-gradient(#000 0 0) 0 0 / 100% calc(100% - ${TOOTH / 2}px) no-repeat`;
const MASK_TORN = `${edge('top')}, ${edge('bottom')}, ${FILL}`;

export function ReceiptPrinter() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [torn, setTorn] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const paperRef = useRef<HTMLDivElement>(null);
  const printerRef = useRef<HTMLDivElement>(null);
  const sim = useRef({
    phase: 'idle' as Phase,
    width: 0,
    height: 0,
    slotX: 0,
    cx: 0,
    cy: 0,
    pcx: 0,
    pcy: 0,
    angle: 0,
    spin: 0,
    hx: 0,
    hy: 0,
    hingeX: 0,
    hingeY: 0,
    hidden: 0,
    feedTarget: 0,
    pause: 0,
    pointerId: -1,
    grabX: 0,
    grabY: 0,
    startX: 0,
    startY: 0,
    samples: [] as { t: number; x: number; y: number }[],
    raf: 0,
    last: 0,
    carry: 0,
    visible: false,
    reduceMotion: false,
  });

  const setPhaseBoth = useCallback((next: Phase) => {
    sim.current.phase = next;
    setPhase(next);
  }, []);

  const draw = useCallback(() => {
    const s = sim.current;
    const paper = paperRef.current;
    if (!paper) return;
    const [ox, oy] = turn(s.width / 2, s.height / 2, s.angle);
    const tx = s.cx - ox - (s.slotX - s.width / 2);
    const ty = s.cy - oy - SLOT_Y;
    paper.style.transform = `translate3d(${tx.toFixed(2)}px,${ty.toFixed(2)}px,0) rotate(${s.angle.toFixed(4)}rad)`;
  }, []);

  const hangAt = useCallback((angle: number) => {
    const s = sim.current;
    const [dx, dy] = turn(s.width / 2 - s.hingeX, s.height / 2 - s.hingeY, angle);
    return [s.hx + dx, s.hy + dy];
  }, []);

  const placeAtSlot = useCallback(
    (pull: number) => {
      const s = sim.current;
      s.hingeX = s.width / 2;
      s.hingeY = 0;
      s.hx = s.slotX;
      s.hy = SLOT_Y + pull;
      const [cx, cy] = hangAt(0);
      s.cx = s.pcx = cx;
      s.cy = s.pcy = cy;
      s.angle = 0;
    },
    [hangAt],
  );

  // impressora térmica: avança uma linha, para, avança
  const stepPrinting = useCallback(
    (dt: number) => {
      const s = sim.current;
      if (s.pause > 0) s.pause -= dt;
      else if (s.feedTarget > 0) {
        s.feedTarget = Math.max(0, s.feedTarget - LINE);
        s.pause = LINE_PAUSE + Math.random() * LINE_JITTER;
      }
      s.hidden += (s.feedTarget - s.hidden) * Math.min(1, FEED_RATE * dt);
      if (Math.abs(s.hidden - s.feedTarget) < 0.05) s.hidden = s.feedTarget;
      placeAtSlot(-s.hidden);
      const printer = printerRef.current;
      if (printer) printer.style.transform = `translate3d(${(s.pause > 0 ? 0 : Math.sin(performance.now() / 9) * 0.4).toFixed(2)}px,0,0)`;
      if (s.hidden === 0 && s.feedTarget === 0) {
        if (printer) printer.style.transform = '';
        setPhaseBoth('hanging');
        return 0;
      }
      return 1;
    },
    [placeAtSlot, setPhaseBoth],
  );

  // pendurada: o centro de massa balança numa haste fixa e a folha gira junto
  const stepPendulum = useCallback(() => {
    const s = sim.current;
    const vx = (s.cx - s.pcx) * DAMPING;
    const vy = (s.cy - s.pcy) * DAMPING;
    s.pcx = s.cx;
    s.pcy = s.cy;
    s.cx += vx;
    s.cy += vy + GRAVITY * STEP * STEP;
    const rod = Math.hypot(s.width / 2 - s.hingeX, s.height / 2 - s.hingeY);
    const dx = s.cx - s.hx;
    const dy = s.cy - s.hy;
    const dist = Math.hypot(dx, dy) || 1;
    s.cx = s.hx + (dx / dist) * rod;
    s.cy = s.hy + (dy / dist) * rod;
    s.angle = Math.atan2(s.cy - s.hy, s.cx - s.hx) - Math.atan2(s.height / 2 - s.hingeY, s.width / 2 - s.hingeX);
    return Math.abs(vx) + Math.abs(vy);
  }, []);

  // queda livre: gravidade, um pouco de ar, e a folha inclinada plana de lado
  const stepFalling = useCallback(() => {
    const s = sim.current;
    let vx = (s.cx - s.pcx) * DAMPING;
    const vy = (s.cy - s.pcy) * DAMPING;
    vx += Math.sin(s.angle) * Math.max(vy, 0) * GLIDE * STEP * 10;
    s.pcx = s.cx;
    s.pcy = s.cy;
    s.cx += vx;
    s.cy += vy + GRAVITY * STEP * STEP;
    s.angle += s.spin * STEP;
    s.spin *= 0.995;
    const floor = (cardRef.current?.clientHeight ?? 400) + Math.hypot(s.width, s.height) / 2;
    return s.cy > floor ? 0 : 1;
  }, []);

  const stepPhysics = useCallback(
    (elapsed: number) => {
      const s = sim.current;
      let busy = 0;
      s.carry += elapsed;
      while (s.carry >= STEP) {
        s.carry -= STEP;
        if (s.phase === 'falling') busy = stepFalling();
        else if (s.phase === 'hanging' || s.phase === 'held') busy = stepPendulum();
      }
      return busy;
    },
    [stepFalling, stepPendulum],
  );

  const tick = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      const elapsed = s.last ? Math.min((now - s.last) / 1000, 0.05) : STEP;
      s.last = now;
      const busy = s.phase === 'printing' ? stepPrinting(elapsed) : stepPhysics(elapsed);
      draw();
      if (s.phase === 'falling' && busy === 0) {
        setPhaseBoth('idle');
        s.last = 0;
        return;
      }
      const keep = s.phase === 'printing' || s.phase === 'falling' || s.pointerId >= 0 || busy > REST_EPSILON;
      if (keep && s.visible) s.raf = requestAnimationFrame(tick);
      else s.last = 0;
    },
    [draw, setPhaseBoth, stepPhysics, stepPrinting],
  );

  const wake = useCallback(() => {
    const s = sim.current;
    if (!s.raf && s.visible) s.raf = requestAnimationFrame(tick);
  }, [tick]);

  const measure = useCallback(() => {
    const s = sim.current;
    const card = cardRef.current;
    const paper = paperRef.current;
    if (!card || !paper) return;
    s.width = paper.offsetWidth;
    s.height = paper.offsetHeight;
    s.slotX = card.clientWidth / 2;
  }, []);

  const print = useCallback(() => {
    const s = sim.current;
    measure();
    setTorn(false);
    if (s.reduceMotion) {
      placeAtSlot(0);
      draw();
      setPhaseBoth('hanging');
      return;
    }
    s.hidden = s.feedTarget = s.height;
    s.pause = 0.25;
    placeAtSlot(-s.hidden);
    draw();
    setPhaseBoth('printing');
    wake();
  }, [draw, measure, placeAtSlot, setPhaseBoth, wake]);

  const tear = useCallback(
    (held: boolean) => {
      setTorn(true);
      haptic(14);
      printerRef.current?.animate([{ transform: 'translate3d(0,1.5px,0)' }, { transform: 'translate3d(0,0,0)' }], { duration: 220, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' });
      if (sim.current.reduceMotion) return setPhaseBoth('idle');
      setPhaseBoth(held ? 'held' : 'falling');
      wake();
    },
    [setPhaseBoth, wake],
  );

  // imprime quando entra na tela; fora dela o laço para
  useEffect(() => {
    const s = sim.current;
    const card = cardRef.current;
    if (!card) return;
    s.reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    measure();
    placeAtSlot(-s.height);
    draw();
    let printed = false;
    let onScreen = false;
    const update = () => {
      s.visible = onScreen && !document.hidden;
      if (!s.visible) {
        cancelAnimationFrame(s.raf);
        s.raf = 0;
        s.last = 0;
        return;
      }
      if (!printed) {
        printed = true;
        print();
      }
      wake();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        update();
      },
      { threshold: 0.4 },
    );
    io.observe(card);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
      cancelAnimationFrame(s.raf);
      s.raf = 0;
    };
  }, [draw, measure, placeAtSlot, print, wake]);

  const localPoint = (e: PointerEvent) => {
    const r = cardRef.current?.getBoundingClientRect();
    return r ? { x: e.clientX - r.left, y: e.clientY - r.top } : { x: 0, y: 0 };
  };
  const toSheet = (x: number, y: number) => {
    const s = sim.current;
    const [ox, oy] = turn(s.width / 2, s.height / 2, s.angle);
    return turn(x - (s.cx - ox), y - (s.cy - oy), -s.angle);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.phase !== 'hanging' || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const { x, y } = localPoint(e);
    e.currentTarget.setPointerCapture(e.pointerId);
    s.pointerId = e.pointerId;
    s.startX = x;
    s.startY = y;
    [s.grabX, s.grabY] = toSheet(x, y);
    s.samples = [{ t: e.timeStamp, x, y }];
    wake();
  };

  // ainda presa: gira em torno da saída para o ponto agarrado seguir a mão e estica um pouco para baixo
  const dragAttached = (x: number, y: number) => {
    const s = sim.current;
    s.hingeX = s.width / 2;
    s.hingeY = 0;
    s.hx = s.slotX;
    s.hy = SLOT_Y + damp(Math.max(0, y - s.startY), MAX_PULL);
    const angle = -Math.atan2(x - s.slotX - (s.grabX - s.width / 2), Math.max(s.grabY, 24)) * 0.7;
    const [cx, cy] = hangAt(angle);
    s.pcx = s.cx;
    s.pcy = s.cy;
    s.cx = cx;
    s.cy = cy;
    s.angle = angle;
  };

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.pointerId !== e.pointerId) return;
    const { x, y } = localPoint(e);
    s.samples.push({ t: e.timeStamp, x, y });
    if (s.samples.length > 5) s.samples.shift();
    if (s.phase === 'hanging') {
      if (y - s.startY > TEAR_DRAG) {
        // rasga na saída e fica na mão, balançando de onde foi agarrada
        s.hingeX = s.grabX;
        s.hingeY = s.grabY;
        s.hx = x;
        s.hy = y;
        tear(true);
      } else dragAttached(x, y);
    } else if (s.phase === 'held') {
      s.hx = x;
      s.hy = y;
    }
    wake();
  };

  const onUp = (e: PointerEvent<HTMLDivElement>) => {
    const s = sim.current;
    if (s.pointerId !== e.pointerId) return;
    s.pointerId = -1;
    const first = s.samples[0];
    const last = s.samples[s.samples.length - 1] ?? first;
    const dt = Math.max((last.t - first.t) / 1000, 0.016);
    const vx = (last.x - first.x) / dt;
    const vy = (last.y - first.y) / dt;
    if (s.phase === 'held') {
      // jogada: mantém a velocidade da mão e gira com o balanço
      const prev = s.angle;
      stepPendulum();
      s.spin = (s.angle - prev) / STEP + vx * 0.002;
      s.pcx = s.cx - vx * STEP * 0.6;
      s.pcy = s.cy - vy * STEP * 0.6;
      setPhaseBoth('falling');
    } else if (s.phase === 'hanging' && vy > TEAR_SPEED) {
      s.pcx = s.cx - vx * STEP * 0.5;
      s.pcy = s.cy - vy * STEP * 0.5;
      s.spin = vx * 0.004;
      tear(false);
    } else if (s.phase === 'hanging') {
      s.hy = SLOT_Y;
      s.pcx = s.cx;
      s.pcy = s.cy;
    }
    wake();
  };

  const tearByKey = () => {
    const s = sim.current;
    if (s.phase !== 'hanging') return;
    s.spin = 1.2;
    s.pcy = s.cy - 3;
    tear(false);
  };

  const status = phase === 'printing' ? 'Imprimindo…' : phase === 'hanging' ? 'Puxe para destacar' : phase === 'held' || phase === 'falling' ? 'Destacada' : 'Pronta';

  return (
    <div className="receipt" ref={cardRef}>
      <div className={torn ? 'receipt__paper-clip is-torn' : 'receipt__paper-clip'} style={{ top: SLOT_Y }}>
        <div
          ref={paperRef}
          role="document"
          aria-label="Comanda do Café da Serra, mesa 7"
          className={['receipt__paper', `is-${phase}`, phase === 'idle' && torn ? 'is-gone' : ''].filter(Boolean).join(' ')}
          style={{ mask: torn ? MASK_TORN : MASK_RESTING, WebkitMask: torn ? MASK_TORN : MASK_RESTING }}
          onPointerDown={onDown}
          onPointerMove={onMove}
          onPointerUp={onUp}
          onPointerCancel={onUp}
          onLostPointerCapture={onUp}
        >
          <Comanda />
        </div>
      </div>
      {/* a impressora fica na frente da borda de cima do papel */}
      <div className="receipt__printer" ref={printerRef}>
        <div className="receipt__printer-top">
          <span>Caixa · balcão</span>
          <span aria-live="polite">{status}</span>
        </div>
        <span className="receipt__slot" aria-hidden="true" />
      </div>
      {phase === 'hanging' && (
        <button type="button" className="receipt__tear-key sr-only" onClick={tearByKey}>
          Destacar a comanda
        </button>
      )}
      <div className={phase === 'idle' ? 'receipt__again is-on' : 'receipt__again'}>
        <button type="button" className="demo-btn" onClick={print} disabled={phase !== 'idle'} tabIndex={phase === 'idle' ? 0 : -1}>
          {torn ? 'Imprimir outra' : 'Imprimir comanda'}
        </button>
      </div>
    </div>
  );
}
