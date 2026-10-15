/*
 * UptimeCard: adaptado do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Página de status com 90 dias por serviço: as barras incham em volta do cursor (como o Dock do Mac), o resumo do
 * dia aparece em cima e um clique fixa o dia e abre o registro do incidente.
 * Mudanças: TypeScript sem Tailwind nem lucide, serviços e incidentes em português (dados fictícios), datas
 * formatadas à mão (o texto do servidor e o do navegador ficam iguais na hidratação), cores da página.
 */
import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from '../Icons';

const MAGNIFY = 5;
const SPREAD = 2.4;
const EASE = 18;
const DAY = 86_400_000;
const DAYS = 90;
const END = Date.parse('2026-10-14T00:00:00Z');

type Status = 'up' | 'degraded' | 'down' | 'none';
type Update = { time: string; label: string; note?: string };
type Incident = { title: string; status: 'degraded' | 'down'; minutes: number; updates: Update[] };
type Service = { name: string; incidents?: Record<number, Incident>; missing?: number };

const SERVICES: Service[] = [
  {
    name: 'Site',
    incidents: {
      21: { title: 'Lentidão nas páginas de produto', status: 'degraded', minutes: 14, updates: [{ time: '14:02', label: 'Investigando', note: 'Tempo de resposta 3x maior.' }, { time: '14:16', label: 'Resolvido', note: 'Cache de imagens refeito.' }] },
    },
  },
  {
    name: 'Sistema de pedidos',
    incidents: {
      58: { title: 'Fila de pedidos atrasada', status: 'degraded', minutes: 22, updates: [{ time: '09:41', label: 'Investigando' }, { time: '09:55', label: 'Identificado', note: 'Um relatório pesado travou a fila.' }, { time: '10:03', label: 'Resolvido', note: 'Relatório movido para a madrugada.' }] },
    },
  },
  {
    name: 'Pagamentos (Pix)',
    missing: 8,
    incidents: {
      71: { title: 'Confirmações de Pix fora do ar', status: 'down', minutes: 31, updates: [{ time: '02:15', label: 'Investigando', note: 'O banco parou de enviar avisos.' }, { time: '02:31', label: 'Contornado', note: 'Confirmação por consulta ativada.' }, { time: '02:46', label: 'Resolvido', note: 'Nenhum pagamento perdido.' }] },
    },
  },
  { name: 'Avisos no WhatsApp' },
];

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const SEMANA = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
const dayLabel = (day: number) => {
  const d = new Date(END - (DAYS - 1 - day) * DAY);
  return `${SEMANA[d.getUTCDay()]}, ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}`;
};
const statusOf = (s: Service, day: number): Status => (day < (s.missing ?? 0) ? 'none' : (s.incidents?.[day]?.status ?? 'up'));
/** Fora do ar conta inteiro; degradado conta metade. */
const uptimeOf = (s: Service) => {
  let lost = 0;
  for (const i of Object.values(s.incidents ?? {})) lost += i.minutes * (i.status === 'down' ? 1 : 0.5);
  return 100 * (1 - lost / ((DAYS - (s.missing ?? 0)) * 1440));
};
const swell = (focus: number | null, out: Float64Array) => {
  for (let i = 0; i < out.length; i++) out[i] = focus === null ? 1 : 1 + MAGNIFY * Math.exp(-(((i - focus) / SPREAD) ** 2));
  return out;
};
const barAt = (w: Float64Array, x: number) => {
  let total = 0;
  for (const v of w) total += v;
  let at = x * total;
  for (let i = 0; i < w.length; i++) {
    at -= w[i];
    if (at <= 0) return i;
  }
  return w.length - 1;
};
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pct = (n: number) => n.toFixed(2).replace('.', ',');
const STATUS_TEXT = { degraded: 'Lentidão', down: 'Fora do ar' } as const;

export function UptimeCard() {
  const [active, setActive] = useState<number | null>(null);
  const [pinned, setPinned] = useState<number | null>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const sim = useRef({ weights: new Float64Array(DAYS).fill(1), target: new Float64Array(DAYS).fill(1), raf: 0, last: 0, reduce: false });
  const uptimes = useMemo(() => SERVICES.map(uptimeOf), []);

  // larguras escritas direto nas barras (um flex-grow por barra)
  const paint = useCallback(() => {
    const { weights } = sim.current;
    barsRef.current?.querySelectorAll<HTMLElement>('[data-row]').forEach((row) => {
      for (let i = 0; i < row.children.length; i++) (row.children[i] as HTMLElement).style.flexGrow = weights[i].toFixed(3);
    });
  }, []);

  const tick = useCallback(
    (now: number) => {
      const s = sim.current;
      s.raf = 0;
      const dt = s.last ? Math.min((now - s.last) / 1000, 1 / 30) : 1 / 60;
      s.last = now;
      const k = 1 - Math.exp(-EASE * dt);
      let moving = false;
      for (let i = 0; i < DAYS; i++) {
        const gap = s.target[i] - s.weights[i];
        if (Math.abs(gap) > 0.002) {
          s.weights[i] += gap * k;
          moving = true;
        } else s.weights[i] = s.target[i];
      }
      paint();
      if (moving) s.raf = requestAnimationFrame(tick);
      else s.last = 0;
    },
    [paint],
  );

  const focusOn = useCallback(
    (focus: number | null) => {
      const s = sim.current;
      swell(focus, s.target);
      if (s.reduce) {
        s.weights.set(s.target);
        paint();
      } else if (!s.raf) s.raf = requestAnimationFrame(tick);
    },
    [paint, tick],
  );

  useEffect(() => {
    const s = sim.current;
    s.reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    return () => cancelAnimationFrame(s.raf);
  }, []);

  // o dia sob o cursor, procurado já com as barras infladas
  const dayAt = (clientX: number) => {
    const r = barsRef.current?.getBoundingClientRect();
    if (!r) return 0;
    const x = clamp((clientX - r.left) / r.width, 0, 1);
    const probe = new Float64Array(DAYS);
    let day = Math.round(x * (DAYS - 1));
    for (let p = 0; p < 3; p++) day = barAt(swell(day, probe), x);
    return day;
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' && !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const d = dayAt(e.clientX);
    setActive(d);
    focusOn(d);
  };
  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (e.pointerType !== 'mouse') e.currentTarget.setPointerCapture(e.pointerId);
    const d = dayAt(e.clientX);
    setActive(d);
    focusOn(d);
  };
  const leave = () => {
    setActive(null);
    focusOn(pinned);
  };
  const onKey = (e: KeyboardEvent<HTMLDivElement>) => {
    const from = active ?? pinned ?? DAYS - 1;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setPinned((p) => (p === from ? null : from));
      return;
    }
    if (e.key === 'Escape') {
      setPinned(null);
      return leave();
    }
    const moves: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, Home: -DAYS, End: DAYS };
    const move = moves[e.key];
    if (move === undefined) return;
    e.preventDefault();
    const d = clamp(from + move, 0, DAYS - 1);
    setActive(d);
    focusOn(d);
  };

  const shown = active ?? pinned;
  const incidentsOn = (day: number | null) => (day === null ? [] : SERVICES.flatMap((s) => (s.incidents?.[day] ? [{ service: s.name, incident: s.incidents[day] }] : [])));
  const shownInc = incidentsOn(shown);
  let summary = 'Passe o dedo nas barras para ver cada dia';
  if (shown !== null) {
    const f = shownInc[0];
    summary = `${dayLabel(shown)} · ${f ? `${f.service}: ${STATUS_TEXT[f.incident.status].toLowerCase()} por ${f.incident.minutes} min` : 'Tudo funcionando'}`;
  }
  const pinnedInc = incidentsOn(pinned);

  return (
    <div className="uptime">
      <div className="uptime__top">
        <p className="uptime__title">Status dos sistemas</p>
        <p className="uptime__ok">
          <Icon name="check" /> Tudo funcionando
        </p>
      </div>
      <p className="uptime__summary" aria-live="polite">
        {summary}
      </p>
      <div
        ref={barsRef}
        className="uptime__bars"
        role="slider"
        tabIndex={0}
        aria-label={`Status diário dos últimos ${DAYS} dias. Use as setas para andar entre os dias e Enter para abrir um.`}
        aria-valuemin={1}
        aria-valuemax={DAYS}
        aria-valuenow={(shown ?? DAYS - 1) + 1}
        aria-valuetext={summary}
        onClick={() => active !== null && setPinned((p) => (p === active ? null : active))}
        onKeyDown={onKey}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerLeave={(e) => e.pointerType === 'mouse' && leave()}
        onLostPointerCapture={leave}
      >
        {SERVICES.map((s, row) => (
          <div key={s.name} className="uptime__service">
            <div className="uptime__name">
              <span>{s.name}</span>
              <span>{pct(uptimes[row])}%</span>
            </div>
            <div className="uptime__row" data-row="">
              {Array.from({ length: DAYS }, (_, d) => (
                <i key={d} className={`is-${statusOf(s, d)}${shown !== null && d !== shown ? ' is-dim' : ''}`} style={{ flexGrow: 1 }} />
              ))}
            </div>
          </div>
        ))}
        <div className="uptime__axis" aria-hidden="true">
          <span>90 dias atrás</span>
          <span>Hoje</span>
        </div>
      </div>
      <div className={pinned === null ? 'uptime__log' : 'uptime__log is-open'}>
        <div>
          {pinned !== null && (
            <div className="uptime__card">
              <div className="uptime__card-top">
                <strong>{dayLabel(pinned)}</strong>
                <button
                  type="button"
                  aria-label="Fechar o dia"
                  onClick={() => {
                    setPinned(null);
                    focusOn(null);
                  }}
                >
                  <Icon name="close" />
                </button>
              </div>
              {pinnedInc.length === 0 && <p className="uptime__none">Nenhum incidente. Todos os serviços funcionaram normalmente.</p>}
              {pinnedInc.map(({ service, incident }) => (
                <div key={service} className="uptime__inc">
                  <p>
                    <span className={`uptime__badge is-${incident.status}`}>{STATUS_TEXT[incident.status]}</span>
                    <strong>{service}</strong> {incident.title} · {incident.minutes} min
                  </p>
                  <ol>
                    {incident.updates.map((u) => (
                      <li key={u.time + u.label}>
                        <time>{u.time}</time> <strong>{u.label}</strong>
                        {u.note && <span> {u.note}</span>}
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
