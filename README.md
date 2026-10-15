# JK Software — landing page

Landing da JK Software (sistemas sob medida, sites e automações), pré-renderizada no build.

## Stack

| Peça | Uso |
|---|---|
| Vite 8 + React 19 + TypeScript 7 | Componentes e build |
| CSS próprio (`src/styles/landing.css`) | Todo o visual, sem Tailwind |
| Motion 14 (`motion/react`) | Animações abaixo da dobra ou ligadas à rolagem, sempre `m.*` dentro de `LazyMotion` (`strict`) e `MotionConfig reducedMotion="user"` |
| Lenis 1.3 (`lenis/react`) | Rolagem suave; desligado com movimento reduzido. Âncoras com `offset: 0`: o `scroll-padding-top` do CSS já desconta o cabeçalho |
| Pré-renderização própria | `src/entry-server.tsx` + `scripts/prerender.mjs` injetam o HTML em `dist/index.html`; `src/entry-client.tsx` hidrata |

Versões fixas em `package.json`. Não troque nem acrescente biblioteca de base sem registrar a decisão aqui.

## Subir com Docker (sem instalar Node)

Precisa só do [Docker](https://www.docker.com/products/docker-desktop/) aberto.

```bash
git clone https://github.com/JoaoVictorArbegaus/jksoftware.git
cd jksoftware
docker compose up -d --build
```

Abre em http://localhost:8080. A primeira vez demora uns minutos (instala as dependências e faz o build dentro do contêiner); depois é rápido.

- Outra porta, se a 8080 estiver ocupada: `PORTA=3000 docker compose up -d --build` (no PowerShell: `$env:PORTA=3000; docker compose up -d --build`).
- Atualizar depois de um `git pull`: `docker compose up -d --build`.
- Parar: `docker compose down`.

O contêiner é um nginx servindo o `dist/` pré-renderizado (veja `Dockerfile` e `nginx.conf`).

## Como rodar (desenvolvimento)

```bash
npm install
npm run dev      # desenvolvimento em http://localhost:5173
npm run build    # typecheck, build e pré-renderização em dist/
npm run preview  # serve dist/ em http://localhost:4173
```

`dist/` é o que vai para a hospedagem (HTML estático com o texto de todas as seções, CSS, JS e `img/`).

## Onde fica cada coisa

| Caminho | Conteúdo |
|---|---|
| `index.html` | Só o `<head>`: SEO, Open Graph, JSON-LD, fontes, preload da foto do topo e o marcador `<!--app-html-->` |
| `src/content/site.ts` | Todos os textos, serviços, depoimentos, mensagens e o número do WhatsApp (`WHATSAPP_NUMERO`, provisório); `whatsapp(mensagem)` faz o url-encode |
| `src/App.tsx` | Composição das seções, `LazyMotion`, `MotionConfig` e Lenis |
| `src/components/Button.tsx`, `Glass.tsx`, `Icons.tsx`, `Wave.tsx` | Botão (`mint`/`outline`, `lg`), vidro (`as`, `tone`: `dark`/`deep`/`light`, `tilt`), sprite de ícones (e filtro de refração) e divisória em onda |
| `src/components/Header.tsx`, `Hero.tsx`, `Sections.tsx`, `Contact.tsx` | Seções; `Contact.tsx` tem o formulário que abre o WhatsApp, o rodapé e o botão flutuante |
| `src/components/Motion.tsx` | Primitivas de animação: `rise`, `lift`, `Reveal`, `SplitHeading`, `LiftList`/`LiftItem`, `Magnetic` |
| `src/components/Rail.tsx` | Lista que vira carrossel abaixo de 960px, com indicadores |
| `src/components/Topo.tsx`, `TypeWriter.tsx`, `DynamicText.tsx` | Adaptados de kokonutui: fundo topográfico das seções, rótulo digitado e texto que se transforma no topo |
| `src/components/HeroShowcase.tsx` | Vitrine do topo: janela de vidro grande com abas Sistemas, Sites e Automações que trocam sozinhas (duas voltas e para), cada uma com uma cena viva; o nome do serviço troca com o `DynamicText` (agora também controlável por `index`) |
| `src/components/Stepper.tsx` | Etapas do formulário de contato (React Bits Stepper, MIT): Você, Projeto, Ideia e Enviar, com indicador deslizante, revisão e envio pelo WhatsApp |
| `src/components/StaggeredMenu.tsx` | Menu completo do desktop (React Bits StaggeredMenu, MIT, sem gsap): botão "Menu" na pílula, painel em camadas com todas as seções e os contatos |
| `src/components/Examples.tsx`, `src/components/demos/` | Seção "Na prática" (entre Serviços e Processo): demos interativas com dados e marcas fictícios. Do kokonutui (MIT): `MetricCard` (painel de vendas), `ActivityRings` (metas), `AutomationFlow` (adaptado do Currency Transfer), `ReceiptPrinter` (comanda), `BellButton` e `TearButton` (sino e cupom), `UptimeCard` (status dos sistemas) e, reescritos numa versão enxuta, `MorphBooking` (Morph Popover: agendamento) e `AccountMenu` (Profile Dropdown: área do cliente). Do React Bits (MIT): `CurvedLoop` (faixa curva) `CardSwap` (pilha de miniaturas de site) e `DocFolder` (inspirado no Folder, em CSS 3D: pasta de documentos). `RollingNumber` é o número de odômetro compartilhado |
| `src/components/LiquidGlass.tsx`, `GlassIcon.tsx`, `BorderGlow.tsx`, `SpecularLight.tsx`, `GooeyNav.tsx`, `CardNav.tsx`, `GlideSelect.tsx`, `PatternWaves.tsx`, `LineWaves.tsx` | Adaptados de React Bits: vidro líquido (cabeçalho, card do topo e formulário), ícones de vidro, borda luminosa dos cards, reflexo dos botões, menu líquido do desktop, menu em cards do celular e tablet (abaixo de 960px), lista de vidro do tipo de projeto e fundos de ondas (Serviços, Diferenciais e Depoimentos) |
| `src/hooks/useLandingEffects.ts` | Entradas do topo e do formulário (`.reveal`), refração no Chromium e vidro que segue o cursor |
| `src/hooks/useWaves.ts` | Animação das ondas (maré contínua + reação à rolagem) |
| `src/styles/landing.css` | CSS portado da versão em HTML puro, com a seção "v2" (Motion, vidro líquido, carrossel) no fim |
| `public/img/` | Imagens otimizadas (`/img/...`) |
| `design/` | `briefing.md`, `opcoes-direcao.md`, `direcao-visual.md` (contrato visual), `referencias/`, `mockups/` e `originais/` |
| `_legado-html/` | Versão em HTML/CSS/JS puros de 14/10/2026 (equivalente à migração, antes da v2 com Motion): backup para comparar ou restaurar. Não é publicada |

## Componentes de terceiros

Adaptados sob licença MIT, sem dependência nova (cada arquivo traz o crédito e o que mudou):

- [React Bits](https://reactbits.dev): GlassSurface, GlassIcons, BorderGlow, SpecularButton, GooeyNav, CardNav, GlideSelect, CurvedLoop, CardSwap, PatternWaves e LineWaves (os dois últimos usavam a biblioteca `ogl`; foram reescritos em WebGL direto).
- [kokonutui](https://kokonutui.com), por @dorianbaffier: Topo Background, Typewriter, Dynamic Text, Metric Card, Apple Activity Card, Currency Transfer (virou o fluxo de pedido), Receipt Printer, Bell Button e Tear Button (reescritos sem Tailwind nem lucide).

O código foi obtido com `npx shadcn@latest view <componente>` (sem `add`, para não instalar Tailwind nem alterar o projeto) e reescrito em TypeScript com CSS próprio na seção "v3" do `landing.css`.

## Antes de publicar

- Trocar o número provisório do WhatsApp em `src/content/site.ts`.
- Os depoimentos são **fictícios** (marcados com `PLACEHOLDER`): substituir por depoimentos reais autorizados.
- Domínio usado no `<head>`: `https://jksoftware.com.br/`. As imagens de Open Graph e JSON-LD apontam para `/img/...`.
