/*
 * StaggeredMenu: adaptado de React Bits (https://reactbits.dev, MIT).
 * Menu lateral que entra em camadas: duas faixas coloridas passam na frente e o painel chega logo atrás; os itens
 * sobem um a um de dentro de uma máscara, com a numeração acendendo junto. O botão troca "Menu" por "Fechar"
 * rolando o texto e o "+" gira até virar "×".
 * Mudanças: TypeScript; sem gsap (transições CSS com atrasos escalonados); o painel vai para o body por portal
 * (o vidro do cabeçalho não o prende); fecha com Esc, clique fora ou num link, e devolve o foco ao botão;
 * fechado fica inerte. Cores e tipografia no CSS da página.
 */
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';

export type MenuItem = { href: string; label: string };
export type MenuSocial = { href: string; label: string; external?: boolean };

type Props = { items: MenuItem[]; socials: MenuSocial[]; socialsTitle: string; note?: string; active?: string | null; onNavigate?: (href: string) => void };

export function StaggeredMenu({ items, socials, socialsTitle, note, active, onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const wasOpen = useRef(false);

  useEffect(() => setMounted(true), []);

  // abrir: foco no primeiro item; fechar: foco de volta no botão
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      const t = window.setTimeout(() => panelRef.current?.querySelector<HTMLElement>('a')?.focus({ preventScroll: true }), 320);
      return () => window.clearTimeout(t);
    }
    if (wasOpen.current) toggleRef.current?.focus({ preventScroll: true });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const go = (href: string) => {
    onNavigate?.(href);
    setOpen(false);
  };

  return (
    <>
      <button ref={toggleRef} type="button" className="sm-toggle" aria-expanded={open} aria-controls="menu-completo" data-open={open ? '' : undefined} onClick={() => setOpen((o) => !o)}>
        <span className="sm-toggle__text" aria-hidden="true">
          <span>Menu</span>
          <span>Fechar</span>
        </span>
        <span className="sr-only">{open ? 'Fechar menu' : 'Abrir menu'}</span>
        <span className="sm-toggle__icon" aria-hidden="true">
          <i />
          <i />
        </span>
      </button>
      {mounted &&
        createPortal(
          <div className="sm" data-open={open ? '' : undefined}>
            <div className="sm__scrim" onClick={() => setOpen(false)} aria-hidden="true" />
            <div className="sm__layers" aria-hidden="true">
              <span />
              <span />
            </div>
            <aside ref={panelRef} id="menu-completo" className="sm__panel" aria-label="Menu completo" inert={!open}>
              <ol className="sm__list">
                {items.map((it, i) => (
                  <li key={it.href} style={{ '--i': i } as CSSProperties}>
                    <a href={it.href} className="sm__item" aria-current={active === it.href.slice(1) ? 'true' : undefined} onClick={() => go(it.href)}>
                      <span className="sm__label">{it.label}</span>
                      <span className="sm__num" aria-hidden="true">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                    </a>
                  </li>
                ))}
              </ol>
              <div className="sm__socials">
                <p className="sm__socials-title">{socialsTitle}</p>
                <ul>
                  {socials.map((s, i) => (
                    <li key={s.label} style={{ '--i': i } as CSSProperties}>
                      <a href={s.href} {...(s.external ? { target: '_blank', rel: 'noopener' } : {})} onClick={() => setOpen(false)}>
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
                {note && <p className="sm__note">{note}</p>}
              </div>
            </aside>
          </div>,
          document.body,
        )}
    </>
  );
}
