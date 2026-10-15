# JK Software: opções de direção visual

> Etapa 1 (direção visual). Nenhum código foi escrito. Escolha uma opção (ou peça ajustes) para seguir à construção.
> Fontes: `briefing.md` (aprovado em 13/10/2026), `referencias/` (Haneul, Bilexer, PulseTrade, moodboard JK) e `assets/`.

## Base comum às 3 opções

### O que as referências dizem (só linguagem visual)

| Referência | Peso | Traços aproveitáveis |
|---|---|---|
| **Haneul** | maior | formulário em vidro centralizado sobre paisagem de montanhas na névoa; campos em pílula; cards de foto com cantos bem arredondados; rodapé limpo em 3 colunas com marca no centro e muito ar |
| **Bilexer** | maior | serifa itálica de alto contraste misturada com sans na mesma frase ("*How do we* achieve this"); cards translúcidos sobre névoa; divisórias curvas (arco) entre seções; numeração grande e apagada (01, 02, 03) dentro dos cards; fotos de dunas desfocadas como fundo; botões em pílula com seta |
| **Moodboard JK** | paleta e clima | petróleo profundo, névoa turquesa, dunas com granulado visível, luz fria vinda do alto à direita, wordmark em serifa itálica fina; rótulos em caixa alta muito espaçada ("PALETA DE CORES") com filetes verticais finos |
| **PulseTrade** | menor | grade modular com cards de mesmo tamanho; títulos de seção precedidos de um filete-seta (`——>`); uma célula de cor sólida no meio de células claras como destaque |

**Traços recorrentes** (Haneul + Bilexer + moodboard): paisagem enevoada como fundo, superfícies translúcidas sobre ela, cantos generosos, tipografia fina e editorial, pouca informação por tela, luz fria. Esses traços entram em todas as opções; o que muda é a dose.

**Traços isolados que ficam de fora em todas:** fundos brancos/cinza-claro de Haneul e PulseTrade (o cliente não quer branco chapado), gráficos e tabelas de cotação do PulseTrade (sem números), "pontinhos" de padrão decorativo do Bilexer (sem função), ícones de redes sociais do Haneul (não há redes).

### Paleta (do briefing/moodboard) e contraste medido

| Cor | Papel | Contraste verificado |
|---|---|---|
| `#1B3F45` petróleo | superfície principal, texto sobre botões claros | gelo sobre petróleo **10,44:1**; verde-água sobre petróleo **6,39:1** |
| `#122B30` petróleo profundo (derivado do #1B3F45, só escurecido) | fundo de base, rodapé | gelo **13,62:1**; verde-água **8,33:1**; turquesa **4,13:1** |
| `#5F8F93` turquesa acinzentado | filetes, bordas, numeração apagada, ícones, texto **grande** apenas | sobre petróleo **3,17:1**: **nunca em texto normal**, só em elementos não textuais (≥3:1) e números decorativos |
| `#A7C9C2` verde-água | acento: botão principal, aba ativa, foco, rótulos | petróleo sobre verde-água **6,39:1** (texto do botão) |
| `#F2F6F3` gelo | texto principal, títulos | (ver acima). Nunca como fundo de seção inteira |

A sugestão automática da `ui-ux-pro-max` (preto + dourado sobre fundo claro, estilo "Liquid Glass") foi **descartada** por contradizer o briefing e as referências. Dela aproveitei: padrão de narrativa por capítulos com CTA ao fim de cada um, glassmorphism com contraste 4,5:1 verificado, motion de entrada escalonado e respeito a `prefers-reduced-motion`.

### Imagens disponíveis e limites

| Imagem | Natural | Regra |
|---|---|---|
| Paisagem (dunas + névoa + fita de luz no canto superior direito) | 1672x941 | Em 1440x900, `cover` usa ~1599x900: **abaixo do natural**. Acima de 1672px de largura, o palco da foto fica limitado a 1672px e as bordas se dissolvem num gradiente para o petróleo (ou usa-se a versão desfocada) |
| Recorte A: faixa inferior de dunas do moodboard (y ≈ 1015-1295) | ~1214x280 | panorâmica baixa; ideal para faixa/moldura larga ou card cortado em altura 280 |
| Recorte B: quadro interno de dunas do moodboard (x ≈ 622-1162, y ≈ 767-971) | ~540x205 | pequeno: só em card até 540px de largura |
| Monograma JK (com halo serrilhado) | 1484x1060 | **só pequeno** (28-48px no cabeçalho, até 56px no rodapé, sempre ≤ 80px) + "JK Software" em texto |
| Faixa superior do moodboard (com "Softtware") | - | **nunca usar** |

Coordenadas dos recortes são aproximadas e serão conferidas pixel a pixel no recorte (Etapa 2), exportando em WebP.

### Conteúdo fixo (todas as opções)

- **Serviços:** Sistemas sob medida e Sites e landing pages com **mesmo peso**; Automação e integrações em **destaque menor**. Cada serviço tem CTA próprio para o WhatsApp com a mensagem do briefing.
- **Diferenciais confirmados:** atendimento direto com quem desenvolve; suporte pós-entrega. **Sugestões (A VALIDAR):** prazo e escopo combinados antes de começar; código e acessos entregues ao cliente.
- **Depoimentos fictícios:** 3, com iniciais ("M. S., dono de oficina"), sem foto, sem estrelas/nota, sem empresa real, sem cidade, sem schema de Review, cada um com `<!-- FICTÍCIO: substituir por depoimento real autorizado antes de publicar -->`.
- **Formulário:** nome + tipo de projeto (Sistema sob medida / Site ou landing page / Automação e integração / Outro) + mensagem; monta o texto e abre `wa.me/5549998129876?text=...`; aviso LGPD curto abaixo do botão. Número centralizado numa única constante no JS e num único `data-` no HTML.
- **WhatsApp:** botão principal do hero com ícone; botão flutuante (56px, canto inferior direito, mensagem geral) que se recolhe quando o formulário ou o rodapé estão na tela, para não cobrir CTAs. Todos os outros botões de WhatsApp são **só texto** (sem ícone). Sem `tel:` (não há telefone). E-mail `contato@jksoftware.com.br` em `mailto:`.
- **Sem números de destaque** (decisão do dono). Numeração 01-04 de etapas é índice, não estatística.
- **Granulado** em todas: camada SVG `feTurbulence` a 4-6% de opacidade sobre superfícies CSS. **Função:** fazer as superfícies chapadas e os gradientes terem a mesma textura das fotos (que têm grão visível) e eliminar o "banding" dos gradientes escuros.
- **Movimento:** entradas suaves (opacidade + 12-16px), indicador de abas deslizando, hover com elevação; tudo desligado em `prefers-reduced-motion`.

---

## Opção 1: Névoa em Camadas (fiel às referências) - RECOMENDADA

**Ideia central.** A página é uma descida pela paisagem: começa no céu enevoado do hero, atravessa "camadas" de névoa separadas por curvas de duna e termina no formulário de vidro pousado sobre as montanhas, como em Haneul. Bilexer dá a voz tipográfica (itálico + sans na mesma frase) e os cards translúcidos com numeração apagada.

### Hero (1440x900, ocupa a tela inteira)

- Fundo: paisagem em `cover` (≈1599x900, abaixo do natural), com **scrim em gradiente** petróleo a partir da esquerda e de baixo (`#122B30` 80% → 0%) para garantir AA no texto; a fita de luz do canto superior direito fica limpa, como ponto de luz da composição.
- Cabeçalho (72px): monograma 32px + "JK Software" em serifa itálica; links âncora (Serviços, Como trabalhamos, Depoimentos, Contato); botão "Fale conosco" em pílula verde-água. Vira vidro ao rolar (há cor atrás).
- Texto alinhado à esquerda, terço inferior: rótulo em caixa alta espaçada (estilo moodboard) "Estúdio de software · atendimento remoto em todo o Brasil"; **h1** misturando sans e itálico, ex.: "Sistemas e sites *feitos sob medida* para o seu negócio" (texto novo); subtítulo de 1-2 linhas; CTA principal **com ícone de WhatsApp** + CTA secundário "Ver serviços" (texto, seta).
- Canto inferior direito: **3 chips de vidro** (Sistemas · Sites · Automação) que levam à aba correspondente. Vidro aqui tem cor atrás (dunas).
- Borda inferior do hero em **curva de duna** (SVG) entrando na próxima seção.

### Sequência de seções e encaixe em 1440x900

| # | Seção | Composição | Altura estimada |
|---|---|---|---|
| 1 | Hero | acima | 900 |
| 2 | **Serviços** | título "O que *fazemos*" + intro curta à esquerda; abaixo, **2 abas de largura igual** (grid 1fr 1fr) com **indicador em pílula verde-água que desliza** entre "Sistemas sob medida" e "Sites e landing pages". Painel: texto + lista do que inclui (em **CSS columns**, 2 colunas) + CTA de texto "Pedir orçamento de sistema/site" à esquerda; à direita, card de foto arredondado (Sistemas: **recorte B** a 540x205 com legenda em degradê; Sites: **recorte A** em janela de ~560x280, `object-fit: cover` sem ampliar). Abaixo das abas, **faixa menor** "Também fazemos · Automação e integrações" com 1 linha de descrição e CTA de texto | ~96 título + 56 abas + 360 painel + 110 faixa + respiro = **~820** |
| 3 | **Como trabalhamos** (diferenciais) | fundo = versão **desfocada e escurecida** da paisagem (ou gradientes radiais turquesa) para dar cor ao vidro. 4 **cards de vidro** em grid de larguras iguais, cada um com **número grande e apagado** (01-04) em turquesa, título e 2 linhas: 01 Conversa direta com quem desenvolve; 02 Escopo e prazo combinados antes (SUGESTÃO); 03 Entrega com código e acessos seus (SUGESTÃO); 04 Suporte depois da entrega. Título com filete-seta (PulseTrade) | ~110 título + 300 cards + respiro = **~620** |
| 4 | **Depoimentos** | fundo petróleo sólido com granulado; título "*O que dizem* nossos clientes" + aviso discreto "exemplos ilustrativos" (só na página de teste); 3 cards translúcidos lado a lado, citação em serifa itálica, iniciais num círculo com filete verde-água, ocupação genérica | **~560** |
| 5 | **Contato** | paisagem reaproveitada pela metade inferior (dunas e névoa), desfocada 6px e escurecida; **formulário de vidro centralizado** (Haneul), ~520px de largura, campos em pílula, rótulos visíveis, botão "Continuar no WhatsApp" (sem ícone). À esquerda do form, em telas ≥1200px, coluna curta com e-mail e link direto "Prefere chamar direto? Abrir WhatsApp" (sem ícone). Topo da seção em curva | **~860** |
| 6 | **Rodapé** | limpo, estilo Haneul: monograma 40px + "JK Software" (≤ 80px de altura), links âncora, e-mail, "Atendimento remoto em todo o Brasil", aviso de privacidade, ©. Fundo `#122B30` | ~260 |

**Mobile (375):** hero em 100svh com texto em baixo e chips em linha rolável só se couberem (senão viram 3 links em grid de larguras iguais); abas continuam 2 colunas iguais com rótulos curtos ("Sistemas" / "Sites"); cards de etapas empilham; form ocupa a largura com 16px de margem; botão flutuante some sobre o form.

### Tipografia

- **Instrument Serif** (400 e *400 itálico*), Google Fonts: títulos e palavras de ênfase. Fina, de alto contraste, próxima do wordmark do moodboard.
- **Manrope** (400, 500, 600), Google Fonts: texto, rótulos, botões. Sans limpa, levemente arredondada, sem cara de "tech".
- Escala: h1 `clamp(2.5rem, 1.6rem + 3.2vw, 4rem)` (40 → **64px máx.**); h2 `clamp(2rem, 1.5rem + 2vw, 3rem)`; corpo 17px/1.6; rótulos 12-13px caixa alta, tracking 0.18em, verde-água.
- 2 famílias, `preconnect` + `display=swap`.

### Vidro, gradientes, sombras, granulado (com função)

| Recurso | Onde | Função |
|---|---|---|
| Vidro | chips do hero, cabeçalho ao rolar, 4 cards de etapas, 3 depoimentos, formulário (máx. 4-5 por tela) | separar conteúdo da paisagem sem escondê-la; só onde há foto ou gradiente colorido atrás. Fallback `@supports not (backdrop-filter)`: petróleo 88% opaco, AA mantido |
| Gradiente (scrim) | hero e contato | garantir AA do texto sobre a foto |
| Gradiente (névoa) | transições entre seções e bordas da foto em telas > 1672px | substituir cortes secos e não ampliar a foto |
| Gradientes radiais turquesa | atrás dos cards de etapas e depoimentos | dar "algo colorido atrás" ao vidro quando não há foto |
| Sombras | cards e form: sombra longa e difusa tingida de petróleo (nunca preta) | profundidade das camadas; crescem no hover |
| Granulado | camada global | igualar a textura das superfícies CSS à das fotos |

### Prós e principal risco

- Prós: segue Haneul e Bilexer de perto, usa cada imagem no tamanho certo, abas dão peso igual a sistemas e sites de forma clara.
- **Principal risco:** a paisagem aparece 3 vezes (hero nítido, etapas desfocada, contato desfocada pela metade inferior). Se o tratamento não variar o suficiente, a página parece repetitiva. Mitigação: enquadramentos diferentes (céu/fita no hero, névoa no meio, dunas no contato) e intensidades de desfoque distintas.

### Pedidos do briefing que esta opção não atende ou adapta

- **Monograma grande:** não usado em tamanho grande (halo serrilhado); só pequeno + nome em texto.
- **Faixa superior do moodboard:** não usada (tem "Softtware").
- **Paisagem "no topo":** atendido, mas acima de 1672px de largura a foto fica limitada e as bordas viram névoa em gradiente.
- **Cards de foto arredondados (Haneul):** adaptado: há só 2 recortes pequenos, usados nos painéis das abas; não há galeria.
- **Numeração grande (Bilexer):** usada como índice de etapas, não como estatística (sem números de destaque, como o dono pediu).
- **Grade modular (PulseTrade):** aplicada de leve (cards de etapas em grade igual e filete-seta nos títulos), sem a célula sólida de destaque.
- **Depoimentos fictícios:** atendidos com aviso discreto "exemplos ilustrativos" (proposto, remover antes de publicar).

---

## Opção 2: Editorial de Dunas (variação sóbria, menos vidro)

**Ideia central.** Uma revista de arquitetura em tom petróleo: tipografia itálica grande e silenciosa, filetes finos, muito respiro, e as imagens tratadas como pranchas emolduradas com legenda. A névoa vem de gradientes e granulado, não de vidro. Mais legível e mais "premium silencioso"; menos imersivo.

### Hero (1440x900)

- Fundo petróleo com granulado e um gradiente de névoa vindo do canto superior direito.
- Grid 12 colunas: **esquerda (7 col.)** rótulo espaçado, h1 grande em itálico com uma palavra em sans ("Sistemas e sites, *sob medida*"), subtítulo, CTA principal com ícone + "Ver serviços". **Direita (5 col.)** a paisagem como **prancha vertical arredondada** (~560x780, `cover` sobre o natural 1672x941: escala 0,83, sem ampliar), com legenda em vidro pequena no rodapé da prancha ("Atendimento remoto em todo o Brasil").
- Sem curvas no hero; borda inferior reta com filete turquesa.

### Sequência de seções e encaixe em 1440x900

| # | Seção | Composição | Altura |
|---|---|---|---|
| 1 | Hero | acima | 900 |
| 2 | **Serviços** | **duas pranchas lado a lado, mesma largura** (Sistemas / Sites), cada uma com imagem no topo (recorte B 540x205; recorte A recortado em 540x205 da faixa), título itálico, texto, lista em CSS columns e CTA de texto. Abaixo, linha fina horizontal "Automação e integrações" com descrição e CTA | **~800** |
| 3 | **Como trabalhamos** | 4 colunas separadas por **filetes verticais** (moodboard), numeral itálico enorme e apagado (120px, turquesa) sobre cada etapa; sem cards | **~520** |
| 4 | **Depoimentos** | uma citação grande em itálico por vez + **seletor com 3 abas (iniciais)** e indicador deslizante; sem rotação automática | **~560** |
| 5 | **Contato** | 2 colunas: esquerda com título, texto, e-mail e link direto de WhatsApp; direita, **formulário em card sólido** petróleo-claro com filete verde-água. Acima, divisória curva única (a única do site) | **~720** |
| 6 | **Rodapé** | **recorte A** como faixa emoldurada de ponta a ponta do container (≤1214px, cantos arredondados), marca ≤ 80px, links, e-mail | ~520 |

**Mobile:** prancha da paisagem vira imagem horizontal sob o h1; pranchas de serviço empilham (Sistemas primeiro, Sites logo em seguida, mesmo tamanho); seletor de depoimentos vira 3 botões de largura igual.

### Tipografia

- **Cormorant Garamond** (500 e *500/600 itálico*): títulos ≥ 28px (fina demais abaixo disso).
- **Hanken Grotesk** (400, 500, 600): texto e interface.
- h1 `clamp(2.5rem, 1.5rem + 3.4vw, 4rem)` (máx. 64px); numerais de etapa decorativos até 120px (`aria-hidden`).

### Vidro, gradientes, sombras, granulado

| Recurso | Onde | Função |
|---|---|---|
| Vidro | só a legenda sobre a prancha do hero e o cabeçalho ao rolar (≤ 2 por tela) | legenda legível sobre a foto |
| Gradientes | névoa no hero e atrás do formulário | dar atmosfera sem foto de fundo |
| Sombras | só nas pranchas de foto | destacar a "prancha" do papel |
| Filetes | divisões de etapas, bordas de cards, títulos | estrutura editorial no lugar de profundidade |
| Granulado | global | mesma textura das fotos |

### Principal risco

Fica **plana e menos etérea** do que o dono pediu: o formulário sobre paisagem (Haneul) e os cards translúcidos sobre névoa (Bilexer), que são as duas referências de peso maior, aparecem de forma reduzida.

### Pedidos do briefing que esta opção não atende ou adapta

- **Formulário em vidro sobre paisagem (Haneul):** **adaptado** para card sólido ao lado do texto.
- **Cards translúcidos sobre névoa (Bilexer):** **reduzidos** a filetes e colunas; o vidro aparece só em 2 lugares.
- **Divisórias curvas (Bilexer):** só **uma**, antes do contato.
- **Paisagem como fundo do hero:** **adaptada** para prancha emoldurada à direita (não é fundo de tela cheia).
- **Monograma grande e faixa superior do moodboard:** não usados (como na opção 1).
- **Grade modular (PulseTrade):** aplicada no grid de 12 colunas e nos filetes, sem cards modulares.

---

## Opção 3: Paisagem Contínua (imersiva)

**Ideia central.** Uma única paisagem atravessa a página inteira como um céu fixo; o conteúdo flutua em painéis de vidro e a luz muda de seção para seção (mais escura no meio, clareando como uma manhã perto do contato). É a mais cinematográfica e a mais próxima do "etéreo" do moodboard.

### Hero (1440x900)

- Camada de fundo fixa (pseudo-elemento `position: sticky`, não `background-attachment: fixed`, que falha no iOS) com a paisagem; no hero ela aparece nítida, em `cover` (≈1599x900).
- Composição **centralizada**: h1 dividido nas laterais à moda Bilexer ("Sistemas" à esquerda, "*sob medida*" à direita, linha de baixo "e sites que trabalham por você", texto novo), subtítulo central curto e CTA principal com ícone + "Ver serviços". Scrim radial central para AA.
- Base do hero: os 3 chips de serviço em vidro alinhados ao centro.

### Sequência de seções e encaixe em 1440x900

| # | Seção | Composição | Altura |
|---|---|---|---|
| 1 | Hero | acima | 900 |
| 2 | **Serviços** | **bento modular** (PulseTrade): 2 blocos grandes de vidro de mesmo tamanho (Sistemas, Sites), cada um com **abas internas** "O que inclui / Como entregamos" com indicador deslizante; 1 bloco estreito para Automação; 1 bloco com o **recorte B** emoldurado e legenda | **~820** |
| 3 | **Como trabalhamos** | trilho horizontal de 4 cards de vidro com numeração apagada, rolagem por **botões anterior/próximo** (teclado e toque), sem arrastar obrigatório; em 1440 os 4 cabem sem rolar | **~560** |
| 4 | **Depoimentos** | 3 cards de vidro em **CSS columns**, alturas naturais | **~600** |
| 5 | **Contato** | formulário de vidro centralizado; na base da seção, o **recorte A** como horizonte de dunas (≤1214px, bordas laterais fundidas em gradiente), emendando no rodapé | **~880** |
| 6 | **Rodapé** | translúcido sobre o fim da paisagem, marca ≤ 80px | ~240 |

**Mobile:** o fundo fixo vira fundo de seção estático (desempenho); bento empilha em uma coluna (Sistemas, Sites, Automação, imagem); trilho de etapas vira lista vertical.

### Tipografia

- **Newsreader** (variável, com eixo óptico; *itálico 400-500*): títulos com o corte "Display" em tamanhos grandes.
- **Geist** (400, 500, 600): interface e texto.
- h1 `clamp(2.5rem, 1.6rem + 3.2vw, 4rem)` (máx. 64px).

### Vidro, gradientes, sombras, granulado

| Recurso | Onde | Função |
|---|---|---|
| Vidro | quase todos os blocos (limite de 5 por tela) | a paisagem contínua só faz sentido se for vista através do conteúdo |
| Gradientes de luz por seção | sobre o fundo fixo | narrar a "passagem do dia" e manter AA em cada trecho |
| Sombras | blocos do bento | separar planos de vidro sobrepostos |
| Granulado | global, mais forte (6%) | esconder o desfoque da foto ampliada no fundo fixo |

### Principal risco

**Desempenho e contraste variável.** Muitos `backdrop-filter` sobre um fundo fixo pesam em celulares médios, e o texto passa por áreas claras da névoa (canto inferior direito da foto), exigindo scrims fortes. Em telas > 1672px o fundo fixo precisa de versão **desfocada** para não exibir a foto ampliada nítida.

### Pedidos do briefing que esta opção não atende ou adapta

- **Paisagem não ampliar acima de 1672px:** em telas largas o fundo fixo usa **versão desfocada** (permitida para fundos grandes), não a foto nítida.
- **Cards de foto arredondados (Haneul):** só um card com recorte B; o recorte A vira horizonte, não card.
- **Divisórias curvas (Bilexer):** **adaptadas**: como o fundo é contínuo, as seções não têm bordas; as "curvas" viram contornos curvos no topo dos painéis.
- **Monograma grande e faixa superior do moodboard:** não usados.
- **Abas com peso igual:** atendido via 2 blocos iguais (com abas internas), o que torna as abas menos protagonistas que na opção 1.

---

## Recomendação

**Opção 1: Névoa em Camadas.** É a que segue com mais fidelidade as duas referências de peso maior: o formulário de vidro sobre a paisagem vem de Haneul; o itálico misturado à sans, os cards translúcidos com numeração apagada e as curvas entre seções vêm de Bilexer. Usa cada imagem dentro do tamanho natural (paisagem no hero e reaproveitada desfocada, recortes nos painéis das abas). As abas com indicador deslizante resolvem com clareza o "mesmo peso" entre sistemas e sites, e a automação fica numa faixa menor logo abaixo. O vidro fica em um número controlado de blocos e sempre tem cor atrás, então o desempenho e o contraste são mais fáceis de garantir que na opção 3. A opção 2 é a mais legível, mas abre mão justamente do que o dono mais destacou nas referências.
