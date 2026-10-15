import { useEffect } from 'react';
import { edgeGlow } from '../components/BorderGlow';

export const prefersReducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** Efeitos globais. O conteúdo pré-renderizado é visível sem JS; estes efeitos só acrescentam movimento. */
export function useLandingEffects() {
  // Entrada dos blocos do topo e do formulário ao aparecer na tela (CSS: `.js .reveal`).
  // As seções abaixo da dobra entram com o Motion (Motion.tsx).
  useEffect(() => {
    const reveals = document.querySelectorAll<HTMLElement>('.reveal');
    document.querySelectorAll('section').forEach((sec) => {
      sec.querySelectorAll<HTMLElement>('.reveal').forEach((el, i) => el.style.setProperty('--d', `${Math.min(i * 80, 480)}ms`));
    });
    if (prefersReducedMotion() || !('IntersectionObserver' in window)) {
      reveals.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }),
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    reveals.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Vidro: refração do fundo (só o Chromium aplica filtro SVG em backdrop-filter) e reflexo, borda luminosa
  // e inclinação que seguem o cursor. Só com mouse; sem inclinação com movimento reduzido.
  useEffect(() => {
    const doc = document.documentElement;
    const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
    if (brands?.some((b) => /Chromium/.test(b.brand))) doc.classList.add('has-refraction');

    if (!window.matchMedia('(hover: hover) and (pointer: fine)').matches) return;
    const reduce = prefersReducedMotion();
    const MAX = 5; // graus
    let last: HTMLElement | null = null;
    const clear = (el: HTMLElement) => ['--mx', '--my', '--rx', '--ry', '--edge-proximity', '--cursor-angle'].forEach((v) => el.style.removeProperty(v));
    const onPointer = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      const g = (e.target as Element).closest?.<HTMLElement>('.glass, .btn') ?? null;
      if (last && last !== g) clear(last);
      last = g;
      if (!g) return;
      const r = g.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      g.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
      g.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
      // borda luminosa (BorderGlow): proximidade da borda e ângulo do cursor
      if (g.querySelector(':scope > .bglow')) {
        const { edge, angle } = edgeGlow(r.width, r.height, e.clientX - r.left, e.clientY - r.top);
        g.style.setProperty('--edge-proximity', edge.toFixed(2));
        g.style.setProperty('--cursor-angle', `${angle.toFixed(2)}deg`);
      }
      if (!reduce && g.classList.contains('tilt')) {
        g.style.setProperty('--rx', `${((px - 0.5) * 2 * MAX).toFixed(2)}deg`);
        g.style.setProperty('--ry', `${((0.5 - py) * 2 * MAX).toFixed(2)}deg`);
      }
    };
    const onLeave = () => {
      if (last) clear(last);
      last = null;
    };
    document.addEventListener('pointermove', onPointer, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    return () => {
      document.removeEventListener('pointermove', onPointer);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      doc.classList.remove('has-refraction');
    };
  }, []);
}
