import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { EMAIL, header, MENSAGENS, menuCelular, menuCompleto, nav, whatsapp } from '../content/site';
import { Button } from './Button';
import { CardNav } from './CardNav';
import { StaggeredMenu } from './StaggeredMenu';
import { GooeyNav } from './GooeyNav';
import { useLiquidGlass } from './LiquidGlass';
import { Icon } from './Icons';

/** Cabeçalho fixo: ganha fundo de vidro ao rolar e marca a seção atual. No celular, a pílula vira o CardNav. */
export function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState<string | null>(null);
  // depois de um clique no menu, a seção ativa fica presa no destino enquanto a rolagem suave passa pelas outras
  const lockRef = useRef<{ id: string; until: number } | null>(null);
  // vidro líquido (GlassSurface) na barra: a faixa de baixo entorta o conteúdo que passa por trás
  const liquid = useLiquidGlass<HTMLSpanElement>({ borderRadius: 36, borderWidth: 0.5, blur: 9, distortionScale: -120 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Marca no menu a seção que ocupa o meio da tela
  useEffect(() => {
    if (!('IntersectionObserver' in window)) return;
    const ids = nav.map((n) => n.href.slice(1));
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((en) => {
          const lock = lockRef.current;
          if (lock && performance.now() < lock.until) return;
          if (en.isIntersecting) setActive(en.target.id);
          else setActive((cur) => (cur === en.target.id ? null : cur));
        }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    ids.forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
    return () => io.disconnect();
  }, []);

  // depois de um clique no menu, a seção ativa fica presa no destino enquanto a rolagem suave passa pelas outras
  const lockTo = (href: string) => {
    const id = href.slice(1);
    lockRef.current = { id, until: performance.now() + 1400 };
    setActive(id);
  };
  const onGooey = (i: number) => lockTo(nav[i].href);
  const activeIndex = nav.findIndex((n) => n.href.slice(1) === active);

  const classes = scrolled ? 'site-header is-scrolled' : 'site-header';
  const brand = (
    <a className="brand" href="#topo" aria-label="JK Software, voltar ao início">
      <img src="/img/logo-jk-120.webp" srcSet="/img/logo-jk-120.webp 1x, /img/logo-jk-240.png 2x" alt="" width={44} height={32} />
      <span>JK Software</span>
    </a>
  );

  return (
    <header className={classes} data-header="">
      {/* desktop: a barra é uma pílula de vidro flutuante (não ocupa a largura toda) */}
      <div className="wrap header-bar">
        <span
          ref={liquid.ref}
          className={liquid.on ? 'header-glass liquid-on' : 'header-glass'}
          style={liquid.on ? ({ '--liquid': `url(#${liquid.filterId})` } as CSSProperties) : undefined}
          aria-hidden="true"
        >
          {liquid.defs}
        </span>
        {brand}
        {/* desktop: pílula líquida que acompanha a seção ativa (GooeyNav) */}
        <nav className="nav-desktop" aria-label="Principal">
          {/* pílula de vidro menta translúcido com texto claro (a menta chapada destoava do cabeçalho) */}
          <GooeyNav items={nav} activeIndex={activeIndex} onSelect={onGooey} color="#9DBCE8" pillOpacity={0.24} shadow={0.12} activeTextColor="#F2F6F3" />
        </nav>
        <Button href="#contato" variant="outline" className="header-cta" specular>
          {header.cta} <Icon name="arrow" />
        </Button>
        {/* menu completo (StaggeredMenu): todas as seções e os contatos, num painel que entra em camadas */}
        <StaggeredMenu
          items={menuCompleto.itens}
          socials={[
            { href: whatsapp(MENSAGENS.geral), label: 'WhatsApp', external: true },
            { href: `mailto:${EMAIL}`, label: 'E-mail' },
          ]}
          socialsTitle={menuCompleto.contatosTitulo}
          note={menuCompleto.nota}
          active={active}
          onNavigate={lockTo}
        />
      </div>
      {/* celular e tablet: a pílula abre em cards (CardNav) */}
      <div className="wrap header-cards">
        <CardNav logo={brand} items={menuCelular} cta={{ href: '#contato', label: header.ctaMobile }} active={active} onNavigate={lockTo} />
      </div>
    </header>
  );
}
