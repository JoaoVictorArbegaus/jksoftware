/**
 * Vidro líquido: um mapa de deslocamento do tamanho do elemento entorta o fundo só perto das bordas, com
 * separação de cores (aberração cromática), como uma lâmina de vidro grossa. O centro fica limpo para o texto.
 *
 * Adaptado de React Bits — GlassSurface (https://reactbits.dev), licença MIT.
 * Mudanças: vira um hook usado pelo componente `Glass` (mantém o tom petróleo, o desfoque e o brightness do
 * contrato, que seguram o contraste); só o modo de filtro SVG, que só o Chromium aplica em backdrop-filter —
 * nos outros navegadores fica o vidro de sempre; sem os modos WebGL e por imagem de forma.
 */
import { useEffect, useId, useRef, useState, type ReactNode, type RefObject } from 'react';

type Options = {
  borderRadius?: number;
  /** Largura da borda que refrata, em fração do menor lado. */
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
};

/** Só o Chromium aplica filtro SVG (url) em backdrop-filter. */
function supportsSvgBackdrop() {
  const brands = (navigator as Navigator & { userAgentData?: { brands: { brand: string }[] } }).userAgentData?.brands;
  return !!brands?.some((b) => /Chromium/.test(b.brand));
}

export function useLiquidGlass<T extends HTMLElement>({
  borderRadius = 20,
  borderWidth = 0.07,
  brightness = 50,
  opacity = 0.93,
  blur = 11,
  distortionScale = -180,
  redOffset = 0,
  greenOffset = 10,
  blueOffset = 20,
}: Options = {}): { ref: RefObject<T | null>; on: boolean; filterId: string; defs: ReactNode } {
  const ref = useRef<T>(null);
  const uid = useId().replace(/[^a-zA-Z0-9-]/g, '');
  const filterId = `liquido-${uid}`;
  const feImageRef = useRef<SVGFEImageElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (supportsSvgBackdrop()) setOn(true);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!on || !el) return;
    // mapa: vermelho varia na horizontal e azul na vertical (direção do deslocamento); o miolo cinza (50%)
    // desfocado não desloca nada, então só a faixa da borda entorta o fundo
    const update = () => {
      const w = el.offsetWidth || 400;
      const h = el.offsetHeight || 200;
      const edge = Math.min(w, h) * (borderWidth * 0.5);
      const svg = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="r" x1="100%" y1="0%" x2="0%" y2="0%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="red"/></linearGradient>
          <linearGradient id="b" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#0000"/><stop offset="100%" stop-color="blue"/></linearGradient>
          <filter id="s" filterUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}" color-interpolation-filters="sRGB"><feGaussianBlur stdDeviation="${blur}"/></filter>
        </defs>
        <rect x="0" y="0" width="${w}" height="${h}" fill="black"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#r)"/>
        <rect x="0" y="0" width="${w}" height="${h}" rx="${borderRadius}" fill="url(#b)" style="mix-blend-mode: difference"/>
        <rect x="${edge}" y="${edge}" width="${w - edge * 2}" height="${h - edge * 2}" rx="${borderRadius}" fill="hsl(0 0% ${brightness}% / ${opacity})" filter="url(#s)"/>
      </svg>`;
      feImageRef.current?.setAttribute('href', `data:image/svg+xml,${encodeURIComponent(svg)}`);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [on, borderRadius, borderWidth, brightness, opacity, blur]);

  const defs = (
    <svg className="liquid__defs" aria-hidden="true" focusable="false">
      <defs>
        <filter id={filterId} colorInterpolationFilters="sRGB" x="0%" y="0%" width="100%" height="100%">
          <feImage ref={feImageRef} x="0" y="0" width="100%" height="100%" preserveAspectRatio="none" result="map" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + redOffset} xChannelSelector="R" yChannelSelector="G" result="dispRed" />
          <feColorMatrix in="dispRed" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="red" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + greenOffset} xChannelSelector="R" yChannelSelector="G" result="dispGreen" />
          <feColorMatrix in="dispGreen" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="green" />
          <feDisplacementMap in="SourceGraphic" in2="map" scale={distortionScale + blueOffset} xChannelSelector="R" yChannelSelector="G" result="dispBlue" />
          <feColorMatrix in="dispBlue" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="blue" />
          <feBlend in="red" in2="green" mode="screen" result="rg" />
          <feBlend in="rg" in2="blue" mode="screen" result="output" />
          <feGaussianBlur in="output" stdDeviation="0.7" />
        </filter>
      </defs>
    </svg>
  );

  return { ref, on, filterId, defs };
}
