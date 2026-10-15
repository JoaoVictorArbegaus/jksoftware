import { Children, useEffect, useRef, useState, type ReactNode } from 'react';
import { prefersReducedMotion } from '../hooks/useLandingEffects';
import { LiftList } from './Motion';

/**
 * Lista que vira carrossel com deslizamento abaixo de 960px (CSS: `.rail-track`) e grade a partir daí.
 * Os indicadores acompanham o card centralizado e levam a cada card; somem quando tudo cabe na tela.
 */
export function Rail({ className, label, children }: { className: string; label: string; children: ReactNode }) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [active, setActive] = useState(0);
  const [scrollable, setScrollable] = useState(false);
  const count = Children.count(children);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const items = () => [...track.children] as HTMLElement[];
    const update = () => {
      setScrollable(track.scrollWidth > track.clientWidth + 2);
      // card cujo centro está mais perto do centro da trilha
      const mid = track.scrollLeft + track.clientWidth / 2;
      let best = 0;
      let dist = Infinity;
      items().forEach((el, i) => {
        const d = Math.abs(el.offsetLeft + el.offsetWidth / 2 - mid);
        if (d < dist) {
          dist = d;
          best = i;
        }
      });
      setActive(best);
    };
    update();
    track.addEventListener('scroll', update, { passive: true });
    const ro = 'ResizeObserver' in window ? new ResizeObserver(update) : undefined;
    ro?.observe(track);
    return () => {
      track.removeEventListener('scroll', update);
      ro?.disconnect();
    };
  }, []);

  const go = (i: number) => {
    const track = trackRef.current;
    const el = track?.children[i] as HTMLElement | undefined;
    if (!track || !el) return;
    track.scrollTo({ left: el.offsetLeft - (track.clientWidth - el.offsetWidth) / 2, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  return (
    <div className="rail">
      <LiftList ref={trackRef} className={`${className} rail-track`} role="list" aria-label={label}>
        {children}
      </LiftList>
      <div className="rail-dots" hidden={!scrollable}>
        {Array.from({ length: count }, (_, i) => (
          <button
            key={i}
            type="button"
            className={i === active ? 'rail-dot is-active' : 'rail-dot'}
            aria-label={`Mostrar o card ${i + 1} de ${count}`}
            aria-current={i === active ? 'true' : undefined}
            onClick={() => go(i)}
          />
        ))}
      </div>
    </div>
  );
}
