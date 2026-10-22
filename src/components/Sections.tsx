import { useRef, type ReactNode } from 'react';
import { m, useScroll, useSpring } from 'motion/react';
import { depoimentos, diferenciais, MENSAGENS, processo, servicos, whatsapp } from '../content/site';
import { Glass } from './Glass';
import { GlassIcon, type GlassIconTone } from './GlassIcon';
import { Icon } from './Icons';
import { LiftItem, LiftList, Reveal, SplitHeading, type SplitNode } from './Motion';
import { LineWaves } from './LineWaves';
import { PatternWaves } from './PatternWaves';
import { Rail } from './Rail';
import { Topo } from './Topo';
import { Wave } from './Wave';

/** Cabeçalho de seção: rótulo, título em duas vozes (sobe palavra por palavra) e texto de apoio. */
export function SecHead({ eyebrow, id, title, intro, emblem }: { eyebrow: string; id: string; title: SplitNode[]; intro: ReactNode; emblem?: ReactNode }) {
  return (
    <div className="sec-head">
      <div className={emblem ? 'sec-head__title has-emblem' : 'sec-head__title'}>
        {emblem && (
          <Reveal as="div" className="sec-emblem">
            {emblem}
          </Reveal>
        )}
        <div>
          <Reveal className="eyebrow">{eyebrow}</Reveal>
          <SplitHeading id={id} nodes={title} />
        </div>
      </div>
      <Reveal className="sec-intro" i={2}>
        {intro}
      </Reveal>
    </div>
  );
}

const TONS: GlassIconTone[] = ['menta', 'agua', 'petroleo'];

export const duasVozes = (sans: string, serif: string): SplitNode[] => [
  { className: 'h-sans', nodes: [sans] },
  ' ',
  { className: 'h-serif', nodes: [serif] },
];

export function Services() {
  return (
    <section className="section deep inv-servicos" id="servicos" aria-labelledby="servicos-titulo">
      {/* fundos variados por seção: pontos ondulando aqui, linhas nos diferenciais e depoimentos, relevo no processo e contato */}
      <PatternWaves preset="silk" color="#9DBCE8" opacity={0.32} fade="edges" fadeSize={0.6} />
      <div className="wrap">
        <SecHead eyebrow={servicos.eyebrow} id="servicos-titulo" title={duasVozes(servicos.tituloSans, servicos.tituloSerif)} intro={servicos.intro} />
        <Rail className="services" label="Serviços">
          {servicos.itens.map((s, i) => (
            <LiftItem key={s.tipo} i={i}>
              <Glass as="a" tone="deep" tilt glow className="service-card" href={whatsapp(MENSAGENS[s.tipo])} data-wa={s.tipo} target="_blank" rel="noopener">
                <span className="service-top">
                  <GlassIcon name={s.icone} tone={TONS[i % TONS.length]} />
                  <span className="service-tag">{s.tag}</span>
                </span>
                <h3>
                  {s.titulo} <em>{s.destaque}</em>
                </h3>
                <p>{s.texto}</p>
                <p className="service-ex">
                  <strong>Exemplos:</strong> {s.exemplos}
                </p>
                <span className="card-cta">
                  <span>
                    Pedir orçamento <Icon name="arrow" />
                  </span>
                  <span className="sr-only">{s.sr}</span>
                </span>
              </Glass>
            </LiftItem>
          ))}
        </Rail>
      </div>
      <Wave className="curve-to-dark" d="M0 70C240 30 500 10 760 34s470 60 680 18v58H0z" />
    </section>
  );
}

export function Perks() {
  return (
    <section className="section mist inv-diferenciais" id="diferenciais" aria-labelledby="diferenciais-titulo">
      <LineWaves color1="#213978" color2="#3B5A9A" color3="#5F7093" brightness={0.16} speed={0.22} rotation={-30} innerLineCount={26} outerLineCount={30} />
      <div className="wrap">
        <SecHead
          eyebrow={diferenciais.eyebrow}
          id="diferenciais-titulo"
          title={duasVozes(diferenciais.tituloSans, diferenciais.tituloSerif)}
          intro={diferenciais.intro}
          emblem={
            // monograma JK em fitas: a marca em destaque na seção "Sobre"
            <img src="/img/monograma-jk-520.webp" width={520} height={401} alt="" loading="lazy" decoding="async" />
          }
        />
        <LiftList className="perks" role="list">
          {diferenciais.itens.map((d, i) => (
            <LiftItem key={d.titulo} i={i}>
              <Glass tone="deep" tilt glow className="perk">
                <GlassIcon name={d.icone} tone={TONS[i % TONS.length]} size="lg" />
                <div>
                  <h3>{d.titulo}</h3>
                  <p>{d.texto}</p>
                </div>
              </Glass>
            </LiftItem>
          ))}
        </LiftList>
      </div>
      <Wave className="curve-to-mist" d="M0 40C240 0 520 0 760 40s480 70 680 20v50H0z" />
    </section>
  );
}

/** Passos do processo com uma linha de luz que se desenha conforme a rolagem (horizontal no desktop, vertical abaixo). */
function Steps() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start 0.85', 'end 0.55'] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.4 });
  return (
    <div className="steps-wrap" ref={ref}>
      <span className="steps-rail" aria-hidden="true">
        <m.span className="steps-line" style={{ '--p': progress } as never} />
      </span>
      <LiftList as="ol" className="steps">
        {processo.passos.map((p, i) => (
          <LiftItem key={p.n} i={i}>
            <Glass tone="dark" tilt glow className="step">
              <span className="step-n" aria-hidden="true">
                {p.n}
              </span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
              <Icon name="arrow" className="step-arrow" />
            </Glass>
          </LiftItem>
        ))}
      </LiftList>
    </div>
  );
}

export function Process() {
  return (
    <section className="section deep inv-processo" id="processo" aria-labelledby="processo-titulo">
      <Topo seed={41} />
      <div className="wrap">
        <SecHead
          eyebrow={processo.eyebrow}
          id="processo-titulo"
          title={[{ className: 'h-sans', nodes: ['Do seu objetivo'] }, ' ', { className: 'h-sans', nodes: ['à ', { className: 'h-serif', nodes: ['solução'] }] }]}
          intro={processo.intro}
        />
        <Steps />
      </div>
      <Wave className="curve-to-dark" d="M0 60C260 10 520 4 780 40s460 70 660 30v40H0z" />
    </section>
  );
}

export function Testimonials() {
  return (
    <section className="section deep inv-depoimentos" id="depoimentos" aria-labelledby="depoimentos-titulo">
      <PatternWaves preset="lines" color="#9DBCE8" opacity={0.3} fade="edges" fadeSize={0.6} />
      <div className="wrap">
        <SecHead
          eyebrow={depoimentos.eyebrow}
          id="depoimentos-titulo"
          title={duasVozes(depoimentos.tituloSans, depoimentos.tituloSerif)}
          intro={
            <>
              {depoimentos.intro} <span className="note">{depoimentos.nota}</span>
            </>
          }
        />
        {/* PLACEHOLDER: depoimentos fictícios; substituir por depoimentos reais autorizados antes de publicar */}
        <Rail className="quotes" label="Depoimentos">
          {depoimentos.itens.map((q, i) => (
            <LiftItem key={q.iniciais} i={i}>
              <Glass tone="dark" tilt glow className="quote">
                <blockquote>
                  <p>{q.texto}</p>
                </blockquote>
                <p className="quote-by">
                  <span className="initials" aria-hidden="true">
                    {q.iniciais}
                  </span>
                  <span>
                    <strong>{q.nome}</strong> {q.papel}
                  </span>
                </p>
              </Glass>
            </LiftItem>
          ))}
        </Rail>
      </div>
      <Wave className="curve-to-dark" d="M0 110V70C300 70 520 20 760 30s480 50 680 0v80z" />
    </section>
  );
}
