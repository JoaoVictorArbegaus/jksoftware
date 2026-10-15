import { Fragment, type ElementType, type ReactNode } from 'react';
import { m, useReducedMotion, useSpring, type Variants } from 'motion/react';

export const EASE = [0.22, 0.8, 0.24, 1] as const;
const VIEWPORT = { once: true, amount: 0.2, margin: '0px 0px -8% 0px' } as const;

/** Entrada de texto: sobe e sai do desfoque. transitionEnd remove o filter (um filter residual mataria o vidro dentro). */
export const rise: Variants = {
  hidden: { opacity: 0, y: 28, filter: 'blur(8px)' },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE, delay: i * 0.08 },
    transitionEnd: { filter: 'none' },
  }),
};

/**
 * Entrada de card de vidro: só movimento, sem opacidade nem filtro (opacidade < 1 desliga o backdrop-filter no Chrome).
 * Termina em transform identidade, então o hover em CSS (inclinação) volta a valer no elemento interno.
 */
export const lift: Variants = {
  hidden: { y: 72, scale: 0.96 },
  show: (i = 0) => ({
    y: 0,
    scale: 1,
    transition: { type: 'spring', stiffness: 80, damping: 17, mass: 0.9, delay: i * 0.1 },
  }),
};

/** Props prontas para um m.* entrar ao ficar visível. */
export const inView = (i = 0, variants: Variants = rise) =>
  ({ variants, initial: 'hidden', whileInView: 'show', viewport: VIEWPORT, custom: i }) as const;

type Tag = 'p' | 'div' | 'li' | 'span';

/** Texto que entra ao rolar (sobe e sai do desfoque). Não use em ancestrais de vidro. */
export function Reveal({ as = 'p', i = 0, className, children }: { as?: Tag; i?: number; className?: string; children: ReactNode }) {
  const C = m[as] as ElementType;
  return (
    <C className={className} {...inView(i)}>
      {children}
    </C>
  );
}

/**
 * Lista de cards de vidro que entra quando a própria lista aparece: todos os itens sobem em sequência,
 * inclusive os que estão fora da tela num carrossel horizontal (que nunca "apareceriam" sozinhos).
 */
export function LiftList({ as = 'ul', className, children, ...rest }: { as?: 'ul' | 'ol'; className?: string; children: ReactNode } & Record<string, unknown>) {
  const C = m[as] as ElementType;
  return (
    <C className={className} initial="hidden" whileInView="show" viewport={VIEWPORT} {...rest}>
      {children}
    </C>
  );
}

/** Item de uma LiftList: sobe com mola (só transform, sem opacidade), na ordem `i`. */
export function LiftItem({ i = 0, className, children }: { i?: number; className?: string; children: ReactNode }) {
  return (
    <m.li className={className} variants={lift} custom={i}>
      {children}
    </m.li>
  );
}

/** Nó de texto do título: string, ou um invólucro (`span` com classe ou `em`) com filhos. */
export type SplitNode = string | { tag?: 'span' | 'em'; className?: string; nodes: SplitNode[] };

const word = {
  hidden: { y: '115%', rotate: 3 },
  show: { y: '0%', rotate: 0, transition: { duration: 1, ease: EASE } },
};

function renderNodes(nodes: SplitNode[], key = 'n'): ReactNode {
  return nodes.map((node, n) => {
    if (typeof node !== 'string') {
      const W = node.tag ?? 'span';
      return (
        <W key={`${key}-${n}`} className={node.className}>
          {renderNodes(node.nodes, `${key}-${n}`)}
        </W>
      );
    }
    // o espaço entre palavras fica FORA da máscara (dentro de um inline-block ele some no fim da linha)
    const parts = node.split(/(\s+)/).filter(Boolean);
    return (
      <Fragment key={`${key}-${n}`}>
        {parts.map((p, j) =>
          p.trim() === '' ? (
            <Fragment key={j}>{' '}</Fragment>
          ) : (
            <span key={j} className="split-w">
              <m.span className="split-w__in" variants={word}>
                {p}
              </m.span>
            </span>
          ),
        )}
      </Fragment>
    );
  });
}

/** Título que sobe palavra por palavra de dentro de uma máscara, mantendo as vozes (sans / serifa itálica). */
export function SplitHeading({ id, className, nodes }: { id: string; className?: string; nodes: SplitNode[] }) {
  return (
    <m.h2 id={id} className={className} initial="hidden" whileInView="show" viewport={{ once: true, amount: 0.5 }} transition={{ staggerChildren: 0.055 }}>
      {renderNodes(nodes)}
    </m.h2>
  );
}

/** CTA magnético: o conteúdo é atraído pelo cursor e volta com mola. Só com mouse. */
export function Magnetic({ children, strength = 0.28 }: { children: ReactNode; strength?: number }) {
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  const y = useSpring(0, { stiffness: 220, damping: 15, mass: 0.4 });
  return (
    <m.span
      className="magnetic"
      style={{ x, y }}
      onPointerMove={(e) => {
        if (reduce || e.pointerType !== 'mouse') return;
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - (r.left + r.width / 2)) * strength);
        y.set((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </m.span>
  );
}
