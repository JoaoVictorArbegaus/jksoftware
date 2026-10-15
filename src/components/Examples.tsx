import type { ReactNode } from 'react';
import { exemplos, MENSAGENS, whatsapp } from '../content/site';
import { Button } from './Button';
import { Glass } from './Glass';
import { Icon } from './Icons';
import { LiftItem, LiftList, Reveal } from './Motion';
import { SecHead, duasVozes } from './Sections';
import { Wave } from './Wave';
import { AccountMenu } from './demos/AccountMenu';
import { ActivityRings } from './demos/ActivityRings';
import { AutomationFlow } from './demos/AutomationFlow';
import { BellButton } from './demos/BellButton';
import { CardSwap } from './demos/CardSwap';
import { CurvedLoop } from './demos/CurvedLoop';
import { DocFolder } from './demos/DocFolder';
import { MetricCard } from './demos/MetricCard';
import { MorphBooking } from './demos/MorphBooking';
import { ReceiptPrinter } from './demos/ReceiptPrinter';
import { TearButton } from './demos/TearButton';
import { UptimeCard } from './demos/UptimeCard';

type Demo = keyof typeof exemplos.demos;

/** Quadro de uma demo: etiqueta do serviço, título, uma linha de como mexer e a demo viva. */
function Tile({ demo, className, children }: { demo: Demo; className: string; children: ReactNode }) {
  const d = exemplos.demos[demo];
  return (
    <Glass tone="dark" glow className={`demo-tile ${className}`}>
      <div className="demo-tile__head">
        <span className="demo-tile__tag">{d.tag}</span>
        <h3>{d.titulo}</h3>
        <p>{d.texto}</p>
      </div>
      <div className="demo-tile__stage">{children}</div>
    </Glass>
  );
}

/** Miniatura de site (marcas fictícias), desenhada em CSS: barra do navegador, menu, chamada e "foto". */
function MiniSite({ tema, url, marca, titulo, sub, cta }: { tema: string; url: string; marca: string; titulo: string; sub: string; cta: string }) {
  return (
    <div className={`mini mini--${tema}`}>
      <div className="mini__bar" aria-hidden="true">
        <i />
        <i />
        <i />
        <span>{url}</span>
      </div>
      <div className="mini__nav" aria-hidden="true">
        <strong>{marca}</strong>
        <span>
          <b />
          <b />
          <b />
        </span>
      </div>
      <div className="mini__hero">
        <div className="mini__copy">
          <p className="mini__title">{titulo}</p>
          <p className="mini__sub">{sub}</p>
          <span className="mini__btn">{cta}</span>
        </div>
        <div className="mini__art" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
      </div>
    </div>
  );
}

const SITES = [
  { tema: 'clinica', url: 'vittaodonto.com.br', marca: 'Vitta Odonto', titulo: 'Seu sorriso em boas mãos', sub: 'Clínica odontológica com agenda online.', cta: 'Agendar consulta' },
  { tema: 'cantina', url: 'cantinanonna.com.br', marca: 'Cantina Nonna', titulo: 'Massa fresca todo dia', sub: 'Cardápio, reservas e delivery num lugar só.', cta: 'Ver cardápio' },
  { tema: 'studio', url: 'studioforma.arq.br', marca: 'Studio Forma', titulo: 'Projetos que respiram', sub: 'Arquitetura e interiores com portfólio vivo.', cta: 'Ver projetos' },
  { tema: 'pet', url: 'petfeliz.com.br', marca: 'Pet Feliz', titulo: 'Tudo para o seu pet', sub: 'Loja virtual com entrega no mesmo dia.', cta: 'Comprar agora' },
];

/** "Na prática": demos interativas de sistema, automação e site, numa grade de quadros de vidro. */
export function Examples() {
  return (
    <section className="section deep deep-exemplos" id="exemplos" aria-labelledby="exemplos-titulo">
      {/* faixa curva que dá para arrastar: abre a seção com o que fazemos */}
      <CurvedLoop text={exemplos.faixa.texto} separator={exemplos.faixa.separador} />
      <div className="wrap">
        <SecHead
          eyebrow={exemplos.eyebrow}
          id="exemplos-titulo"
          title={duasVozes(exemplos.tituloSans, exemplos.tituloSerif)}
          intro={
            <>
              {exemplos.intro} <span className="note">{exemplos.nota}</span>
            </>
          }
        />
        <LiftList as="ul" className="demos" role="list">
          <LiftItem i={0} className="demos__painel">
            <Tile demo="painel" className="demo-tile--painel">
              <MetricCard />
            </Tile>
          </LiftItem>
          <LiftItem i={1} className="demos__metas">
            <Tile demo="metas" className="demo-tile--metas">
              <ActivityRings />
            </Tile>
          </LiftItem>
          <LiftItem i={2} className="demos__fluxo">
            <Tile demo="fluxo" className="demo-tile--fluxo">
              <AutomationFlow />
            </Tile>
          </LiftItem>
          <LiftItem i={3} className="demos__comanda">
            <Tile demo="comanda" className="demo-tile--comanda">
              <ReceiptPrinter />
            </Tile>
          </LiftItem>
          <LiftItem i={4} className="demos__detalhes">
            <Tile demo="detalhes" className="demo-tile--detalhes">
              <div className="demo-micro">
                <BellButton />
                <TearButton />
              </div>
            </Tile>
          </LiftItem>
          <LiftItem i={5} className="demos__monitor">
            <Tile demo="monitor" className="demo-tile--monitor">
              <UptimeCard />
            </Tile>
          </LiftItem>
          <LiftItem i={6} className="demos__pasta">
            <Tile demo="pasta" className="demo-tile--pasta">
              <DocFolder />
            </Tile>
          </LiftItem>
          <LiftItem i={7} className="demos__agenda">
            <Tile demo="agenda" className="demo-tile--agenda">
              <MorphBooking />
            </Tile>
          </LiftItem>
          <LiftItem i={8} className="demos__conta">
            <Tile demo="conta" className="demo-tile--conta">
              <AccountMenu />
            </Tile>
          </LiftItem>
          <LiftItem i={9} className="demos__sites">
            <Tile demo="sites" className="demo-tile--sites">
              <CardSwap label="Exemplos de sites">
                {SITES.map((s) => (
                  <MiniSite key={s.tema} {...s} />
                ))}
              </CardSwap>
            </Tile>
          </LiftItem>
        </LiftList>
        <Reveal as="div" className="demos__cta">
          <Button href={whatsapp(MENSAGENS.geral)} size="lg" className="btn-hero" data-wa="geral" external specular specularRadius={16}>
            <Icon name="whatsapp" className="ic-wa" />
            {exemplos.cta}
            <span className="btn-hero__arrow" aria-hidden="true">
              <Icon name="arrow" className="ic-arrow" />
            </span>
          </Button>
        </Reveal>
      </div>
      <Wave className="curve-to-mist" d="M0 50C250 10 540 0 780 36s470 66 660 24v50H0z" />
    </section>
  );
}
