/*
 * AccountMenu: inspirado no Profile Dropdown (Account Menu) do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * O cartão da conta cresce e vira o próprio menu: status com indicador deslizante (o pontinho do avatar muda junto),
 * atalhos, tema em três posições, "Trocar de conta" desliza para outra página e "Sair" pede para segurar.
 * Reescrito do zero numa versão enxuta (o original tem 35 KB e usa lucide): TypeScript, CSS da página e português.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { Icon } from '../Icons';

const CONTAS = [
  { id: 'mar', nome: 'Loja Mar Azul', email: 'contato@marazul.com.br', plano: 'Pro', ini: 'MA' },
  { id: 'cafe', nome: 'Café da Serra', email: 'oi@cafedaserra.com.br', plano: 'Essencial', ini: 'CS' },
  { id: 'vitta', nome: 'Vitta Odonto', email: 'agenda@vitta.com.br', plano: 'Pro', ini: 'VO' },
];
const STATUS = [
  { id: 'online', label: 'Online' },
  { id: 'away', label: 'Ausente' },
  { id: 'busy', label: 'Ocupado' },
] as const;
const TEMAS = ['Claro', 'Escuro', 'Sistema'];
const HOLD_MS = 1200;

export function AccountMenu() {
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState<'main' | 'contas'>('main');
  const [conta, setConta] = useState(CONTAS[0]);
  const [status, setStatus] = useState(0);
  const [tema, setTema] = useState(1);
  const [hold, setHold] = useState<'idle' | 'holding' | 'done'>('idle');
  const holdTimer = useRef(0);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: globalThis.PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  useEffect(() => {
    if (!open) setPage('main');
  }, [open]);
  useEffect(() => {
    if (hold !== 'done') return;
    const t = window.setTimeout(() => {
      setHold('idle');
      setOpen(false);
    }, 1400);
    return () => window.clearTimeout(t);
  }, [hold]);
  useEffect(() => () => window.clearTimeout(holdTimer.current), []);

  const startHold = () => {
    if (hold !== 'idle') return;
    setHold('holding');
    holdTimer.current = window.setTimeout(() => setHold('done'), HOLD_MS);
  };
  const stopHold = () => {
    if (hold !== 'holding') return;
    window.clearTimeout(holdTimer.current);
    setHold('idle');
  };
  const onRootKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && open) {
      e.stopPropagation();
      if (page === 'contas') setPage('main');
      else setOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={open ? 'acct is-open' : 'acct'} data-status={STATUS[status].id} onKeyDown={onRootKey}>
      <button type="button" className="acct__card" aria-expanded={open} aria-controls="acct-menu" onClick={() => setOpen((o) => !o)}>
        <span className="acct__avatar" aria-hidden="true">
          {conta.ini}
          <i />
        </span>
        <span className="acct__who">
          <strong>{conta.nome}</strong>
          <span>{conta.email}</span>
        </span>
        <span className="acct__plan">{conta.plano}</span>
        <svg className="acct__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m7 9 5-5 5 5M7 15l5 5 5-5" />
        </svg>
      </button>

      <div className="acct__drawer" id="acct-menu" inert={!open}>
        <div className="acct__clip">
          <div className="acct__pages" data-page={page}>
            {/* página principal */}
            <div className="acct__page" inert={page !== 'main'}>
              <p className="acct__label">Status</p>
              <div className="acct__seg" role="radiogroup" aria-label="Status" style={{ '--idx': status } as CSSProperties}>
                <span className="acct__seg-ind" aria-hidden="true" />
                {STATUS.map((s, i) => (
                  <button key={s.id} type="button" role="radio" aria-checked={status === i} onClick={() => setStatus(i)}>
                    <i className={`acct__dot is-${s.id}`} aria-hidden="true" />
                    {s.label}
                  </button>
                ))}
              </div>
              <ul className="acct__items">
                <li>
                  <button type="button">
                    <Icon name="user" /> Perfil
                  </button>
                </li>
                <li>
                  <button type="button">
                    <Icon name="layers" /> Configurações <kbd>Ctrl ,</kbd>
                  </button>
                </li>
                <li>
                  <button type="button">
                    <Icon name="mail" /> Faturas <em>2 em aberto</em>
                  </button>
                </li>
                <li>
                  <button type="button" onClick={() => setPage('contas')}>
                    <Icon name="sync" /> Trocar de conta <Icon name="arrow" className="acct__go" />
                  </button>
                </li>
              </ul>
              <p className="acct__label">Tema</p>
              <div className="acct__seg" role="radiogroup" aria-label="Tema" style={{ '--idx': tema } as CSSProperties}>
                <span className="acct__seg-ind" aria-hidden="true" />
                {TEMAS.map((t, i) => (
                  <button key={t} type="button" role="radio" aria-checked={tema === i} onClick={() => setTema(i)}>
                    {t}
                  </button>
                ))}
              </div>
              {/* sair pede para segurar: soltar antes cancela */}
              <button
                type="button"
                className={`acct__out is-${hold}`}
                style={{ '--hold': `${HOLD_MS}ms` } as CSSProperties}
                onPointerDown={(e: PointerEvent) => {
                  if (e.button === 0) startHold();
                }}
                onPointerUp={stopHold}
                onPointerLeave={stopHold}
                onPointerCancel={stopHold}
                onKeyDown={(e) => {
                  if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
                    e.preventDefault();
                    startHold();
                  }
                }}
                onKeyUp={(e) => (e.key === ' ' || e.key === 'Enter') && stopHold()}
              >
                <span className="acct__out-fill" aria-hidden="true" />
                <span className="acct__out-text">{hold === 'done' ? 'Até logo!' : hold === 'holding' ? 'Segure…' : 'Segure para sair'}</span>
              </button>
            </div>

            {/* página: trocar de conta */}
            <div className="acct__page" inert={page !== 'contas'}>
              <button type="button" className="acct__back" onClick={() => setPage('main')}>
                <Icon name="arrow" /> Contas
              </button>
              <ul className="acct__items">
                {CONTAS.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      aria-current={c.id === conta.id ? 'true' : undefined}
                      onClick={() => {
                        setConta(c);
                        setPage('main');
                      }}
                    >
                      <span className="acct__mini" aria-hidden="true">
                        {c.ini}
                      </span>
                      <span className="acct__who">
                        <strong>{c.nome}</strong>
                        <span>{c.plano}</span>
                      </span>
                      {c.id === conta.id && <Icon name="check" className="acct__check" />}
                    </button>
                  </li>
                ))}
                <li>
                  <button type="button" className="acct__add">
                    <span className="acct__mini" aria-hidden="true">
                      +
                    </span>
                    Adicionar conta
                  </button>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
