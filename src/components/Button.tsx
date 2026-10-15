import type { ComponentPropsWithRef } from 'react';
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
};

/** Cores do reflexo por variante: linha clara e um contorno base discreto, no tom do botão. */
type RGB = [number, number, number];
export const SPECULAR: Record<'mint' | 'outline', { lineColor: RGB; baseColor: RGB }> = {
  mint: { lineColor: [1, 1, 1], baseColor: [0.17, 0.39, 0.44] },
  outline: { lineColor: [0.91, 1, 0.98], baseColor: [0.62, 0.79, 0.76] },
};

export function Button({ href, variant = 'mint', size = 'md', external = false, specular = false, specularRadius = 999, className, children, ...rest }: Props) {
  const classes = ['btn', `btn-${variant}`, size === 'lg' && 'btn-lg', specular && 'btn-specular', className].filter(Boolean).join(' ');
  return (
    <a className={classes} href={href} {...(external ? { target: '_blank', rel: 'noopener' } : {})} {...rest}>
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
