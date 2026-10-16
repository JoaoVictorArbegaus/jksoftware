import type { ComponentPropsWithRef, CSSProperties, ReactNode, Ref } from 'react';
import { useLiquidGlass } from './LiquidGlass';
import { SpecularLight } from './SpecularLight';

type Props = ComponentPropsWithRef<'a'> & {
  href: string;
  /** `mint`: ação principal (WhatsApp); `outline`: secundário no cabeçalho. */
  variant?: 'mint' | 'outline';
  size?: 'md' | 'lg';
  /** Abre em nova aba com rel="noopener". */
  external?: boolean;
  /** Reflexo especular que corre pela borda e segue o cursor (SpecularButton; só com mouse). */
  specular?: boolean;
  /** Raio dos cantos usado pelo reflexo (999 = pílula). */
  specularRadius?: number;
  /** Vidro líquido (GlassSurface): o fundo entorta nas bordas, com aberração cromática (só Chromium). */
  liquid?: boolean;
};

/** Cores do reflexo por variante: linha clara e um contorno base discreto, no tom do botão. */
type RGB = [number, number, number];
export const SPECULAR: Record<'mint' | 'outline', { lineColor: RGB; baseColor: RGB }> = {
  mint: { lineColor: [1, 1, 1], baseColor: [0.17, 0.39, 0.44] },
  outline: { lineColor: [0.91, 1, 0.98], baseColor: [0.62, 0.79, 0.76] },
};

export function Button({ liquid = false, ...props }: Props) {
  return liquid ? <LiquidButton {...props} /> : <PlainButton {...props} />;
}

function PlainButton(props: Props) {
  return <ButtonTag {...props} />;
}

/** Botão de vidro líquido: o filtro só entra depois de montar, no Chromium (classe .liquid-on + --liquid). */
function LiquidButton({ specularRadius = 999, ...props }: Props) {
  const glass = useLiquidGlass<HTMLAnchorElement>({ borderRadius: specularRadius, borderWidth: 0.5, blur: 6, distortionScale: -110, brightness: 55 });
  const style = glass.on ? ({ ...props.style, '--liquid': `url(#${glass.filterId})` } as CSSProperties) : props.style;
  return (
    <ButtonTag {...props} specularRadius={specularRadius} anchorRef={glass.ref} style={style} extraClass={glass.on ? 'btn-liquid liquid-on' : 'btn-liquid'} defs={glass.defs} />
  );
}

function ButtonTag({
  href,
  variant = 'mint',
  size = 'md',
  external = false,
  specular = false,
  specularRadius = 999,
  className,
  children,
  anchorRef,
  extraClass,
  defs,
  ...rest
}: Props & { anchorRef?: Ref<HTMLAnchorElement>; extraClass?: string; defs?: ReactNode }) {
  const classes = ['btn', `btn-${variant}`, size === 'lg' && 'btn-lg', specular && 'btn-specular', extraClass, className].filter(Boolean).join(' ');
  return (
    <a ref={anchorRef} className={classes} href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})} {...rest}>
      {defs}
      {specular ? (
        <>
          <SpecularLight radius={specularRadius} lineColor={SPECULAR[variant].lineColor} baseColor={SPECULAR[variant].baseColor} />
          <span className="specular__label">{children}</span>
        </>
      ) : (
        children
      )}
    </a>
  );
}
