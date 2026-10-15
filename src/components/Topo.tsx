/**
 * Fundo topográfico: curvas de nível que derivam devagar; um morro segue o cursor e um clique solta uma onda.
 *
 * Adaptado de kokonutui — Topo Background (https://kokonutui.com), por @dorianbaffier, licença MIT.
 * Mudanças: vira uma camada decorativa dentro da seção (os eventos do cursor vêm da própria seção),
 * sem Tailwind nem `cn`, sem as cotas numéricas, cor vinda do CSS (`color`) e desenho estático com
 * movimento reduzido.
 */
import { useEffect, useRef } from 'react';

const CELL = 12; // distância entre amostras do campo, em px
const TERRAIN_SCALE = 360; // largura de um morro do terreno, em px
const INDEX_EVERY = 5; // a cada 5 curvas, uma curva mestra mais forte
const HILL_HEIGHT = 0.5;
const HILL_SPREAD = 120;
const HILL_FOLLOW = 9;
const HILL_RISE = 5;
const RIPPLE_MS = 1800;
const RIPPLE_SPEED = 0.24;
const RIPPLE_WIDTH = 42;
const RIPPLE_HEIGHT = 0.2;
const RIPPLE_WAVELENGTH = 96;
const IDLE_FRAME_MS = 33;

type Ripple = { x: number; y: number; start: number };
type Hill = { x: number; y: number; targetX: number; targetY: number; amount: number; on: boolean };

/** Ruído de gradiente 3D com semente (improved noise de Ken Perlin), de -1 a 1. */
function createNoise(seed: number) {
  const p = Array.from({ length: 256 }, (_, i) => i);
  let state = seed >>> 0 || 1;
  const random = () => {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  const perm = new Uint8Array(512);
  for (let i = 0; i < 512; i++) perm[i] = p[i & 255];
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  const grad = (hash: number, x: number, y: number, z: number) => {
    const h = hash & 15;
    const u = h < 8 ? x : y;
    const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
  };
  return (x: number, y: number, z: number) => {
    const X = Math.floor(x) & 255;
    const Y = Math.floor(y) & 255;
    const Z = Math.floor(z) & 255;
    const fx = x - Math.floor(x);
    const fy = y - Math.floor(y);
    const fz = z - Math.floor(z);
    const u = fade(fx);
    const v = fade(fy);
    const w = fade(fz);
    const A = perm[X] + Y;
    const AA = perm[A] + Z;
    const AB = perm[A + 1] + Z;
    const B = perm[X + 1] + Y;
    const BA = perm[B] + Z;
    const BB = perm[B + 1] + Z;
    return lerp(
      lerp(lerp(grad(perm[AA], fx, fy, fz), grad(perm[BA], fx - 1, fy, fz), u), lerp(grad(perm[AB], fx, fy - 1, fz), grad(perm[BB], fx - 1, fy - 1, fz), u), v),
      lerp(
        lerp(grad(perm[AA + 1], fx, fy, fz - 1), grad(perm[BA + 1], fx - 1, fy, fz - 1), u),
        lerp(grad(perm[AB + 1], fx, fy - 1, fz - 1), grad(perm[BB + 1], fx - 1, fy - 1, fz - 1), u),
        v,
      ),
      w,
    );
  };
}

/** Marching squares: o trecho de curva que passa por uma célula, conforme os cantos acima do nível. */
function cellSegments(path: Path2D, index: number, x0: number, y0: number, x1: number, y1: number, top: number, right: number, bottom: number, left: number) {
  const line = (ax: number, ay: number, bx: number, by: number) => {
    path.moveTo(ax, ay);
    path.lineTo(bx, by);
  };
  switch (index) {
    case 1:
    case 14:
      line(x0, left, bottom, y1);
      break;
    case 2:
    case 13:
      line(bottom, y1, x1, right);
      break;
    case 3:
    case 12:
      line(x0, left, x1, right);
      break;
    case 4:
    case 11:
      line(top, y0, x1, right);
      break;
    case 6:
    case 9:
      line(top, y0, bottom, y1);
      break;
    case 7:
    case 8:
      line(x0, left, top, y0);
      break;
    case 5:
      line(x0, left, top, y0);
      line(bottom, y1, x1, right);
      break;
    case 10:
      line(top, y0, x1, right);
      line(x0, left, bottom, y1);
      break;
    default:
      break;
  }
}

function traceContours(field: Float32Array, cols: number, rows: number, interval: number, minor: Path2D, major: Path2D) {
  for (let j = 0; j < rows - 1; j++) {
    for (let i = 0; i < cols - 1; i++) {
      const a = field[j * cols + i];
      const b = field[j * cols + i + 1];
      const c = field[(j + 1) * cols + i + 1];
      const d = field[(j + 1) * cols + i];
      const first = Math.ceil(Math.min(a, b, c, d) / interval);
      const last = Math.floor(Math.max(a, b, c, d) / interval);
      if (first > last) continue;
      const x0 = i * CELL;
      const y0 = j * CELL;
      for (let level = first; level <= last; level++) {
        const t = level * interval;
        const index = (a > t ? 8 : 0) | (b > t ? 4 : 0) | (c > t ? 2 : 0) | (d > t ? 1 : 0);
        if (index === 0 || index === 15) continue;
        cellSegments(
          level % INDEX_EVERY === 0 ? major : minor,
          index,
          x0,
          y0,
          x0 + CELL,
          y0 + CELL,
          x0 + CELL * ((t - a) / (b - a)),
          y0 + CELL * ((t - b) / (c - b)),
          x0 + CELL * ((t - d) / (c - d)),
          y0 + CELL * ((t - a) / (d - a)),
        );
      }
    }
  }
}

function stepHill(hill: Hill, dt: number) {
  const follow = 1 - Math.exp(-HILL_FOLLOW * dt);
  hill.x += (hill.targetX - hill.x) * follow;
  hill.y += (hill.targetY - hill.y) * follow;
  const goal = hill.on ? 1 : 0;
  hill.amount += (goal - hill.amount) * (1 - Math.exp(-HILL_RISE * dt));
  return Math.abs(hill.targetX - hill.x) > 0.5 || Math.abs(hill.targetY - hill.y) > 0.5 || Math.abs(goal - hill.amount) > 0.002;
}

type Props = { interval?: number; speed?: number; seed?: number; interactive?: boolean; className?: string };

/** Camada de curvas de nível para o fundo de uma seção. A cor vem do CSS (`color` em `.topo`). */
export function Topo({ interval = 0.07, speed = 1, seed = 26, interactive = true, className }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const host = canvas?.parentElement; // a seção: os eventos do cursor vêm dela
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const noise = createNoise(seed);
    let width = 0;
    let height = 0;
    let cols = 0;
    let rows = 0;
    let field = new Float32Array(0);
    let color = '';
    const hill: Hill = { x: 0, y: 0, targetX: 0, targetY: 0, amount: 0, on: false };
    const ripples: Ripple[] = [];
    let time = 0;
    let last = 0;
    let lastPaint = 0;
    let raf = 0;
    let visible = true;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = rect.width;
      height = rect.height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cols = Math.ceil(width / CELL) + 1;
      rows = Math.ceil(height / CELL) + 1;
      field = new Float32Array(cols * rows);
      color = getComputedStyle(canvas).color;
    };

    const sample = (now: number) => {
      const z = time * 0.05;
      const drift = time * 6;
      const hillOn = hill.amount > 0.001;
      const spread = 2 * HILL_SPREAD * HILL_SPREAD;
      const ringWidth = 2 * RIPPLE_WIDTH * RIPPLE_WIDTH;
      for (let j = 0; j < rows; j++) {
        const y = j * CELL;
        for (let i = 0; i < cols; i++) {
          const x = i * CELL;
          const nx = (x + drift) / TERRAIN_SCALE;
          const ny = y / TERRAIN_SCALE;
          let v = noise(nx, ny, z) * 0.78 + noise(nx * 2.3 + 17.1, ny * 2.3 + 4.7, z * 1.4) * 0.22;
          if (hillOn) {
            const dx = x - hill.x;
            const dy = y - hill.y;
            v += HILL_HEIGHT * hill.amount * Math.exp(-(dx * dx + dy * dy) / spread);
          }
          for (const r of ripples) {
            const age = now - r.start;
            const d = Math.hypot(x - r.x, y - r.y) - age * RIPPLE_SPEED;
            const fadeOut = 1 - age / RIPPLE_MS;
            v += RIPPLE_HEIGHT * fadeOut * fadeOut * Math.exp(-(d * d) / ringWidth) * Math.cos((d / RIPPLE_WAVELENGTH) * Math.PI * 2);
          }
          field[j * cols + i] = v;
        }
      }
    };

    const paint = (now: number) => {
      sample(now);
      const minor = new Path2D();
      const major = new Path2D();
      traceContours(field, cols, rows, interval, minor, major);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.16;
      ctx.lineWidth = 0.75;
      ctx.stroke(minor);
      ctx.globalAlpha = 0.34;
      ctx.lineWidth = 1.1;
      ctx.stroke(major);
      ctx.globalAlpha = 1;
    };

    const frame = (now: number) => {
      raf = 0;
      if (!visible) return;
      const dt = last ? Math.min((now - last) / 1000, 0.05) : 0;
      last = now;
      const hillMoving = stepHill(hill, dt);
      while (ripples.length > 0 && now - ripples[0].start > RIPPLE_MS) ripples.shift();
      const settling = hillMoving || ripples.length > 0;
      time += dt * speed;
      // só a deriva: meio quadro por quadro basta; o que segue a mão ganha todos os quadros
      if (settling || now - lastPaint >= IDLE_FRAME_MS) {
        paint(now);
        lastPaint = now;
      }
      if (speed > 0 || settling) raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (!raf && visible && !reduce) {
        last = 0;
        raf = requestAnimationFrame(frame);
      }
    };

    resize();
    paint(performance.now());
    canvas.classList.add('is-ready');
    start();

    const ro = new ResizeObserver(() => {
      resize();
      paint(performance.now());
    });
    ro.observe(canvas);
    let onScreen = true;
    const updateVisible = () => {
      visible = onScreen && document.visibilityState === 'visible';
      if (visible) start();
    };
    const io = new IntersectionObserver(([en]) => {
      onScreen = en.isIntersecting;
      updateVisible();
    });
    io.observe(host);
    document.addEventListener('visibilitychange', updateVisible);

    const local = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return; // toque não tem hover: um morro parado onde o dedo saiu fica estranho
      const p = local(e);
      if (!hill.on) {
        hill.x = p.x;
        hill.y = p.y;
      }
      hill.targetX = p.x;
      hill.targetY = p.y;
      hill.on = true;
      start();
    };
    const onLeave = () => {
      hill.on = false;
      start();
    };
    const onDown = (e: PointerEvent) => {
      if ((e.target as Element).closest('a, button, input, select, textarea, label')) return;
      ripples.push({ ...local(e), start: performance.now() });
      if (ripples.length > 4) ripples.shift();
      start();
    };
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    if (interactive && fine && !reduce) {
      host.addEventListener('pointermove', onMove);
      host.addEventListener('pointerleave', onLeave);
      host.addEventListener('pointerdown', onDown);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', updateVisible);
      host.removeEventListener('pointermove', onMove);
      host.removeEventListener('pointerleave', onLeave);
      host.removeEventListener('pointerdown', onDown);
    };
  }, [interval, speed, seed, interactive]);

  return <canvas ref={canvasRef} className={className ? `topo ${className}` : 'topo'} aria-hidden="true" />;
}
