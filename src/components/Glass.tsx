import type { ComponentPropsWithRef, CSSProperties, ElementType, ReactNode } from 'react';
import { BorderGlow } from './BorderGlow';
import { useLiquidGlass } from './LiquidGlass';

type Props<T extends ElementType> = {
  as?: T;
  /** `dark`: vidro escuro (hero, diferenciais, formulário); `deep`: cards sobre a névoa; `light`: passos do processo. */
  tone: 'dark' | 'deep' | 'light';
  /** Inclina levemente na direção do cursor no hover (só mouse; ver useLandingEffects). */
  tilt?: boolean;
  /** Borda luminosa que acende perto da borda, na direção do cursor (BorderGlow). */
  glow?: boolean;
  /** Vidro líquido: refração e aberração cromática nas bordas (GlassSurface; só Chromium). */
  liquid?: boolean;
} & Omit<ComponentPropsWithRef<T>, 'as'>;

const classes = (tone: string, tilt: boolean, className?: string, extra?: string) =>
  ['glass', `glass-${tone}`, tilt && 'tilt', extra, className].filter(Boolean).join(' ');

/**
 * Superfície de vidro (classes `.glass` e `.glass-<tone>` em landing.css), com reflexo e borda luminosa que
 * seguem o cursor (`.glass-shine`) e refração do fundo no Chromium (`.has-refraction`).
 */
export function Glass<T extends ElementType = 'div'>({ as, tone, tilt = false, glow = false, liquid = false, className, children, ...rest }: Props<T>) {
  if (liquid) return <LiquidGlassTag as={as} tone={tone} tilt={tilt} glow={glow} className={className} rest={rest}>{children}</LiquidGlassTag>;
  const Tag = (as ?? 'div') as ElementType;
  return (
    <Tag className={classes(tone, tilt, className)} {...rest}>
      <span className="glass-shine" aria-hidden="true" />
      {glow && <BorderGlow />}
      {children}
    </Tag>
  );
}

function LiquidGlassTag({
  as,
  tone,
  tilt,
  glow,
  className,
  rest,
  children,
}: {
  as?: ElementType;
  tone: string;
  tilt: boolean;
  glow: boolean;
  className?: string;
  rest: Record<string, unknown>;
  children?: ReactNode;
}) {
  const Tag = (as ?? 'div') as ElementType;
  const liquid = useLiquidGlass<HTMLElement>();
  // o filtro só entra no backdrop-filter depois de montar e no Chromium (classe .liquid-on + --liquid)
  const style = liquid.on ? ({ ...(rest.style as CSSProperties), '--liquid': `url(#${liquid.filterId})` } as CSSProperties) : (rest.style as CSSProperties);
  return (
    <Tag ref={liquid.ref} className={classes(tone, tilt, className, liquid.on ? 'liquid-on' : undefined)} {...rest} style={style}>
      {liquid.defs}
      <span className="glass-shine" aria-hidden="true" />
      {glow && <BorderGlow />}
      {children}
    </Tag>
  );
}
