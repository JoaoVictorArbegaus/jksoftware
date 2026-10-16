import { useRef } from 'react';
import { m, useReducedMotion, useScroll, useTransform } from 'motion/react';
import { hero, MENSAGENS, whatsapp } from '../content/site';
import { Button } from './Button';
import { HeroShowcase } from './HeroShowcase';
import { Icon } from './Icons';
import { TypeWriter } from './TypeWriter';
import { Wave } from './Wave';

/**
 * Topo: foto de montanhas na névoa, título em duas vozes e a vitrine de vidro com os serviços funcionando.
 * Entradas em CSS (`.line-in`, `.reveal`) para não atrasar o LCP; a paralaxe é ligada à rolagem (Motion).
 */
export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] });
  // a foto desce mais devagar que a página; o texto sobe um pouco (só transform: o botão e o card são vidro)
  const bgY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 160]);
  const copyY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, -70]);

  return (
    <section className="hero" id="topo" aria-labelledby="hero-titulo" ref={ref}>
      <m.div className="hero-bg" style={{ y: bgY }}>
        <img src={hero.fundo.src} alt="" width={hero.fundo.w} height={hero.fundo.h} fetchPriority="high" />
      </m.div>
      <div className="wrap hero-grid">
        <m.div className="hero-copy" style={{ y: copyY }}>
          <p className="eyebrow reveal">
            <TypeWriter phrases={[hero.eyebrow]} />
          </p>
          <h1 id="hero-titulo">
            <span className="h-sans">
              <span className="line-in">{hero.tituloSans}</span>
            </span>
            <span className="h-serif">
              <span className="line-in">{hero.tituloSerif}</span>
            </span>
          </h1>
          <p className="lede reveal">{hero.lede}</p>
          <span className="reveal hero-cta">
            <Button href={whatsapp(MENSAGENS.geral)} size="lg" className="btn-hero" data-wa="geral" external specular specularRadius={16} liquid>
              <Icon name="whatsapp" className="ic-wa" />
              {hero.cta}
              <span className="btn-hero__arrow" aria-hidden="true">
                <Icon name="arrow" className="ic-arrow" />
              </span>
            </Button>
          </span>
        </m.div>
        {/* vitrine grande: os três serviços funcionando, em abas que trocam sozinhas (no lugar do card pequeno) */}
        <div className="hero-visual">
          <HeroShowcase />
        </div>
      </div>
      <Wave className="curve-hero" d="M0 18C210 46 420 88 720 100c300 12 520-22 720-90v100H0z" />
    </section>
  );
}
