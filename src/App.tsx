import { LazyMotion, MotionConfig, domAnimation, useReducedMotion } from 'motion/react';
import { ReactLenis } from 'lenis/react';
import { Contact, WhatsAppFloat } from './components/Contact';
import { Examples } from './components/Examples';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { SvgDefs } from './components/Icons';
import { Perks, Process, Services, Testimonials } from './components/Sections';
import { useLandingEffects } from './hooks/useLandingEffects';
import { useWaves } from './hooks/useWaves';
import './styles/landing.css';

export function App() {
  useLandingEffects();
  useWaves();
  const reduce = useReducedMotion();

  return (
    // LazyMotion + m.*: carrega só os recursos de animação de DOM usados na página (bundle menor)
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {/* rolagem suave com inércia. Âncoras sem deslocamento: o html já tem scroll-padding-top (que o Lenis respeita) */}
        {!reduce && <ReactLenis root options={{ lerp: 0.085, anchors: { offset: 0 } }} />}
        <SvgDefs />
        <a className="skip" href="#conteudo">
          Pular para o conteúdo
        </a>
        <Header />

        <main id="conteudo">
          <Hero />
          {/* mesma ordem do menu: Serviços, Como funciona (Processo), Sobre (Diferenciais) */}
          <Services />
          {/* demos interativas: o que dá para construir, funcionando */}
          <Examples />
          <Process />
          <Perks />
          <Testimonials />
          <Contact />
        </main>

        <WhatsAppFloat />
      </MotionConfig>
    </LazyMotion>
  );
}
