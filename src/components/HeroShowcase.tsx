import { useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react';
import { hero, servicos } from '../content/site';
import { milhar, RollingNumber } from './demos/RollingNumber';
import { DynamicText } from './DynamicText';
import { Glass } from './Glass';
import { Icon, type IconName } from './Icons';

/**
 * Vitrine do topo: uma janela grande de vidro que mostra os três serviços funcionando, em vez de descrevê-los.
 * Abas com barra de progresso trocam sozinhas (duas voltas e para, WCAG 2.2.2; pausa com o mouse em cima;
 * clicar assume o controle). Cada aba é uma cena viva: painel com pedidos chegando, site se montando e
 * automação com pulsos correndo entre as etapas. Só roda visível; com movimento reduzido fica parada na primeira.
 */
const TABS = [
  { id: 'sistemas', label: 'Sistemas', icon: 'layers', url: 'jk.software/sistemas' },
  { id: 'sites', label: 'Sites', icon: 'monitor', url: 'jk.software/sites' },
  { id: 'automacoes', label: 'Automações', icon: 'sync', url: 'jk.software/automacoes' },
] as const satisfies readonly { id: string; label: string; icon: IconName; url: string }[];
const NOMES = servicos.itens.map((s) => `${s.titulo} ${s.destaque}`);
const DURATION = 6000;
const ROUNDS = 2;

const PEDIDOS = [
  { quem: 'Mariana S.', valor: 189.9 },
  { quem: 'Rafael T.', valor: 74.5 },
  { quem: 'Clínica Sol', valor: 420 },
  { quem: 'Ana P.', valor: 59.9 },
  { quem: 'Bruno M.', valor: 132.4 },
  { quem: 'Padaria Real', valor: 248 },
];
const reais = (n: number) => n.toFixed(2).replace('.', ',');
const BARRAS = [38, 52, 44, 61, 57, 72, 66, 80, 74, 88, 83, 96];

/** Painel: pedidos chegam, contadores rolam, barras crescem. */
function SceneSistemas({ live }: { live: boolean }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setN((v) => v + 1), 1700);
    return () => window.clearInterval(id);
  }, [live]);
  const feed = Array.from({ length: Math.min(n + 1, 3) }, (_, i) => n - i).map((k) => ({ k, ...PEDIDOS[((k % PEDIDOS.length) + PEDIDOS.length) % PEDIDOS.length] }));
  const pedidos = 127 + n;
  const fat = 12480 + PEDIDOS.slice(0, n % PEDIDOS.length).reduce((s, p) => s + p.valor, 0) + Math.floor(n / PEDIDOS.length) * 1124.7;
  return (
    <div className="sc sc-sys">
      <div className="sc-kpis">
        <div>
          <span>Pedidos hoje</span>
          <strong>
            <RollingNumber value={String(pedidos)} />
          </strong>
          <em>▲ 12%</em>
        </div>
        <div>
          <span>Faturamento</span>
          <strong>
            R$ <RollingNumber value={milhar(fat)} />
          </strong>
          <em>▲ 8,4%</em>
        </div>
      </div>
      <div className="sc-chart" aria-hidden="true">
        {BARRAS.map((h, i) => (
          <i key={i} style={{ '--h': `${h}%`, '--i': i } as CSSProperties} />
        ))}
        <svg viewBox="0 0 120 40" preserveAspectRatio="none">
          <path className="sc-spark" d="M0 34 C10 30 14 31 22 27 S36 26 44 22 S58 24 66 18 S82 15 90 11 S108 8 120 3" />
        </svg>
      </div>
      <ul className="sc-feed" aria-hidden="true">
        {feed.map((p) => (
          <li key={p.k}>
            <span className="sc-feed__dot" />
            <span>
              Pedido #{4183 + p.k} · {p.quem}
            </span>
            <strong>R$ {reais(p.valor)}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Site: a página se monta bloco a bloco e as notas de desempenho enchem. */
function SceneSites({ live }: { live: boolean }) {
  const [scores, setScores] = useState([0, 0, 0]);
  useEffect(() => {
    if (!live) return;
    const id = window.setTimeout(() => setScores([98, 100, 96]), 700);
    return () => window.clearTimeout(id);
  }, [live]);
  return (
    <div className="sc sc-site">
      <div className="sc-browser" aria-hidden="true">
        <div className="sc-browser__nav">
          <b>Sua marca</b>
          <span>
            <i />
            <i />
            <i />
          </span>
        </div>
        <div className="sc-browser__hero">
          <div>
            <p className="sc-b sc-b--t1">Seu negócio,</p>
            <p className="sc-b sc-b--t2">no ar e vendendo.</p>
            <span className="sc-b sc-b--line" />
            <span className="sc-b sc-b--line sc-b--short" />
            <span className="sc-b sc-b--btn">Falar no WhatsApp</span>
          </div>
          <span className="sc-b sc-b--img" />
        </div>
        <div className="sc-browser__cards">
          <i className="sc-b" />
          <i className="sc-b" />
          <i className="sc-b" />
        </div>
      </div>
      <ul className="sc-scores">
        {['Desempenho', 'Acessibilidade', 'SEO'].map((l, i) => (
          <li key={l} style={{ '--p': scores[i] / 100 } as CSSProperties}>
            <span className="sc-ring" aria-hidden="true">
              <RollingNumber value={String(scores[i]).padStart(2, '0')} />
            </span>
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const ETAPAS: { icon: IconName; label: string; log: string }[] = [
  { icon: 'whatsapp', label: 'Mensagem', log: 'Pedido recebido pelo WhatsApp' },
  { icon: 'layers', label: 'Pedido no sistema', log: 'Pedido lançado e estoque reservado' },
  { icon: 'shield', label: 'Nota emitida', log: 'NF-e emitida e enviada por e-mail' },
  { icon: 'mail', label: 'Cliente avisado', log: 'Cliente avisado: pedido a caminho' },
];
const CLIENTES = ['Mariana S.', 'Rafael T.', 'Ana P.', 'Bruno M.'];

/** Automação: as etapas acendem em sequência e um pulso corre entre elas. */
function SceneAutomacoes({ live }: { live: boolean }) {
  // tick conta cada etapa feita desde o início: a etapa atual e o registro saem dele
  const [tick, setTick] = useState(0);
  useEffect(() => {
    if (!live) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 900);
    return () => window.clearInterval(id);
  }, [live]);
  const step = tick % ETAPAS.length;
  const feitas = 1284 + Math.floor(tick / ETAPAS.length) * 3;
  const log = Array.from({ length: Math.min(tick + 1, 3) }, (_, i) => tick - i).map((k) => ({
    k,
    hora: `09:${String(41 + Math.floor(k / ETAPAS.length)).padStart(2, '0')}`,
    texto: `${ETAPAS[k % ETAPAS.length].log} · ${CLIENTES[Math.floor(k / ETAPAS.length) % CLIENTES.length]}`,
  }));
  return (
    <div className="sc sc-auto">
      <ol className="sc-nodes">
        {ETAPAS.map((e, i) => (
          <li key={e.label} className={i <= step ? 'is-on' : undefined}>
            <span className="sc-node">
              <Icon name={e.icon} />
            </span>
            <span className="sc-node__label">{e.label}</span>
            {i < ETAPAS.length - 1 && <span className={i < step ? 'sc-wire is-on' : 'sc-wire'} aria-hidden="true" />}
          </li>
        ))}
      </ol>
      <ul className="sc-log" aria-hidden="true">
        {log.map((l) => (
          <li key={l.k}>
            <time>{l.hora}</time>
            <span>{l.texto}</span>
            <Icon name="check" />
          </li>
        ))}
      </ul>
      <div className="sc-auto__foot">
        <span className="sc-auto__count">
          <RollingNumber value={milhar(feitas)} />
        </span>
        <span>tarefas feitas sozinhas hoje, sem ninguém clicar</span>
      </div>
    </div>
  );
}

export function HeroShowcase() {
  // observa o palco (e não o Glass: o ref do Glass líquido é dele, para medir o vidro)
  const ref = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState(0);
  const [auto, setAuto] = useState(true);
  const [turns, setTurns] = useState(0);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    setReduce(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const playing = auto && !reduce && visible && !hover && turns < ROUNDS * TABS.length - 1;
  const next = () => {
    setTurns((t) => t + 1);
    setTab((t) => (t + 1) % TABS.length);
  };
  const choose = (i: number) => {
    setAuto(false);
    setTab(i);
  };
  const live = visible && !reduce;

  return (
    <Glass
      as="aside"
      tone="dark"
      glow
      liquid
      className="showcase reveal"
      aria-label="O que construímos"
      onPointerEnter={(e: PointerEvent) => e.pointerType === 'mouse' && setHover(true)}
      onPointerLeave={() => setHover(false)}
    >
      <div className="showcase__bar" aria-hidden="true">
        <span className="showcase__dots">
          <i />
          <i />
          <i />
        </span>
        <span className="showcase__url">{TABS[tab].url}</span>
        <span className="showcase__live">ao vivo</span>
      </div>
      <div className="showcase__tabs" role="tablist" aria-label="Serviços">
        {TABS.map((t, i) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={`sc-tab-${t.id}`}
            aria-selected={i === tab}
            aria-controls="sc-painel"
            className="showcase__tab"
            onClick={() => choose(i)}
          >
            <Icon name={t.icon} />
            {t.label}
            {i === tab && auto && !reduce && (
              <span
                key={`${tab}-${turns}`}
                className="showcase__progress"
                style={{ animationDuration: `${DURATION}ms`, animationPlayState: playing ? 'running' : 'paused' }}
                onAnimationEnd={next}
                aria-hidden="true"
              />
            )}
          </button>
        ))}
      </div>
      <div ref={ref} className="showcase__stage" id="sc-painel" role="tabpanel" aria-labelledby={`sc-tab-${TABS[tab].id}`}>
        <div key={tab} className="showcase__scene">
          {tab === 0 && <SceneSistemas live={live} />}
          {tab === 1 && <SceneSites live={live} />}
          {tab === 2 && <SceneAutomacoes live={live} />}
        </div>
      </div>
      <div className="showcase__foot">
        {/* o nome do serviço troca com as letras viajando entre as palavras (DynamicText, controlado pela aba) */}
        <p className="showcase__kicker">
          <DynamicText words={NOMES} index={tab} />
        </p>
        <p className="showcase__text">{hero.card}</p>
      </div>
    </Glass>
  );
}
