/*
 * GlideSelect: adaptado de React Bits (https://reactbits.dev, MIT).
 * Lista de escolha que abre do canto do campo, com o destaque deslizando entre as opções.
 * Mudanças: TypeScript, ícones do sprite da página (sem @hugeicons), o campo segue o visual dos outros do
 * formulário (rótulo flutuante, borda, erro), linhas de 48px para o toque, posição do destaque medida das
 * próprias opções e abertura por toque só no clique (arrastar a página sobre o campo não abre a lista).
 */
import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type Ref } from 'react';
import { Icon, type IconName } from './Icons';

export type GlideOption<V extends string> = { value: V; label: string; icon?: IconName };

type Props<V extends string> = {
  id: string;
  options: GlideOption<V>[];
  value: V | '';
  onChange: (value: V) => void;
  labelId: string;
  describedBy?: string;
  invalid?: boolean;
  /** foco devolvido pelo formulário quando falta escolher */
  ref?: Ref<HTMLButtonElement>;
};

type Phase = 'closed' | 'open' | 'closing';
const POP_OUT = 140;

const typeahead = <V extends string>(items: GlideOption<V>[], from: number, ch: string) => {
  const c = ch.toLowerCase();
  for (let k = 1; k <= items.length; k++) {
    const i = (from + k) % items.length;
    if (items[i].label.toLowerCase().startsWith(c)) return i;
  }
  return from;
};

export function GlideSelect<V extends string>({ id, options, value, onChange, labelId, describedBy, invalid, ref }: Props<V>) {
  const selected = options.findIndex((o) => o.value === value);
  const [phase, setPhase] = useState<Phase>('closed');
  const [active, setActive] = useState<number | null>(null);
  const [side, setSide] = useState<'bottom' | 'top'>('bottom');
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  const instant = useRef(false);
  const closeTimer = useRef<number | undefined>(undefined);
  const scrub = useRef<{ id: number } | null>(null);
  const pointerType = useRef('');
  const listId = useId();

  const setTrigger = (el: HTMLButtonElement | null) => {
    triggerRef.current = el;
    if (typeof ref === 'function') ref(el);
    else if (ref) ref.current = el;
  };

  // ao abrir: lado (cabe embaixo?), entrada do menu e destaque já na opção escolhida
  useLayoutEffect(() => {
    if (phase !== 'open') return;
    const el = menuRef.current;
    const root = rootRef.current;
    if (!el || !root) return;
    const r = root.getBoundingClientRect();
    setSide(r.bottom + el.offsetHeight + 8 > window.innerHeight && r.top - el.offsetHeight - 8 > 0 ? 'top' : 'bottom');
    el.style.transitionDuration = instant.current ? '0ms' : '';
    el.dataset.state = 'closed';
    void el.offsetHeight;
    el.dataset.state = 'open';
    const p = pillRef.current;
    if (p) {
      p.style.transition = 'none';
      p.style.opacity = '0';
      void p.offsetHeight;
      p.style.transition = '';
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // o destaque desliza até a opção ativa (posição e altura medidas da própria opção)
  useLayoutEffect(() => {
    const p = pillRef.current;
    const row = active === null ? null : (listRef.current?.children[active + 1] as HTMLElement | undefined);
    if (!p || phase !== 'open') return;
    if (!row) {
      p.style.opacity = '0';
      return;
    }
    const jump = instant.current || p.style.opacity !== '1';
    p.style.transitionDuration = jump ? '0ms, 150ms' : '';
    p.style.height = `${row.offsetHeight}px`;
    p.style.transform = `translateY(${row.offsetTop}px)`;
    p.style.opacity = '1';
    instant.current = false;
  }, [active, phase]);

  const open = (viaKey: boolean) => {
    window.clearTimeout(closeTimer.current);
    instant.current = true;
    setActive(selected >= 0 ? selected : viaKey ? 0 : null);
    setPhase('open');
  };
  const close = (mode: 'instant' | 'pop') => {
    setActive(null);
    window.clearTimeout(closeTimer.current);
    const el = menuRef.current;
    if (mode === 'instant' || !el) return setPhase('closed');
    el.style.transitionDuration = '';
    el.dataset.state = 'closed';
    setPhase('closing');
    closeTimer.current = window.setTimeout(() => setPhase('closed'), POP_OUT + 20);
  };
  const toggle = () => (phase === 'open' ? close('pop') : open(false));
  const pick = (i: number, viaKey: boolean) => {
    const it = options[i];
    if (it && it.value !== value) {
      onChange(it.value);
      if (!viaKey && rootRef.current) rootRef.current.dataset.swap = '';
    }
    close(viaKey ? 'instant' : 'pop');
    triggerRef.current?.focus({ preventScroll: true });
  };

  const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const k = e.key;
    const n = options.length;
    const cur = active ?? Math.max(0, selected);
    if (phase !== 'open') {
      if (k === 'Enter' || k === ' ' || k === 'ArrowDown' || k === 'ArrowUp') {
        e.preventDefault();
        open(true);
      }
      return;
    }
    const go = (i: number) => {
      e.preventDefault();
      setActive(Math.min(n - 1, Math.max(0, i)));
    };
    if (k === 'ArrowDown' || k === 'ArrowUp') go(active === null ? cur : cur + (k === 'ArrowDown' ? 1 : -1));
    else if (k === 'Home' || k === 'End') go(k === 'Home' ? 0 : n - 1);
    else if (k === 'Enter' || k === ' ') {
      e.preventDefault();
      pick(cur, true);
    } else if (k === 'Escape' || k === 'Tab') {
      if (k === 'Escape') e.preventDefault();
      close('instant');
    } else if (k.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) go(typeahead(options, cur, k));
  };

  // toque fora fecha
  useEffect(() => {
    if (phase === 'closed') return;
    const onDown = (e: globalThis.PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close('pop');
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const rowAt = (y: number) => {
    const rows = Array.from(listRef.current?.querySelectorAll<HTMLElement>('[data-index]') ?? []);
    const hit = rows.find((r) => {
      const b = r.getBoundingClientRect();
      return y >= b.top && y < b.bottom;
    });
    return hit ? Number(hit.dataset.index) : null;
  };
  const onListDown = (e: PointerEvent<HTMLDivElement>) => {
    if (scrub.current) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* sem captura: segue sem arrastar */
    }
    scrub.current = { id: e.pointerId };
    instant.current = active === null;
    setActive(rowAt(e.clientY));
  };
  const onListMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = rowAt(e.clientY);
    if (i !== active) setActive(i);
  };
  const onListUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!scrub.current || scrub.current.id !== e.pointerId) return;
    const i = e.type === 'pointerup' ? rowAt(e.clientY) : null;
    scrub.current = null;
    if (i !== null) pick(i, false);
  };
  const onListOver = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'touch' || scrub.current) return;
    const row = (e.target as Element).closest<HTMLElement>('[data-index]');
    if (!row) return;
    const i = Number(row.dataset.index);
    if (i !== active) setActive(i);
  };

  const cur = selected >= 0 ? options[selected] : null;
  return (
    <div
      ref={rootRef}
      className="glide-select"
      data-open={phase === 'open' ? '' : undefined}
      onAnimationEnd={(e) => {
        if (e.animationName === 'gs-swap' && rootRef.current) delete rootRef.current.dataset.swap;
      }}
    >
      <button
        ref={setTrigger}
        id={id}
        type="button"
        role="combobox"
        className="glide-select__trigger"
        aria-haspopup="listbox"
        aria-expanded={phase === 'open'}
        aria-controls={listId}
        aria-activedescendant={phase === 'open' && active !== null ? `${listId}-${active}` : undefined}
        aria-labelledby={labelId}
        aria-describedby={describedBy}
        aria-invalid={invalid || undefined}
        // mouse abre no pointerdown (resposta imediata); toque e teclado, no clique
        onPointerDown={(e) => {
          pointerType.current = e.pointerType;
          if (e.pointerType !== 'mouse' || e.button !== 0) return;
          e.currentTarget.focus({ preventScroll: true });
          toggle();
        }}
        onClick={(e) => {
          if (e.detail === 0 || pointerType.current === 'mouse') return;
          toggle();
        }}
        onKeyDown={onTriggerKey}
      >
        <span className="glide-select__value" key={value}>
          {cur && cur.icon && <Icon name={cur.icon} className="glide-select__icon" />}
          {cur ? cur.label : ''}
        </span>
        <Icon name="chevron" className="glide-select__chevron" />
      </button>
      {phase !== 'closed' && (
        <div ref={menuRef} className="glide-select__menu" data-state="open" data-side={side}>
          <div
            ref={listRef}
            id={listId}
            role="listbox"
            aria-labelledby={labelId}
            className="glide-select__list"
            data-live={active !== null ? '' : undefined}
            onPointerOver={onListOver}
            onPointerDown={onListDown}
            onPointerMove={onListMove}
            onPointerUp={onListUp}
            onPointerCancel={onListUp}
            onLostPointerCapture={onListUp}
          >
            <span ref={pillRef} className="glide-select__pill" aria-hidden="true" />
            {options.map((o, i) => (
              <div key={o.value} id={`${listId}-${i}`} role="option" aria-selected={i === selected} data-index={i} className="glide-select__option">
                {o.icon && <Icon name={o.icon} className="glide-select__icon" />}
                <span className="glide-select__name">{o.label}</span>
                <Icon name="check" className={i === selected ? 'glide-select__check is-on' : 'glide-select__check'} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
