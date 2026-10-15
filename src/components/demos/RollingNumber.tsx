/*
 * Número de odômetro, compartilhado pelas demos (adaptado do kokonutui, MIT): cada dígito é uma fita 0-9 numa
 * janela de um dígito, movida com translateY. As colunas são contadas da direita, então quando o número ganha um
 * dígito as unidades continuam no lugar; a coluna da direita gira primeiro.
 */
const DIGITS = '0123456789'.split('');

/** 1284 -> "1.284". À mão (e não com Intl), para o texto do servidor e o do navegador serem idênticos na hidratação. */
export const milhar = (n: number) => String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

export function RollingNumber({ value, stagger = 30 }: { value: string; stagger?: number }) {
  const chars = Array.from(value);
  return (
    <span className="roll" aria-hidden="true">
      {chars.map((ch, i) => {
        const fromRight = chars.length - i;
        const d = ch.charCodeAt(0) - 48;
        if (d < 0 || d > 9) return <span key={`s${fromRight}`}>{ch}</span>;
        return (
          <span className="roll__win" key={`d${fromRight}`}>
            <span className="roll__sizer">0</span>
            <span className="roll__strip" style={{ transform: `translateY(${-d * 10}%)`, transitionDelay: `${(fromRight - 1) * stagger}ms` }}>
              {DIGITS.map((n) => (
                <span key={n}>{n}</span>
              ))}
            </span>
          </span>
        );
      })}
    </span>
  );
}
