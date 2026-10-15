/**
 * Ícone de vidro: uma placa colorida inclinada atrás de um vidro fosco com reflexo, como nos ícones de sistema.
 * No hover do card, a placa gira mais e o vidro sobe.
 *
 * Adaptado de React Bits — GlassIcons (https://reactbits.dev), licença MIT.
 * Mudanças: só a versão em DOM/CSS (sem o renderizador WebGL), um ícone por vez dentro dos cards,
 * gradientes da marca, ícones do sprite próprio e hover comandado pelo card.
 */
import { Icon, type IconName } from './Icons';

export type GlassIconTone = 'menta' | 'agua' | 'petroleo';

export function GlassIcon({ name, tone = 'menta', size = 'md' }: { name: IconName; tone?: GlassIconTone; size?: 'md' | 'lg' }) {
  return (
    <span className={`gicon gicon--${tone} gicon--${size}`} aria-hidden="true">
      <span className="gicon__plate" />
      <span className="gicon__glass">
        <span className="gicon__shine" />
      </span>
      <span className="gicon__glyph">
        <Icon name={name} />
      </span>
    </span>
  );
}
