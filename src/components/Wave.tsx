/**
 * Divisória em onda entre seções. O preenchimento inicial (`d`) é o desenho estático; o hook `useWaves`
 * redesenha as camadas a cada quadro (maré contínua + reação à rolagem), na ordem em que as ondas aparecem na página.
 */
export function Wave({ className, d }: { className: string; d: string }) {
  return (
    <svg className={`curve ${className}`} viewBox="0 0 1440 110" preserveAspectRatio="none" aria-hidden="true" data-wave="">
      <path className="wave-fill wave-back" d={d} />
      <path className="wave-crest-back" d="" />
      <path className="wave-fill wave-front" d={d} />
      <path className="wave-glow" d="" />
      <path className="wave-crest" d="" />
    </svg>
  );
}
