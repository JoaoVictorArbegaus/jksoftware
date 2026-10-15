/*
 * AutomationFlow: adaptado do Currency Transfer do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Um pedido pago dispara o resto sozinho: nota emitida, estoque baixado e cliente avisado. Cada etapa gira até
 * terminar, o trilho escorre até a próxima e o check se desenha; no fim, o contador de tarefas do dia rola.
 * Mudanças: TypeScript sem Tailwind nem lucide, o fluxo virou automação de pedido (em vez de câmbio), roda
 * quando aparece na tela e tem "Rodar de novo".
 */
import { useEffect, useRef, useState } from 'react';
import { Icon } from '../Icons';
import { milhar, RollingNumber } from './RollingNumber';

const STEP_MS = 1100;
const RAIL_MS = 350;

const STEPS = [
  { titulo: 'Pagamento recebido', detalhe: 'Pix de Mariana S. · R$ 189,90' },
  { titulo: 'Nota fiscal emitida', detalhe: 'NF-e 4.182 enviada por e-mail' },
  { titulo: 'Estoque atualizado', detalhe: '2 itens baixados, reposição em dia' },
  { titulo: 'Cliente avisado', detalhe: 'Mensagem entregue no WhatsApp' },
];
const TAREFAS_INICIAIS = 1284;

type State = 'done' | 'active' | 'pending';

function StepNode({ state }: { state: State }) {
  return (
    <span className={`flow__node is-${state}`}>
      {state === 'active' && (
        <svg className="flow__spin" viewBox="0 0 20 20" fill="none" aria-hidden="true" style={{ animationDelay: `${RAIL_MS - 100}ms` }}>
          <path d="M10 1.25A8.75 8.75 0 0 1 18.75 10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
        </svg>
      )}
      {state === 'done' && (
        <svg className="flow__tick" viewBox="0 0 12 12" fill="none" aria-hidden="true">
          <path d="M2.5 6.25 5 8.5l4.5-5" pathLength={1} strokeDasharray="1" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" />
        </svg>
      )}
    </span>
  );
}

export function AutomationFlow() {
  const ref = useRef<HTMLDivElement>(null);
  // etapas concluídas: 0 = nada rodou ainda; 4 = tudo pronto
  const [done, setDone] = useState(0);
  const [running, setRunning] = useState(false);
  const [tarefas, setTarefas] = useState(TAREFAS_INICIAIS);

  // roda sozinho na primeira vez que aparece na tela
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        io.disconnect();
        setDone(1);
        setRunning(true);
      },
      { threshold: 0.5 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    if (done >= STEPS.length) {
      setRunning(false);
      setTarefas((t) => t + 3);
      return;
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), STEP_MS);
    return () => window.clearTimeout(t);
  }, [running, done]);

  const finished = done >= STEPS.length;
  const stateOf = (i: number): State => (i < done ? 'done' : i === done && running ? 'active' : 'pending');
  const replay = () => {
    setDone(1);
    setRunning(true);
  };

  return (
    <div className="flow" ref={ref}>
      <output className="sr-only" aria-live="polite">
        {finished ? 'Pedido concluído: nota emitida, estoque atualizado e cliente avisado.' : running ? STEPS[Math.min(done, 3)].titulo : ''}
      </output>
      <div className="flow__head">
        <span className="flow__avatar" aria-hidden="true">
          MS
        </span>
        <span className="flow__who">
          <strong>Pedido #4182</strong>
          <span>Loja online · Mariana S.</span>
        </span>
        <span className={finished ? 'flow__pill is-ok' : 'flow__pill'}>
          <span aria-hidden={finished}>Processando</span>
          <span aria-hidden={!finished}>Concluído</span>
        </span>
      </div>

      <ol className="flow__steps">
        {STEPS.map((s, i) => {
          const st = stateOf(i);
          return (
            <li key={s.titulo} className={`flow__step is-${st}`}>
              <span className="flow__track">
                <StepNode state={st} />
                {i < STEPS.length - 1 && (
                  <span className="flow__rail">
                    <span className={i < done ? 'is-on' : undefined} style={{ transitionDuration: `${RAIL_MS}ms` }} />
                  </span>
                )}
              </span>
              <span className="flow__text">
                <span className="flow__title">{s.titulo}</span>
                <span className="flow__detail">{s.detalhe}</span>
              </span>
            </li>
          );
        })}
      </ol>

      <div className="flow__foot">
        <span className="flow__count">
          <span className="sr-only">{tarefas} tarefas automáticas hoje</span>
          <RollingNumber value={milhar(tarefas)} />
          <span aria-hidden="true"> tarefas automáticas hoje</span>
        </span>
        <button type="button" className="demo-btn" onClick={replay} disabled={running}>
          <Icon name="sync" />
          Rodar de novo
        </button>
      </div>
    </div>
  );
}
