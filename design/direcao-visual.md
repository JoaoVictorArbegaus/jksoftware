# JK Software: direção visual (contrato)

> Documento único e vigente. Substitui `opcoes-direcao.md` e os rascunhos em `mockups/` (descartados pelo dono em 14/10/2026). Última revisão: 14/10/2026, quinta rodada (vidro petróleo translúcido).

## Direção escolhida

**Modelo aprovado pelo dono** (`referencias/9c884049-69f3-4550-b9c2-b98521b691c0.png`, briefing seção 15), reproduzido em estrutura, cores e textos.

Ajustes do dono aplicados:

- **Conteúdo e conversão:**
  - 3 cards de serviço com o mesmo tamanho, mais destacados: título maior, exemplos concretos, botão "Pedir orçamento";
  - depoimentos fictícios entre Processo e Contato;
  - "Sobre" leva a Diferenciais;
  - aviso LGPD;
  - formulário abre o WhatsApp; mensagem pronta por serviço; botão flutuante;
  - e-mail contato@jksoftware.com.br.
- **Tela larga:** fundos sem emenda nas laterais.
- **Tipografia:** sans encorpada (Manrope) e destaque em serifa itálica encorpada (Fraunces) que combina com ela.
- **Vidro:** em todos os cards e botões, incluindo o cabeçalho e o menu do celular, mais transparente.
- **Fitas de luz:** uma diferente em cada card.
- **Ondas entre seções:** maré contínua, reação à velocidade da rolagem e linha de luz na crista.

## Paleta

Amostrada do modelo (família do moodboard), sem puxar para azul.

| Token | Hex | Papel |
|---|---|---|
| `--abismo` | #0A2B35 | fundo do contato e rodapé; texto dos botões verde-água |
| `--profundo` | #0E3743 | fundo dos diferenciais e do hero |
| `--petroleo` | #1B3F45 | cor da marca |
| `--turquesa` | #5F8F93 | só detalhes, nunca texto normal |
| `--agua` | #A7C9C2 | bordas e brilho dos vidros escuros |
| `--menta` | #9DE8DE | acento: botões de vidro, itálicos, halo da linha de luz |
| `--gelo` / `--gelo-2` | #F2F6F3 / #CFE0DD | texto no escuro; núcleo da linha de luz (#E8FFFB) |
| `--nevoa` / `--nevoa-2` | #D3E6E5 / #B7D4D7 | seções de névoa clara |
| `--tinta` / `--tinta-2` | #0E3341 / #24505B | texto no claro |
| numeral do processo | #1E5260 | "01-03" |

**Contraste medido no navegador** (1440x900). Método: texto escondido e pior pixel de fundo real sob cada bloco (vidro translúcido, foto atravessando, fita).

| Texto | Contraste |
|---|---|
| Card do hero (gelo) | 6,54:1 |
| Serviços, título 28-30px (gelo / itálico menta; mínimo 3:1) | 4,48 / 3,79:1 |
| Serviços, descrição 18px / exemplos 16px | 4,77 / 5,08:1 |
| Serviços, etiqueta / botão "Pedir orçamento" | 7,08 / 6,77:1 |
| Diferenciais, título / texto (gelo) | 7,42 / 7,78:1 |
| Processo, título (tinta) / texto (tinta-2) | 8,40 / 5,60:1 |
| Processo, "01-03" (40px, texto grande, mínimo 3:1) | 3,81:1 |
| Depoimentos: texto / autor / iniciais | 4,92 / 6,17 / 9,64:1 |
| Rótulos do formulário / aviso LGPD | 8,35 / 9,79:1 |
| "Vamos conversar" / botão do formulário (abismo sobre vidro verde-água) | 7,82 / 7,75:1 |
| "Pedir orçamento" do cabeçalho / links do cabeçalho sobre seção clara / escura | 4,75 / 6,37 / 9,83:1 |

## Tipografia

- **Manrope** 400/500/600/700: títulos (600), texto e interface.
- **Fraunces** (variável): itálico 600 com `"SOFT" 100, "WONK" 0, "opsz" 72` nos destaques dos títulos; romana na marca "JK Software"; itálico 400 nos depoimentos.
- **Por que a Fraunces:** a Newsreader anterior era fina, mais baixa e de outra família de forma; destoava da Manrope 600.
  - Comparei Fraunces, Lora, Playfair Display e DM Serif Display, sempre itálico, sempre com a Manrope em cima.
  - A Fraunces 600 SOFT tem altura-x, peso e terminais arredondados mais próximos da Manrope.
  - A Lora 600 ficou em segundo.
  - Playfair e DM Serif Display têm contraste de traço alto demais ao lado da Manrope.
  - A sans continua a Manrope: trocar não melhorou a harmonia.
  - Sans no itálico foi descartada pelo dono.
- **Título do contato:** "Vamos transformar sua ideia" passou para a Manrope, com "em realidade?" em Fraunces itálica, igual aos outros títulos. O modelo tinha esse título inteiro em serifa; mudei para manter a página coerente.
- **Duas famílias** de fonte web; Newsreader e Geist saíram.
- **Trocar:** variáveis `--sans`, `--serif`, `--w-title`, `--w-serif` e `--serif-fvs` em `src/styles/landing.css`, mais o `<link>` do Google Fonts no `index.html`.
- **Escala:**

| Elemento | Tamanho e peso |
|---|---|
| h1 | `clamp(2.375rem, 1.35rem + 3.4vw, 4rem)` (38 a **64px**) |
| h2 | 34 a 52px |
| h3 | 19 a 22px, peso 700 |
| corpo | 16-17px |

## Estilo e superfícies

**Vidro em tudo, no tom escuro e translúcido.** O dono quer o tom petróleo, não um vidro branco. As montanhas, a névoa e as linhas aparecem através dos cards, escurecidas mas com forma legível. Para isso:
- tint petróleo baixo;
- desfoque baixo (6px);
- `brightness` uniforme no backdrop;
- `text-shadow` sutil;
- nenhum véu denso.

A variação "vidro claro" foi testada nesta rodada e descartada pelo dono.

| Elemento | Tratamento |
|---|---|
| Cards petróleo sobre névoa clara (serviços, depoimentos) | tom escuro translúcido: cor petróleo de 18-26%, sem véu, desfoque baixo (6px). O AA vem de `brightness` no backdrop, que escurece o fundo por igual e deixa a imagem visível: .56 nos serviços e .5 nos depoimentos (o texto deles ocupa o card todo) |
| Cards escuros (hero, diferenciais, formulário) | petróleo de 20-22%, desfoque de 6px, `brightness(.8)`, sem véu |
| Campos do formulário | petróleo translúcido a 34% com borda verde-água |
| Todos os cards | filete claro de borda (mais claro no topo), brilho interno e `text-shadow` sutil |
| Cards claros (processo) | branco a 12-30%; fundo a `brightness(1.14)` |
| Cabeçalho | barra de vidro sempre (mais densa quando fixa sobre o conteúdo). O vidro fica num `::before` para o painel do menu ter o próprio vidro |
| Menu do celular | vidro com desfoque de 26px e véu de 62-70% |
| "Vamos conversar", botão do formulário, flutuante, "Pedir orçamento" do menu | vidro verde-água tingido |
| "Pedir orçamento" do cabeçalho, botão do menu | vidro claro |
| Sem `backdrop-filter` | fundos sólidos com AA |

**Entrada sem "pulo":** os cards de vidro entram só com movimento (`transform`, sem fade). No Chrome, opacidade abaixo de 1 no card ou num ancestral desliga o `backdrop-filter`, e o card escurecia no fim da entrada. Medido com as transições congeladas em 100 ms e em 1,5 s: opacidade 1 nos dois instantes e o mesmo brilho de vidro (diferença de 2 a 4 níveis em 255, por causa dos 26px de deslocamento).

**Cards de serviço:**
- ícone maior em vidro (60px) e etiqueta discreta (Gestão / Presença digital / Produtividade);
- título de 28-30px em Manrope 700, com a segunda linha em Fraunces itálica verde-água;
- descrição de 18px;
- linha "Exemplos:" com 3 a 4 casos concretos;
- botão de vidro "Pedir orçamento →", sem ícone de WhatsApp;
- 435px de altura (a seção tem 872px em 1440x900);
- hover: o card sobe, a borda acende em verde-água, a fita interna se desloca e acende, e o botão vira vidro verde-água.

**Fitas de luz nos cards:** 6 SVGs diferentes, um por card, variando forma, posição, ângulo, número de filetes (1 a 3) e intensidade.

| Card | Variação |
|---|---|
| Serviços | arco subindo; onda em S; arco no canto inferior direito |
| Diferenciais | onda em S; arco descendo com 3 filetes |
| Processo | as mesmas formas em turquesa (branco some no claro): canto superior direito; arco descendo; dois arcos |
| Depoimentos | dois arcos; arco subindo; onda em S |
| Card do hero | canto superior direito |

As fitas ficam só na faixa de cima do card (até ~25% da altura) ou no canto inferior direito dos cards em que essa área é vazia.

**Ondas entre seções** (pedido explícito do dono):
- **Maré contínua:** a onda ondula sozinha com a página parada.
- **Reação à rolagem:** a "energia" sobe com a velocidade (até +55% de amplitude e bem mais velocidade) e volta suave ao repouso em cerca de 0,8 s.
- **Camadas:** frente e trás em paralaxe; o SVG passou para até 140px de altura.
- **Linha de luz na crista:** traço fino gelo + halo verde-água desfocado (filtro SVG), que acende um pouco com a rolagem. **Registro:** é o efeito "neon" pedido pelo dono, mesmo com o "evitar visual tech/neon" do briefing. Ficou na paleta da marca, como luz etérea parecida com o arco de luz da foto do hero; sem roxo, magenta ou cara de cyberpunk.
- **Técnica:** só o atributo `d` muda (sem layout); as pontas cobrem sempre a largura toda (sem fenda). O laço de animação só roda com onda visível e aba ativa.
- **`prefers-reduced-motion`:** ondas estáticas.

**Outros recursos:**

| Recurso | Função |
|---|---|
| Gradiente (scrim) no hero | AA do texto sobre a foto |
| Sombras deslocadas e tingidas de petróleo | profundidade |
| Granulado SVG global (5%) | textura igual à das fotos |

## Movimento e interação (v2, 15/10/2026)

Pedido do dono: usar elementos React para melhorar animações, responsividade e efeito de vidro. Paleta, tipos e tom do vidro não mudaram.

| Onde | O que anima | Como |
|---|---|---|
| Topo | Cada linha do h1 sobe de dentro de uma máscara; rótulo, texto e card entram como antes | CSS (`.line-in`, `.reveal`), sem esperar o JS (LCP) |
| Topo, ao rolar | A foto desce mais devagar que a página (até 160px) e o texto sobe até 70px | Motion `useScroll`, só `transform` (o botão e o card são vidro) |
| "Vamos conversar" | Botão magnético: segue o cursor e volta com mola | `Magnetic` (Motion), só mouse |
| Títulos das seções | Sobem palavra por palavra de dentro de uma máscara, mantendo as duas vozes | `SplitHeading` |
| Rótulos e textos de apoio | Sobem e saem do desfoque (o filtro é removido no fim) | `Reveal` |
| Cards de vidro | Sobem com mola, em sequência, quando a lista aparece; **só transform, sem fade** (regra do vidro acima) | `LiftList` + `LiftItem` |
| Processo | Linha de luz que se desenha com a rolagem, com um marcador por passo (horizontal no desktop, vertical abaixo de 960px) | Motion `useScroll` + `useSpring` em `--p` |
| Ondas | Sem mudança | `useWaves` |

**Vidro líquido:**
- reflexo e borda luminosa que seguem o cursor (`.glass-shine`);
- inclinação de até 5° na direção do cursor e subida no hover, só com mouse; em repouso não há `perspective` (texto nítido);
- refração do fundo só no Chromium (`#vidro-refracao`, deslocamento 28), com o mesmo desfoque e `brightness` do contrato, então o contraste medido continua valendo.

**Responsividade:**
- abaixo de 960px, serviços e depoimentos viram carrossel com deslizamento (`Rail`), card a 86% da largura (máximo 420px) e indicadores que acompanham o card central;
- de 640 a 959px, os passos do processo ficam em linha (número, texto e seta lado a lado).

**Movimento reduzido:** sem Lenis, sem inclinação, sem paralaxe; títulos, textos e cards aparecem na posição final.

### Componentes adaptados (v3, 15/10/2026)

Pedido do dono: usar componentes do React Bits e da kokonutui. Entraram adaptados (MIT, sem dependência nova, sem Tailwind), no tom e nas cores do contrato.

| Componente | Onde | Adaptação |
|---|---|---|
| Topo Background (kokonutui) | Fundo de Processo e Contato | Curvas de nível em canvas sobre a foto da seção (turquesa escuro na névoa, menta no escuro), morro que segue o cursor e onda no clique; sem cotas; parado com movimento reduzido |
| GlassSurface (React Bits) | Cabeçalho (faixa de baixo da barra), card do topo e formulário | Refração com aberração cromática só nas bordas, somada ao desfoque e ao brightness do contrato; só Chromium |
| GlassIcons (React Bits) | Ícones dos serviços e dos diferenciais | Placa em degradê da marca inclinada atrás de vidro fosco; versão DOM, sem WebGL |
| BorderGlow (React Bits) | Todos os cards de vidro | Trecho da borda acende em degradê da marca na direção do cursor; sem fundo próprio; só com mouse |
| SpecularButton (React Bits) | "Vamos conversar", "Pedir orçamento" do cabeçalho e botão do formulário | Reflexo WebGL que corre pela borda e segue o cursor; só com mouse e sem movimento reduzido |
| GooeyNav (React Bits) | Links do cabeçalho no desktop | Pílula menta líquida que acompanha a seção ativa; some no topo; o celular mantém o menu de vidro |
| Typewriter (kokonutui) | Rótulo do topo | Digita uma vez; HTML pré-renderizado já traz o texto |
| Dynamic Text (kokonutui) | Card do topo | Alterna os três nomes de serviço com as letras viajando; para após duas voltas; leitor de tela recebe a lista uma vez |

| PatternWaves (React Bits) | Fundo de Serviços (pontos) e Depoimentos (linhas) | Superfície ondulada em pontos/linhas petróleo; rastro de ondulação do cursor e onda no clique; WebGL direto (sem `ogl`) |
| LineWaves (React Bits) | Fundo de Diferenciais | Feixes de linhas menta que se curvam perto do cursor; WebGL direto (sem `ogl`) |

Os fundos de ondas ficam apagados atrás do cabeçalho de cada seção (título e texto de apoio) e só aparecem atrás dos cards, onde o vidro os refrata.

**Ajustes de 15/10/2026 (v5), a pedido do dono:**

- **"Vamos conversar":** sem o efeito magnético; 64px de altura, texto 17px em 700; cantos de 16px (menos redondo) e vidro verde-água translúcido (degradê menta de 26% a 8% sobre petróleo a 32%, desfoque de 14px), borda menta, brilho suave em volta e seta num quadrado menta de cantos 10px; largura total no celular. Texto gelo medido no pior pixel do fundo: 5,12:1 (1440) e 5,24:1 (390).
- **Botão do formulário:** mesmo estilo do "Vamos conversar" (vidro verde-água translúcido, cantos de 16px, seta no quadrado menta). Texto gelo no pior pixel do fundo: 13,66:1.
- **Pílula do menu (GooeyNav):** menta a 24% de opacidade (antes menta chapada, que destoava), sombra leve e texto ativo gelo no mesmo peso dos outros links.
- **Cabeçalho:** pílula de vidro flutuante na largura do conteúdo (não mais a tela toda), 12-14px abaixo do topo; vidro líquido (GlassSurface) em toda a borda da pílula.
- **Logo:** o monograma JK em fitas (`public/img/monograma-jk-520/900.webp`, de `design/originais/`) fica grande no topo, à direita, com flutuação lenta e paralaxe; o card de vidro do topo se sobrepõe à parte de baixo e refrata a fita.
- **Processo e Depoimentos deixaram de ser iguais:** Processo virou linha do tempo em zigue-zague (passos alternando de lado em volta da linha central que se desenha com a rolagem; número grande em Fraunces itálica ao lado do texto); Depoimentos virou um depoimento em destaque (texto 24-31px) com dois menores empilhados ao lado. No celular, Processo é uma lista com a linha à esquerda e Depoimentos segue em carrossel.

**Textos:** nenhum texto novo; o card do topo reaproveita os nomes dos serviços.

## Tratamento das imagens

| Imagem | Uso | Tamanho |
|---|---|---|
| `public/img/hero-montanhas-1672.webp` (60 KB) | fundo do hero e, esmaecida, das seções | até 1599x920, abaixo do natural de 1672x941 |
| `nevoa-dunas-1672.webp` | fundo do processo | fundo |
| `logo-jk-120.webp` + `logo-jk-240.png` (2x) | cabeçalho (46px), rodapé (72x52px, ≤ 80px) | ícone + "JK Software" em Fraunces romana |
| `og-jksoftware.jpg` | Open Graph | 1200x630 |

Acima de 1672px de largura, a foto nítida fica centralizada com fade nas laterais, sobre uma cópia desfocada que leva as cores até a borda. Não há emenda (verificado em 1920 e 2560).

## Estrutura de seções

| # | Seção | Altura em 1440x900 |
|---|---|---|
| 1 | Cabeçalho de vidro | - |
| 2 | Hero | 900 |
| 3 | Serviços: 3 cards iguais, 397x435 | 872 |
| 4 | Diferenciais | 582 |
| 5 | Processo | 626 |
| 6 | Depoimentos fictícios: comentário FICTÍCIO no HTML, sem estrela, nota, foto nem schema; aviso "Exemplos ilustrativos" | 673 |
| 7 | Contato com rodapé | 752 |

O número do WhatsApp fica numa única constante (`WHATSAPP_NUMERO`) em `src/content/site.ts`. Desde 14/10/2026 a página é um projeto Vite + React + TypeScript (ver `README.md`); a versão em HTML puro equivalente está em `_legado-html/`.

## Referências

- **Aproveitado:** o modelo do dono (estrutura, cores, textos, curvas, cards de vidro com onda de luz, rótulos com filete, numeração 01-03) e o arco de luz da foto do hero, que inspira a linha luminosa das ondas.
- **Deixado de fora:** recortes do moodboard (não foram necessários) e referências de terceiros (não estão mais na pasta).

## Fontes do conteúdo

- **Do modelo:** títulos e textos das seções, formulário, rodapé.
- **Do briefing:** mensagens do WhatsApp, e-mail, domínio, área atendida, regras dos depoimentos.
- **Novos (para aprovação):**
  - etiquetas dos serviços: Gestão / Presença digital / Produtividade;
  - linhas "Exemplos:" dos serviços;
  - botão "Pedir orçamento" dos cards;
  - seção de depoimentos;
  - aviso LGPD;
  - "Prefere e-mail?";
  - mensagens do formulário;
  - opções de "Tipo de projeto";
  - title, meta description e Open Graph;
  - textos de acessibilidade.

## Acabamento

- **Rodada 1:**
  - Critique 23/32 (72%, Bom), com as heurísticas 7 e 10 marcadas n/a. Rodou em contexto único, porque criar sub-agentes não estava autorizado.
  - Layout, polish e adapt: confirmação do formulário, link ativo no menu, superfícies do navegador na paleta, logo 2x, hero limitado a 920px, botão flutuante que some sobre o formulário e o rodapé.
- **Rodada 2:** fundos sem emenda, cards iguais, fitas de luz, ondas animadas, Manrope, botões de vidro, vidros mais transparentes.
- **Rodada 3:**
  - Fraunces itálica nos destaques.
  - Uma fita diferente por card.
  - Ondas com maré contínua, reação à velocidade da rolagem e linha de luz.
  - Cabeçalho e menu de vidro.
  - Transparência maior com véu localizado.
  - Problemas encontrados na verificação e corrigidos:
    - um "pill" escuro atrás dos links no desktop, vindo do vidro do menu do celular;
    - fitas brancas invisíveis no processo (passaram para turquesa);
    - numeral "02" a 2,97:1 sob a fita turquesa (escurecido para 3,82:1).
- **Rodada 4:**
  - Vidros sem o escurecimento de `brightness(.5)` e `.72`, com o AA vindo de véu localizado e texto maior.
  - Entrada dos cards só com movimento.
  - Cards de serviço mais destacados.
  - Problemas encontrados na verificação e corrigidos:
    - card do hero a 4,07:1 (véu reforçado para 5,84:1);
    - etiqueta a 3,27:1 (fundo da etiqueta mais denso, 6,29:1);
    - texto dos depoimentos a 3,70:1: o véu específico estava sendo sobrescrito pelo seletor genérico; corrigido para 6,21:1.
- **Rodada 5 (descartada pelo dono):**
  - Testei vidro claro: tint gelo, reflexo branco, depoimentos e serviços em vidro claro com texto escuro.
  - O dono preferiu manter o tom escuro.
- **Rodada 6:**
  - Vidro petróleo translúcido em todos os cards: sem véus, desfoque de 6px, `brightness` uniforme.
  - Depoimentos e campos do formulário voltaram ao tom escuro.
  - Montanhas atrás dos diferenciais e do contato como antes.
  - O botão "Pedir orçamento" dos cards ganhou um tint escuro próprio (estava a 4,45:1).
  - Os depoimentos usam `brightness(.5)` (estavam a 4,33:1).
- **Detector do impeccable:** só sobram a serifa itálica nos títulos e o rótulo acima do h1, que são do modelo, e um falso positivo de espaçamento.

- **Rodada 7 (v2, React):** animações com Motion, vidro líquido e carrossel no celular e tablet (ver "Movimento e interação"). Verificado em 1440, 768 e 390px: console vazio, sem rolagem lateral, carrossel alinhado, hover e linha do processo funcionando, movimento reduzido com tudo visível. Problema encontrado e corrigido: os cards fora da tela no carrossel ficavam deslocados até serem deslizados (a entrada passou a ser disparada pela lista).

**Ressalvas da `design-taste-frontend`:** a casa dela proíbe rótulos acima do título, numeração 01-03, vidro, gradientes, brilho e itálico de ênfase. Tudo isso vem do modelo aprovado ou de pedido explícito do dono e foi mantido.

- **Rodada 8 (v6, 15/10/2026):** o tipo de projeto no formulário virou o GlideSelect (React Bits), uma lista de vidro petróleo no lugar do select nativo, que o Windows desenhava cru, em azul. Tem o ícone de cada serviço, o destaque menta deslizando entre as opções, o check na escolhida, linhas de 48px e teclado completo (setas, Home/End, letra inicial, Esc). Abaixo de 960px o cabeçalho virou o CardNav (React Bits): a pílula cresce com uma mola e mostra um card por parte da página (Serviços, Como funciona, Sobre), com o botão "Pedir orçamento" no vidro verde-água do "Vamos conversar". Os cards ficam empilhados até 639px e em três colunas no tablet. O desktop continua com a pílula e o GooeyNav. Corrigida a seta do botão do formulário no celular: uma regra antiga de ≤520px escondia a seta de todo `.btn-block`.

- **Rodada 9 (v7, 15/10/2026): seção "Na prática".** Entre Serviços e Processo, em petróleo escuro com onda dos dois lados (a página alterna claro e escuro). Abre com uma faixa curva arrastável (CurvedLoop) com o que fazemos; depois, quadros de vidro escuro, cada um com etiqueta do serviço, título em Fraunces e uma linha de como mexer. Sistema: painel de vendas (período 7/30/90 dias, total rolando dígito a dígito, leitura de cada dia contra o período anterior), metas em anéis (o que passa da meta dá outra volta) e comanda impressa que se rasga puxando. Automação: pedido pago que dispara nota, estoque e aviso, etapa por etapa, com "Rodar de novo". Detalhes: sino de "avise quando chegar" com física de pêndulo e cupom com canhoto que se destaca. Sites: pilha de quatro miniaturas de site (marcas fictícias, desenhadas em CSS) que troca sozinha e se joga para o lado. Fecha com o botão "Quero algo assim" (WhatsApp). Grade: 12 colunas no desktop (7/5, 4/4/4, sites na largura toda), 2 no tablet, 1 no celular; no celular a faixa curva fica 2,4 vezes mais larga que a tela para o texto ficar legível. Tudo respeita movimento reduzido e funciona com teclado. Verificado em 1440, 768 e 390px com mouse e toque: console vazio, sem rolagem lateral.

- **Rodada 10 (v8 a v11, 15/10/2026).**
  - **Topo:** o card pequeno virou uma vitrine de vidro grande (580px no desktop, largura toda no celular) com barra de navegador, "ao vivo", abas Sistemas, Sites e Automações com barra de progresso (trocam sozinhas por duas voltas e param; o mouse em cima pausa; clicar assume) e uma cena viva por aba: painel com pedidos chegando e números rolando, site se montando com notas de desempenho, automação com etapas acendendo e registro de eventos. O nome do serviço, grande em Fraunces itálico, troca com as letras viajando (DynamicText controlado pela aba). Palco de altura fixa: as abas não fazem a janela pular.
  - **Formulário em etapas (Stepper):** Você, Projeto, Ideia (opcional) e Enviar, com indicador deslizante, check desenhado nas etapas feitas, transição com mola, Enter avança, só avança com a etapa válida e a última mostra a revisão com "Editar" e o botão de enviar. No celular só a etapa atual mostra o nome.
  - **Menu completo no desktop (StaggeredMenu):** botão "Menu" na pílula ao lado de "Pedir orçamento"; o painel entra pela direita em camadas (menta, água, petróleo), os itens sobem um a um com numeração e a seção atual fica em itálico. O celular continua com o CardNav.
  - **Mais demos em "Na prática":** status dos sistemas com 90 dias por serviço (as barras incham em volta do cursor; clicar num dia abre o registro do incidente), pasta de documentos em CSS 3D (abre, os documentos sobem em leque, um toque traz o documento para ler), agendamento que cresce do botão até o formulário e encolhe na confirmação (horários ocupados riscados) e área do cliente (o cartão vira o menu, status e tema com indicador deslizante, trocar de conta desliza de página, sair segurando).
  - Verificado em 1440, 1024 e 390px com mouse, toque e teclado: console vazio, sem rolagem lateral.

- **Rodada 11 (15/10/2026):** saíram a faixa curva arrastável (CurvedLoop) do começo de "Na prática" e o quadro "Status dos sistemas" (UptimeCard): não combinaram com a estética do site (decisão do dono). Pasta, agendamento e área do cliente ficaram em três colunas iguais no desktop.

- **Rodada 12 (16/10/2026).**
  - **Sem itálico:** a Fraunces itálica dos destaques não combinou. Testadas Manrope 800, Sora 700, Bricolage Grotesque 700, Fraunces 700 reta e Space Grotesk 700 no próprio topo e em Serviços; ficou a **Bricolage Grotesque** (700 nos destaques em menta e nos títulos dos cards, 800 nos números do processo e no título da vitrine): reta, compacta e com personalidade, contrasta com a Manrope do resto do título. Sora e Space Grotesk ficaram parecidas demais com a Manrope; a Fraunces reta manteve o ar clássico da serifa. A Fraunces fica só na marca "JK Software" e na miniatura da cantina. Texto corrido (inclusive depoimentos menores) continua na Manrope.
  - **Títulos acima do texto:** títulos dos cards (Diferenciais, Processo, demos, menu do celular, perguntas do formulário) na Bricolage, 1,5 a 2,1rem; texto de apoio menor e mais apagado. O título já explica; o texto só complementa.
  - **Vitrine do topo explicada antes:** "Veja funcionando" + nome do serviço grande + uma linha do que se vê em cada aba, e só depois a cena (antes a explicação vinha embaixo, depois do exemplo).
  - **"Na prática" recolhida:** mostra só o painel de vendas (celular) ou painel + metas (desktop) e o botão "Ver todos os exemplos"; aberta, os outros quadros entram subindo e "Mostrar menos" volta ao começo da seção. No celular a seção caiu de ~5.000px para ~1.000px de rolagem.

- **Rodada 13 (16/10/2026).**
  - **Títulos em Inter Tight, destaque pelo peso:** a Bricolage também não agradou. Pela referência do dono ("AI Workforce. / Built for Freight Teams."), testadas Inter Tight, Geist, Instrument Sans e Hanken Grotesk; ficou a **Inter Tight**: primeira parte 600, destaque 400 no mesmo tom um pouco mais suave (gelo a 76% no escuro, tinta a 72% no claro). O verde-água saiu das palavras de destaque (o dono não gostou do tom); continua em ícones, rótulos, botões e detalhes. Números do processo em 300. A Fraunces fica só na marca.
  - **Menu do desktop (GooeyNav):** corrigido o bug de pedaços da pílula presos em outros itens. Acontecia quando a pílula era apagada (seção fora do menu) no meio da viagem das gotas: a massa reservada nunca era devolvida. Agora a reserva é zerada ao apagar, e sem gotas no ar só o item ativo pode ter pílula.

- **Rodada 14 (16/10/2026, polish com o impeccable).**
  - **Título invertido:** primeira parte leve (Inter Tight 400, gelo/tinta) e a segunda em **negrito azul**: `--azul` #8CCBF0 no fundo escuro e `--azul-fundo` #17618A na névoa clara (o cinza não agradou; o azul é outro tom, não o verde-água). Vale para todos os h1/h2 e para os destaques dos cards de serviço.
  - **Processo:** números (01, 02, 03) e a seta centralizados na altura do card.
  - **Diferenciais:** texto colado ao ícone e ocupando a largura do card (antes ficava no meio com sobra à direita).
  - **Topo:** a partir de 1200px cada frase do título fica numa linha ("Tecnologia sob medida." / "Feita para o seu negócio."), coluna do texto mais larga (vitrine em 540px) e texto de apoio em até 44ch; abaixo disso quebra normal.
  - **Movimento:** as curvas com "quique" (overshoot) dos demos e menus viraram desaceleração exponencial, como pede o impeccable (detector limpo).
- **Rodada 15 (16/10/2026):** destaque em negrito de volta ao verde-água (o primeiro tom; petróleo #1E5260 na névoa clara). Títulos de seção maiores (até 4rem) e títulos dos diferenciais até 2,25rem. Diferenciais: ícone e texto juntos, o conjunto centralizado no card (escolha do dono). Cabeçalho de seção dá mais largura ao título (texto de apoio em até 420px; entre 960 e 1199px o texto vai para baixo do título).

- **Teste de tema azul (branch `azul`, 16/10/2026):** identidade inteira passada do petróleo/menta para um azul escuro levemente arroxeado. Toda cor da família verde-água/ciano (CSS, componentes, ondas e WebGL) foi girada para o índigo mantendo luminosidade e saturação, então o contraste de cada par continua o mesmo: base `--abismo` #080D37, `--profundo` #0C1245, acento `--menta` #9DB0E8 (pervinca), névoa #D3D7E6, tinta #0C1043. Fotos, monograma e logo giram o matiz por filtro (`--tema-foto: hue-rotate(44deg) saturate(1.08)`) no próprio elemento da imagem. Cores quentes (areia, erro) e as miniaturas de site (marcas fictícias) ficaram. A versão petróleo continua na `main`.
  - **2ª versão (menos roxo, aprovada para teste):** matiz ~10° mais para o azul. Base `--abismo` #081537, `--profundo` #0C1B45, acento `--menta` #9DBCE8 (azul-céu), névoa #D3DAE6, tinta #0C1A43; fotos com `hue-rotate(33deg) saturate(1.06)`.
  - **3ª versão:** azuis escuros ~20% mais claros (base `--abismo` #0A1943, `--profundo` #0E2154, tinta #0F1F52), fotos com `brightness(1.1)` a mais, e as cópias desfocadas das laterais (telas > 1672px) agora recebem o filtro de cor junto com o desfoque (antes ficavam verde-água). Contrastes: gelo-2/profundo 10,5:1, menta/abismo 8,8:1, tinta/névoa 11,2:1, tinta-2/névoa-2 5,8:1.
