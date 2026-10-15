export type IconName = 'arrow' | 'whatsapp' | 'spark' | 'layers' | 'monitor' | 'sync' | 'user' | 'shield' | 'mail' | 'pin' | 'chevron' | 'menu' | 'close' | 'check' | 'arrow-up-right';

/** Sprite de ícones e o filtro de brilho das ondas. Renderizado uma vez no App. */
export function SvgDefs() {
  return (
    <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false">
      <defs>
        <filter id="onda-brilho" x="-5%" y="-150%" width="110%" height="400%">
          <feGaussianBlur stdDeviation="3.2" />
        </filter>
        {/* Refração do vidro (Chromium): ruído suave desloca o fundo atrás do card, como vidro com espessura */}
        <filter id="vidro-refracao" x="0" y="0" width="100%" height="100%" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.009 0.014" numOctaves={2} seed={7} result="ruido" />
          <feGaussianBlur in="ruido" stdDeviation="2.5" result="suave" />
          <feDisplacementMap in="SourceGraphic" in2="suave" scale={28} xChannelSelector="R" yChannelSelector="G" />
        </filter>
        <symbol id="i-arrow" viewBox="0 0 24 24">
          <path d="M4 12h15" />
          <path d="m13 6 6 6-6 6" />
        </symbol>
        <symbol id="i-whatsapp" viewBox="0 0 24 24">
          <path d="M12 2.6a9.4 9.4 0 0 0-8.1 14.2L2.6 21.4l4.7-1.2A9.4 9.4 0 1 0 12 2.6z" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
          <path
            d="M8.7 7.6c.3-.6.6-.6.9-.6h.5c.2 0 .4 0 .6.5l.8 1.8c.1.2.1.4 0 .6l-.5.7c-.1.2-.1.4 0 .6.5.9 1.2 1.6 2.1 2.1.2.1.4.1.6 0l.7-.6c.2-.1.4-.2.6-.1l1.8.9c.3.1.4.3.4.5 0 .6-.2 1.2-.7 1.6-.5.4-1.2.6-1.9.5-1.4-.2-2.7-.9-3.9-2-1.2-1.1-1.9-2.3-2.3-3.7-.2-.8 0-1.6.3-2.2z"
            fill="currentColor"
            stroke="none"
          />
        </symbol>
        <symbol id="i-spark" viewBox="0 0 24 24">
          <path d="M12 1.5v6M12 16.5v6M1.5 12h6M16.5 12h6" />
          <path d="m12 7.5 1.4 3.1 3.1 1.4-3.1 1.4-1.4 3.1-1.4-3.1-3.1-1.4 3.1-1.4z" />
        </symbol>
        <symbol id="i-layers" viewBox="0 0 24 24">
          <path d="M12.8 2.2a2 2 0 0 0-1.6 0L2.6 6.1a1 1 0 0 0 0 1.8l8.6 3.9a2 2 0 0 0 1.6 0l8.6-3.9a1 1 0 0 0 0-1.8z" />
          <path d="m22 12.6-9.2 4.2a2 2 0 0 1-1.6 0L2 12.6" />
          <path d="m22 17.6-9.2 4.2a2 2 0 0 1-1.6 0L2 17.6" />
        </symbol>
        <symbol id="i-monitor" viewBox="0 0 24 24">
          <rect width="20" height="14" x="2" y="3" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </symbol>
        <symbol id="i-sync" viewBox="0 0 24 24">
          <path d="M3 12a9 9 0 0 1 9-9 9.8 9.8 0 0 1 6.7 2.7L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.8 9.8 0 0 1-6.7-2.7L3 16" />
          <path d="M8 16H3v5" />
        </symbol>
        <symbol id="i-user" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="4.5" />
          <path d="M20 21a8 8 0 0 0-16 0" />
        </symbol>
        <symbol id="i-shield" viewBox="0 0 24 24">
          <path d="M20 13c0 5-3.5 7.5-7.7 9a1 1 0 0 1-.6 0C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.2-2.7a1.2 1.2 0 0 1 1.6 0C14.5 3.8 17 5 19 5a1 1 0 0 1 1 1z" />
          <path d="m9 12 2 2 4-4" />
        </symbol>
        <symbol id="i-mail" viewBox="0 0 24 24">
          <rect width="20" height="16" x="2" y="4" rx="2" />
          <path d="m22 7-9 5.7a2 2 0 0 1-2 0L2 7" />
        </symbol>
        <symbol id="i-pin" viewBox="0 0 24 24">
          <path d="M20 10c0 5-5.5 10.2-7.4 11.8a1 1 0 0 1-1.2 0C9.5 20.2 4 15 4 10a8 8 0 0 1 16 0" />
          <circle cx="12" cy="10" r="3" />
        </symbol>
        <symbol id="i-chevron" viewBox="0 0 24 24">
          <path d="m6 9 6 6 6-6" />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16" />
        </symbol>
        <symbol id="i-close" viewBox="0 0 24 24">
          <path d="M6 6l12 12M18 6 6 18" />
        </symbol>
        <symbol id="i-check" viewBox="0 0 24 24">
          <path d="m5 12.5 4.5 4.5L19 7.5" />
        </symbol>
        <symbol id="i-arrow-up-right" viewBox="0 0 24 24">
          <path d="M7 17 17 7M8 7h9v9" />
        </symbol>
      </defs>
    </svg>
  );
}

/** Ícone do sprite (`.ic` herda cor e traço do CSS). */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className ? `ic ${className}` : 'ic'} aria-hidden="true">
      <use href={`#i-${name}`} />
    </svg>
  );
}
