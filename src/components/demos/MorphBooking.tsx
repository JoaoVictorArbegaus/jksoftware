/*
 * MorphBooking: adaptado do Morph Popover do kokonutui (https://kokonutui.com, @dorianbaffier, MIT).
 * Um botão que cresce até virar o formulário que ele abre (escolher dia e horário) e encolhe numa confirmação
 * depois de enviar. O rótulo do botão vira o título do painel.
 * Mudanças: TypeScript sem Tailwind; o formulário virou agendamento; a forma anima largura e altura medidas de
 * cada estado (o original usa layoutId, que exigiria o pacote maior do Motion); textos em português.
 */
import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from '../Icons';

type Phase = 'idle' | 'open' | 'sending' | 'sent';
const DIAS = ['qua 15', 'qui 16', 'sex 17', 'sáb 18'];
const HORAS = ['09:00', '10:30', '14:00', '16:30'];
// horários já ocupados (dia:hora), para parecer uma agenda de verdade
const OCUPADOS = new Set(['qua 15:09:00', 'qui 16:14:00', 'sáb 18:16:30', 'sex 17:10:30']);
const SENT_FOR = 2400;
const useIsoLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

function CalendarIcon() {
  return (
    <svg className="morph__ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3.5" y="5" width="17" height="15" rx="3" />
      <path d="M3.5 10h17M8 3v4M16 3v4" />
    </svg>
  );
}

export function MorphBooking() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [dia, setDia] = useState<string | null>(null);
  const [hora, setHora] = useState<string | null>(null);
  const [sizes, setSizes] = useState<Record<'idle' | 'open' | 'sent', { w: number; h: number }> | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const faces = useRef<Record<'idle' | 'open' | 'sent', HTMLDivElement | null>>({ idle: null, open: null, sent: null });
  const wasOpen = useRef(false);
  const expanded = phase === 'open' || phase === 'sending';
  const face = expanded ? 'open' : phase === 'sent' ? 'sent' : 'idle';

  // mede cada estado (a casca anima entre esses tamanhos)
  useIsoLayout(() => {
    const measure = () => {
      const m = (k: 'idle' | 'open' | 'sent') => ({ w: faces.current[k]?.offsetWidth ?? 0, h: faces.current[k]?.offsetHeight ?? 0 });
      setSizes({ idle: m('idle'), open: m('open'), sent: m('sent') });
    };
    measure();
    const ro = new ResizeObserver(measure);
    Object.values(faces.current).forEach((el) => el && ro.observe(el));
    if (rootRef.current) ro.observe(rootRef.current);
    return () => ro.disconnect();
  }, []);

  // o foco acompanha a forma: para o primeiro dia ao abrir, de volta ao botão depois
  useEffect(() => {
    if (phase === 'open') {
      wasOpen.current = true;
      faces.current.open?.querySelector<HTMLButtonElement>('.morph__chip:not(:disabled)')?.focus({ preventScroll: true });
    } else if (phase === 'idle' && wasOpen.current) {
      wasOpen.current = false;
      faces.current.idle?.querySelector('button')?.focus({ preventScroll: true });
    }
    if (phase === 'sent') {
      const t = window.setTimeout(() => setPhase('idle'), SENT_FOR);
      return () => window.clearTimeout(t);
    }
  }, [phase]);

  // clique fora fecha
  useEffect(() => {
    if (phase !== 'open') return;
    const close = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setPhase('idle');
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [phase]);

  const confirmar = () => {
    if (!dia || !hora || phase !== 'open') return;
    setPhase('sending');
    window.setTimeout(() => setPhase('sent'), 800);
  };
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && phase === 'open') {
      e.stopPropagation();
      setPhase('idle');
    }
  };

  const size = sizes?.[face];
  return (
    <div className="morph" ref={rootRef} data-phase={phase} onKeyDown={onKey}>
      <div className="morph__shell" style={size ? { width: size.w, height: size.h } : undefined}>
        <div ref={(el) => void (faces.current.idle = el)} className={face === 'idle' ? 'morph__face morph__face--idle is-on' : 'morph__face morph__face--idle'} inert={face !== 'idle'}>
          <button type="button" className="morph__open" aria-haspopup="dialog" aria-expanded={false} onClick={() => setPhase('open')}>
            <CalendarIcon />
            <span>Agendar horário</span>
          </button>
        </div>

        <div ref={(el) => void (faces.current.open = el)} className={face === 'open' ? 'morph__face morph__face--open is-on' : 'morph__face morph__face--open'} role="dialog" aria-label="Agendar horário" inert={face !== 'open'}>
          <div className="morph__head">
            <CalendarIcon />
            <span>Agendar horário</span>
            <button type="button" className="morph__close" aria-label="Fechar" onClick={() => setPhase('idle')}>
              <Icon name="close" />
            </button>
          </div>
          <p className="morph__label" id="morph-dias">
            Dia
          </p>
          <div className="morph__chips" role="radiogroup" aria-labelledby="morph-dias">
            {DIAS.map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={dia === d}
                className="morph__chip"
                onClick={() => {
                  setDia(d);
                  if (hora && OCUPADOS.has(`${d}:${hora}`)) setHora(null);
                }}
              >
                {d}
              </button>
            ))}
          </div>
          <p className="morph__label" id="morph-horas">
            Horário
          </p>
          <div className="morph__chips" role="radiogroup" aria-labelledby="morph-horas">
            {HORAS.map((h) => {
              const ocupado = !!dia && OCUPADOS.has(`${dia}:${h}`);
              return (
                <button key={h} type="button" role="radio" aria-checked={hora === h} disabled={ocupado} className="morph__chip" onClick={() => setHora(h)}>
                  {h}
                  {ocupado && <span className="sr-only"> (ocupado)</span>}
                </button>
              );
            })}
          </div>
          <div className="morph__foot">
            <span>{dia && hora ? `${dia} às ${hora}` : 'Escolha dia e horário'}</span>
            <button type="button" className="morph__send" disabled={!dia || !hora || phase === 'sending'} onClick={confirmar}>
              {phase === 'sending' && (
                <svg className="morph__spin" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
                  <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeLinecap="round" strokeWidth="2" />
                </svg>
              )}
              {phase === 'sending' ? 'Confirmando' : 'Confirmar'}
            </button>
          </div>
        </div>

        <div ref={(el) => void (faces.current.sent = el)} className={face === 'sent' ? 'morph__face morph__face--sent is-on' : 'morph__face morph__face--sent'} role="status" inert={face !== 'sent'}>
          <svg className="morph__ok" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <circle cx="8" cy="8" r="8" fill="currentColor" opacity=".18" />
            <path d="M4.75 8.25 7 10.5l4.25-4.75" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.75" pathLength={1} />
          </svg>
          <span>{face === 'sent' ? `Agendado: ${dia} às ${hora}` : 'Agendado'}</span>
        </div>
      </div>
    </div>
  );
}
