/**
 * Borda luminosa: perto da borda do card, um trecho da borda acende num degradê da marca, na direção do cursor,
 * com um brilho para dentro. Longe da borda, apaga.
 *
 * Adaptado de React Bits — BorderGlow (https://reactbits.dev), licença MIT.
 * Mudanças: vira uma camada decorativa dentro dos cards de vidro (o original tem fundo sólido, que apagaria o
 * vidro); o anel é recortado por máscara em vez de um fundo opaco; sem halo com `inset` negativo (alargaria a
 * página no celular); cores da marca; proximidade da borda e ângulo do cursor (`--edge-proximity`,
 * `--cursor-angle`) calculados em useLandingEffects; só com mouse.
 */
export function BorderGlow() {
  return (
    <span className="bglow" aria-hidden="true">
      <span className="bglow__cone">
        <span className="bglow__ring" />
      </span>
      <span className="bglow__edge" />
    </span>
  );
}

/** Proximidade da borda (0 a 100) e ângulo do cursor em graus, como no original. */
export function edgeGlow(width: number, height: number, x: number, y: number) {
  const cx = width / 2;
  const cy = height / 2;
  const dx = x - cx;
  const dy = y - cy;
  const kx = dx !== 0 ? cx / Math.abs(dx) : Infinity;
  const ky = dy !== 0 ? cy / Math.abs(dy) : Infinity;
  const edge = Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
  let angle = dx === 0 && dy === 0 ? 0 : Math.atan2(dy, dx) * (180 / Math.PI) + 90;
  if (angle < 0) angle += 360;
  return { edge: edge * 100, angle };
}
