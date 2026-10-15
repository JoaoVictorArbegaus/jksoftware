/*
 * MetricCard: adaptado do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Painel de faturamento: o total do período rola dígito a dígito, a linha se transforma entre 7, 30 e 90 dias e,
 * passando o dedo ou o mouse no gráfico, cada dia aparece comparado com o mesmo dia do período anterior.
 * Mudanças: TypeScript sem Tailwind (CSS em landing.css), português e reais, dados fictícios com semente fixa
 * (servidor e navegador desenham o mesmo gráfico).
 */
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { milhar, RollingNumber } from './RollingNumber';

const W = 400;
const H = 120;
const PAD_Y = 10;
const SAMPLES = 90;
const MORPH_MS = 420;
const DAY = 86_400_000;

type Point = { date: string; value: number };
type Shape = { current: number[]; previous: number[] };
type Paths = { current: string; previous: string };

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

// Com semente: o servidor e o navegador geram os mesmos números
function demoData(days: number, end: string): Point[] {
  let seed = 42;
  const random = () => {
    seed = (seed * 16_807) % 2_147_483_647;
    return seed / 2_147_483_647;
  };
  const last = Date.parse(`${end}T00:00:00Z`);
  const out: Point[] = [];
  let level = 1180;
  for (let i = 0; i < days; i++) {
    const t = last - (days - 1 - i) * DAY;
    const weekday = new Date(t).getUTCDay();
    const weekend = weekday === 0 || weekday === 6;
    level += 3.4 + (random() - 0.5) * 30;
    const promo = i > days - 40 && i < days - 34 ? 1.22 : 1;
    out.push({ date: new Date(t).toISOString().slice(0, 10), value: Math.round(level * (weekend ? 0.86 : 1) * promo * (0.94 + random() * 0.12)) });
  }
  return out;
}

const DATA = demoData(180, '2026-10-14');
// formatação feita à mão (e não com Intl): o texto do servidor e o do navegador ficam idênticos na hidratação
const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const money = { format: (n: number) => `R$ ${milhar(n)}` };
const utc = (d: string) => new Date(`${d}T00:00:00Z`);
const dayShort = (d: string) => `${utc(d).getUTCDate()} ${MESES[utc(d).getUTCMonth()]}`;
const dayLong = (d: string) => `${DIAS[utc(d).getUTCDay()]}, ${dayShort(d)}`;

function resample(values: number[], count: number) {
  const out = new Array<number>(count);
  for (let i = 0; i < count; i++) {
    const at = (i / (count - 1)) * (values.length - 1);
    const lo = Math.floor(at);
    const hi = Math.min(values.length - 1, lo + 1);
    out[i] = values[lo] + (values[hi] - values[lo]) * (at - lo);
  }
  return out;
}

/** Alturas 0..1 para um caminho SVG suavizado (Catmull-Rom). */
function toPath(heights: number[]) {
  const pts = heights.map((h, i) => [(i / (heights.length - 1)) * W, PAD_Y + (1 - h) * (H - PAD_Y * 2)]);
  let d = `M${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] ?? p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += `C${c1x.toFixed(2)} ${c1y.toFixed(2)} ${c2x.toFixed(2)} ${c2y.toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

function buildPeriod(data: Point[], days: number) {
  const current = data.slice(-days);
  const previous = data.slice(-days * 2, -days);
  const values = [...current, ...previous].map((p) => p.value);
  const lo = Math.min(...values) * 0.92;
  const hi = Math.max(...values) * 1.04;
  const norm = (v: number) => (v - lo) / (hi - lo || 1);
  return {
    current,
    previous,
    total: current.reduce((s, p) => s + p.value, 0),
    before: previous.reduce((s, p) => s + p.value, 0),
    shape: { current: resample(current.map((p) => norm(p.value)), SAMPLES), previous: resample(previous.map((p) => norm(p.value)), SAMPLES) } as Shape,
    paths: { current: toPath(current.map((p) => norm(p.value))), previous: toPath(previous.map((p) => norm(p.value))) } as Paths,
    norm,
  };
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
const PERIODS = [7, 30, 90];

export function MetricCard() {
  const clipId = `${useId().replace(/:/g, '')}-past`;
  const [period, setPeriod] = useState(30);
  const [scrub, setScrub] = useState<number | null>(null);
  const info = useMemo(() => buildPeriod(DATA, period), [period]);
  const currentRef = useRef<SVGPathElement>(null);
  const currentDimRef = useRef<SVGPathElement>(null);
  const previousRef = useRef<SVGPathElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);
  const shown = useRef<Shape>(info.shape);
  const raf = useRef(0);

  // Trocar o período transforma as linhas a partir de onde estão
  useEffect(() => {
    const from = shown.current;
    const to = info.shape;
    cancelAnimationFrame(raf.current);
    const paint = (p: Paths) => {
      currentRef.current?.setAttribute('d', p.current);
      currentDimRef.current?.setAttribute('d', p.current);
      previousRef.current?.setAttribute('d', p.previous);
    };
    const land = () => {
      shown.current = to;
      paint(info.paths);
    };
    if (from === to || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return land();
    const start = performance.now();
    const frame = (now: number) => {
      const t = easeInOut(Math.min(1, (now - start) / MORPH_MS));
      const mix = (a: number[], b: number[]) => a.map((v, i) => v + (b[i] - v) * t);
      shown.current = { current: mix(from.current, to.current), previous: mix(from.previous, to.previous) };
      if (t < 1) {
        paint({ current: toPath(shown.current.current), previous: toPath(shown.current.previous) });
        raf.current = requestAnimationFrame(frame);
      } else land();
    };
    raf.current = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf.current);
  }, [info.shape, info.paths]);

  const indexAt = useCallback(
    (clientX: number) => {
      const rect = chartRef.current?.getBoundingClientRect();
      if (!rect) return 0;
      return Math.round(clamp((clientX - rect.left) / rect.width, 0, 1) * (info.current.length - 1));
    },
    [info.current.length],
  );

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setScrub(indexAt(e.clientX));
  };
  // mouse lê no hover; no toque, só enquanto o dedo está apertado
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' || e.currentTarget.hasPointerCapture(e.pointerId)) setScrub(indexAt(e.clientX));
  };
  const release = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse') setScrub(null);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const last = info.current.length - 1;
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -last, End: last };
    if (e.key === 'Escape') return setScrub(null);
    const move = moves[e.key];
    if (move === undefined) return;
    e.preventDefault();
    setScrub((at) => clamp((at ?? last) + move, 0, last));
  };

  const scrubbing = scrub !== null && scrub < info.current.length;
  const point = scrubbing ? info.current[scrub] : null;
  const twin = scrubbing ? info.previous[scrub] : null;
  const value = point ? point.value : info.total;
  const compare = twin ? twin.value : info.before;
  const delta = compare ? (value - compare) / compare : 0;
  const up = delta >= 0;
  const x = scrubbing ? (scrub / (info.current.length - 1)) * 100 : 100;
  const y = point ? PAD_Y + (1 - info.norm(point.value)) * (H - PAD_Y * 2) : 0;
  const yPrev = twin ? PAD_Y + (1 - info.norm(twin.value)) * (H - PAD_Y * 2) : 0;
  const formatted = money.format(value);

  return (
    <div className="metric">
      <div className="metric__top">
        <p className="metric__label">{point ? 'Vendas do dia' : 'Faturamento'}</p>
        <div className="metric__periods" role="group" aria-label="Período">
          {PERIODS.map((d) => (
            <button
              key={d}
              type="button"
              aria-pressed={d === period}
              className="metric__period"
              onClick={() => {
                setScrub(null);
                setPeriod(d);
              }}
            >
              {d} dias
            </button>
          ))}
        </div>
      </div>
      <p className="metric__value">
        <span className="sr-only">{formatted}</span>
        <RollingNumber value={formatted} />
      </p>
      <p className="metric__delta">
        <span className={up ? 'is-up' : 'is-down'}>
          {up ? '▲' : '▼'} {Math.abs(delta * 100).toFixed(1).replace('.', ',')}%
        </span>
        <span aria-live="polite">{point ? `${dayLong(point.date)} x ${dayShort(twin?.date ?? point.date)}` : `x ${period} dias anteriores`}</span>
      </p>
      <div
        ref={chartRef}
        className="metric__chart"
        role="slider"
        tabIndex={0}
        aria-label={`Faturamento dos últimos ${period} dias. Use as setas para ler cada dia.`}
        aria-valuemin={1}
        aria-valuemax={info.current.length}
        aria-valuenow={scrubbing ? scrub + 1 : info.current.length}
        aria-valuetext={point ? `${dayLong(point.date)}: ${money.format(point.value)}` : `${money.format(info.total)} no total`}
        onBlur={() => setScrub(null)}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={release}
        onPointerCancel={release}
        onLostPointerCapture={release}
        onPointerLeave={() => setScrub(null)}
      >
        <svg aria-hidden="true" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id={`${clipId}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0" stopColor="#9DE8DE" stopOpacity=".28" />
              <stop offset="1" stopColor="#9DE8DE" stopOpacity="0" />
            </linearGradient>
            <clipPath id={clipId}>
              <rect height={H + 20} width={(x / 100) * W} x={0} y={-10} />
            </clipPath>
          </defs>
          <line className="metric__base" x1={0} x2={W} y1={H - 0.5} y2={H - 0.5} vectorEffect="non-scaling-stroke" />
          <path ref={previousRef} className="metric__prev" d={info.paths.previous} strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          <path ref={currentDimRef} className="metric__dim" d={info.paths.current} vectorEffect="non-scaling-stroke" />
          <path ref={currentRef} className="metric__line" clipPath={`url(#${clipId})`} d={info.paths.current} vectorEffect="non-scaling-stroke" />
        </svg>
        {point && (
          <>
            <span className="metric__cursor" style={{ left: `${x}%` }} aria-hidden="true" />
            <span className="metric__dot metric__dot--prev" style={{ left: `${x}%`, top: `${(yPrev / H) * 100}%` }} aria-hidden="true" />
            <span className="metric__dot" style={{ left: `${x}%`, top: `${(y / H) * 100}%` }} aria-hidden="true" />
          </>
        )}
      </div>
      <div className="metric__foot" aria-hidden="true">
        <span>{dayShort(info.current[0].date)}</span>
        <span className="metric__legend">
          <span /> período anterior
        </span>
        <span>{dayShort(info.current[info.current.length - 1].date)}</span>
      </div>
    </div>
  );
}
