import { useEffect } from 'react';
import { prefersReducedMotion } from './useLandingEffects';

/*
 * Divisórias em onda (<Wave />): maré contínua + reação à rolagem.
 * Parada, a onda ondula sozinha devagar. Ao rolar, a "energia" sobe conforme a velocidade da rolagem:
 * amplitude e velocidade aumentam e voltam suavemente ao ritmo de repouso quando a rolagem para.
 * Duas camadas de preenchimento (frente e trás, em paralaxe) + linha de luz na crista.
 * Só o atributo d muda (sem layout); as pontas sempre cobrem 0..1440, então não abre fenda nas bordas.
 * O laço só roda com alguma onda visível e a aba ativa. Com movimento reduzido: estáticas.
 */

type Params = { base: number; a1: number; f1: number; p1: number; a2: number; f2: number; p2: number; v: number };

// Uma linha por divisória, na ordem em que aparecem na página
const PARAMS: Params[] = [
  { base: 60, a1: 24, f1: 0.72, p1: 2.6, a2: 7, f2: 1.7, p2: 0.4, v: 1.0 }, // hero > serviços
  { base: 58, a1: 21, f1: 0.88, p1: 1.7, a2: 6, f2: 2.0, p2: 0.9, v: 0.95 }, // serviços > na prática
  { base: 55, a1: 23, f1: 0.8, p1: -1.2, a2: 7, f2: 1.8, p2: 1.6, v: 1.1 }, // na prática > processo
  { base: 54, a1: 22, f1: 0.95, p1: 0.2, a2: 7, f2: 2.1, p2: 1.1, v: 1.15 }, // processo > diferenciais
  { base: 54, a1: 23, f1: 1.05, p1: -0.7, a2: 6, f2: 1.9, p2: 2.0, v: 0.9 }, // diferenciais > depoimentos
  { base: 56, a1: 22, f1: 0.85, p1: 1.3, a2: 7, f2: 2.2, p2: 0.6, v: 1.05 }, // depoimentos > contato
];
const W = 1440;
const H = 110;
const PASSOS = 16;
const TAU = Math.PI * 2;
const REPOUSO = 0.5; // rad/s da maré parada
const EXTRA = 2.6; // rad/s a mais com rolagem rápida
const AMP_EXTRA = 0.55; // até +55% de amplitude com rolagem rápida

type Pt = [number, number];
const limita = (y: number) => Math.max(5, Math.min(105, y));
const pontos = (fn: (t: number) => number): Pt[] => {
  const pts: Pt[] = [];
  for (let i = 0; i <= PASSOS; i++) {
    const x = (W * i) / PASSOS;
    pts.push([x, limita(fn(x / W))]);
  }
  return pts;
};
const curva = (pts: Pt[]) => {
  let d = '';
  for (let k = 0; k < pts.length - 1; k++) {
    const p0 = pts[k - 1] || pts[k];
    const p1 = pts[k];
    const p2 = pts[k + 1];
    const p3 = pts[k + 2] || p2;
    d +=
      'C' +
      (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
      (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
      p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
  }
  return d;
};
const preenchido = (pts: Pt[]) => `M0 ${H + 1}L0 ${pts[0][1].toFixed(1)}${curva(pts)}L${W} ${H + 1}Z`;
const linha = (pts: Pt[]) => `M0 ${pts[0][1].toFixed(1)}${curva(pts)}`;

type Onda = {
  svg: SVGSVGElement;
  c: Params;
  tempo: number;
  visivel: boolean;
  front: SVGPathElement;
  back: SVGPathElement;
  crest: SVGPathElement;
  glow: SVGPathElement;
  crestBack: SVGPathElement;
};

function desenhaOnda(o: Onda, fase: number, energia: number) {
  const c = o.c;
  const amp = 1 + AMP_EXTRA * energia;
  const frente = pontos((t) => c.base + c.a1 * amp * Math.sin(TAU * c.f1 * t + c.p1 + fase) + c.a2 * amp * Math.sin(TAU * c.f2 * t + c.p2 - 1.3 * fase));
  const tras = pontos(
    (t) => c.base - 15 + 0.9 * c.a1 * amp * Math.sin(TAU * c.f1 * t + c.p1 + 0.6 + 1.4 * fase) + c.a2 * Math.sin(TAU * c.f2 * t + c.p2 + 1.2 - 0.8 * fase),
  );
  const dFrente = linha(frente);
  o.front.setAttribute('d', preenchido(frente));
  o.back.setAttribute('d', preenchido(tras));
  o.crest.setAttribute('d', dFrente);
  o.glow.setAttribute('d', dFrente);
  o.crestBack.setAttribute('d', linha(tras));
  o.svg.style.setProperty('--wave-energy', energia.toFixed(3));
}

function faseRolagem(svg: SVGSVGElement) {
  const r = svg.getBoundingClientRect();
  const vh = window.innerHeight || 800;
  const prog = (vh / 2 - (r.top + r.height / 2)) / vh; // -1 entrando por baixo, +1 saindo por cima
  return Math.max(-1.5, Math.min(1.5, prog)) * 2.4;
}

export function useWaves() {
  useEffect(() => {
    const lista: Onda[] = [...document.querySelectorAll<SVGSVGElement>('[data-wave]')].map((svg, i) => ({
      svg,
      c: PARAMS[i % PARAMS.length],
      tempo: 0,
      visivel: true,
      front: svg.querySelector<SVGPathElement>('.wave-front')!,
      back: svg.querySelector<SVGPathElement>('.wave-back')!,
      crest: svg.querySelector<SVGPathElement>('.wave-crest')!,
      glow: svg.querySelector<SVGPathElement>('.wave-glow')!,
      crestBack: svg.querySelector<SVGPathElement>('.wave-crest-back')!,
    }));
    if (!lista.length) return;
    if (prefersReducedMotion()) {
      lista.forEach((o) => desenhaOnda(o, 0, 0));
      return;
    }

    let energia = 0;
    let ultimoY = window.scrollY;
    let ultimoT = 0;
    let rodando = false;
    let raf = 0;
    const quadro = (agora: number) => {
      const dt = ultimoT ? Math.min(0.05, (agora - ultimoT) / 1000) : 0.016;
      ultimoT = agora;
      // velocidade da rolagem -> energia (sobe rápido, desce suave em ~0,8 s)
      const y = window.scrollY;
      const vel = Math.abs(y - ultimoY) / Math.max(dt, 0.001);
      ultimoY = y;
      const alvo = Math.min(1, vel / 2200);
      const decaida = energia * Math.exp(-dt / 0.8);
      energia = alvo > decaida ? decaida + (alvo - decaida) * 0.3 : decaida;
      let algumaVisivel = false;
      lista.forEach((o) => {
        o.tempo += dt * (REPOUSO + EXTRA * energia) * o.c.v;
        if (!o.visivel) return;
        algumaVisivel = true;
        desenhaOnda(o, o.tempo + faseRolagem(o.svg), energia);
      });
      if (algumaVisivel && !document.hidden) raf = requestAnimationFrame(quadro);
      else {
        rodando = false;
        ultimoT = 0;
      }
    };
    const liga = () => {
      if (rodando) return;
      rodando = true;
      ultimoY = window.scrollY;
      raf = requestAnimationFrame(quadro);
    };

    let io: IntersectionObserver | undefined;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => lista.forEach((o) => o.svg === en.target && (o.visivel = en.isIntersecting)));
          liga();
        },
        { rootMargin: '120px 0px' },
      );
      lista.forEach((o) => io!.observe(o.svg));
    }
    lista.forEach((o) => desenhaOnda(o, faseRolagem(o.svg), 0));
    const onVisible = () => {
      if (!document.hidden) liga();
    };
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('scroll', liga, { passive: true });
    liga();

    return () => {
      cancelAnimationFrame(raf);
      io?.disconnect();
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('scroll', liga);
    };
  }, []);
}
