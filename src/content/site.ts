// Todo o conteúdo da landing: textos, serviços, depoimentos e links. Fonte: design/briefing.md.

// PLACEHOLDER: número PROVISÓRIO informado pelo cliente, (49) 99812-9876. Formato 55 + DDD + número.
export const WHATSAPP_NUMERO = '5549998129876';
export const EMAIL = 'contato@jksoftware.com.br';

export type TipoProjeto = 'geral' | 'sistemas' | 'sites' | 'automacao';

export const MENSAGENS: Record<TipoProjeto, string> = {
  geral: 'Olá! Vi o site da JK Software e quero conversar sobre um projeto.',
  sistemas: 'Olá! Vi o site da JK Software e quero um orçamento de sistema sob medida.',
  sites: 'Olá! Vi o site da JK Software e quero um orçamento de site ou landing page.',
  automacao: 'Olá! Vi o site da JK Software e quero um orçamento de automação/integração.',
};

export const NOMES_TIPO: Record<TipoProjeto, string> = {
  sistemas: 'Sistema sob medida',
  sites: 'Site ou landing page',
  automacao: 'Automação e integração',
  geral: 'Outro ou ainda não sei',
};

/** Link de WhatsApp com mensagem pronta (url-encode automático). */
export const whatsapp = (mensagem: string) => `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(mensagem)}`;

export const nav = [
  { href: '#servicos', label: 'Serviços' },
  { href: '#processo', label: 'Como funciona' },
  { href: '#diferenciais', label: 'Sobre' },
];

export const header = { cta: 'Pedir orçamento', ctaMobile: 'Pedir orçamento' };

/** Menu completo do desktop (StaggeredMenu): todas as seções, na ordem da página, e os contatos. */
export const menuCompleto = {
  itens: [
    { href: '#servicos', label: 'Serviços' },
    { href: '#exemplos', label: 'Na prática' },
    { href: '#processo', label: 'Como funciona' },
    { href: '#diferenciais', label: 'Sobre' },
    { href: '#depoimentos', label: 'Depoimentos' },
    { href: '#contato', label: 'Contato' },
  ],
  contatosTitulo: 'Fale com a gente',
  nota: 'Atendimento online em todo o Brasil',
};

/** Menu do celular (CardNav): um card por parte da página, com atalhos para as seções. */
export const menuCelular = [
  {
    label: 'Serviços',
    descricao: 'Sistemas, sites e automações sob medida.',
    links: [
      { href: '#servicos', label: 'O que construímos' },
      { href: '#exemplos', label: 'Exemplos ao vivo' },
    ],
  },
  {
    label: 'Como funciona',
    descricao: 'Do seu objetivo à solução, em três etapas.',
    links: [{ href: '#processo', label: 'Nosso processo' }],
  },
  {
    label: 'Sobre',
    descricao: 'Atendimento direto e suporte depois da entrega.',
    links: [
      { href: '#diferenciais', label: 'Diferenciais' },
      { href: '#depoimentos', label: 'Depoimentos' },
    ],
  },
];

export const hero = {
  eyebrow: 'Desenvolvimento de software e soluções digitais',
  tituloSans: 'Tecnologia sob medida.',
  tituloSerif: 'Feita para o seu negócio.',
  lede: 'Sistemas, sites e automações para empresas que querem mais eficiência, agilidade e resultado.',
  cta: 'Vamos conversar',
  card: 'Soluções digitais que se adaptam à sua realidade e impulsionam o seu crescimento.',
  /** Vitrine do topo: o que a pessoa está vendo em cada aba (aparece antes da cena, não depois). */
  vitrine: {
    rotulo: 'Veja funcionando',
    legendas: [
      'Um painel com os pedidos e o faturamento da sua empresa, atualizado sozinho.',
      'Um site rápido e bonito, que aparece bem no Google e leva o cliente direto ao WhatsApp.',
      'O sistema faz o trabalho repetido: do pedido no WhatsApp até o aviso ao cliente.',
    ],
  },
  fundo: { src: '/img/hero-montanhas-1672.webp', w: 1672, h: 941 },
};

export type Icone = 'layers' | 'monitor' | 'sync' | 'user' | 'shield';

export const servicos = {
  eyebrow: 'Serviços',
  tituloSans: 'O que podemos',
  tituloSerif: 'construir',
  intro: 'Desenvolvemos soluções digitais sob medida para o seu negócio, com foco em performance, segurança e escalabilidade.',
  itens: [
    {
      tipo: 'sistemas',
      icone: 'layers',
      tag: 'Gestão',
      titulo: 'Sistemas',
      destaque: 'sob medida',
      texto: 'Soluções personalizadas para os processos únicos do seu negócio.',
      exemplos: 'Pedidos, agenda de atendimentos, estoque e cadastro de clientes.',
      sr: ' de sistema pelo WhatsApp',
    },
    {
      tipo: 'sites',
      icone: 'monitor',
      tag: 'Presença digital',
      titulo: 'Sites e',
      destaque: 'landing pages',
      texto: 'Presença digital moderna, rápida e focada em resultados.',
      exemplos: 'Site institucional, página de campanha e catálogo de produtos ou serviços.',
      sr: ' de site pelo WhatsApp',
    },
    {
      tipo: 'automacao',
      icone: 'sync',
      tag: 'Produtividade',
      titulo: 'Automações e',
      destaque: 'integrações',
      texto: 'Conecte ferramentas, automatize processos e ganhe tempo.',
      exemplos: 'Planilhas que se atualizam, avisos automáticos e sistemas que conversam entre si.',
      sr: ' de automação pelo WhatsApp',
    },
  ] satisfies { tipo: TipoProjeto; icone: Icone; tag: string; titulo: string; destaque: string; texto: string; exemplos: string; sr: string }[],
};

/** "Na prática": demos interativas do que dá para construir (dados e marcas fictícios). */
export const exemplos = {
  eyebrow: 'Na prática',
  tituloSans: 'Não precisa imaginar:',
  tituloSerif: 'mexa à vontade',
  intro: 'Pedaços de sistemas, sites e automações como os que entregamos, funcionando aqui mesmo. Arraste, puxe, toque.',
  nota: 'Dados e marcas fictícios, só para demonstração.',
  verMais: 'Ver todos os exemplos',
  verMenos: 'Mostrar menos',
  demos: {
    painel: { tag: 'Sistema', titulo: 'Painel de vendas', texto: 'Passe o dedo no gráfico para ver cada dia contra o período anterior.' },
    metas: { tag: 'Sistema', titulo: 'Metas da equipe', texto: 'Cada anel conta até o resultado; o que passa da meta dá outra volta.' },
    fluxo: { tag: 'Automação', titulo: 'Pedido que se resolve sozinho', texto: 'Pagou: a nota sai, o estoque baixa e o cliente é avisado. Sem ninguém tocar.' },
    comanda: { tag: 'Sistema', titulo: 'Comanda direto no balcão', texto: 'O pedido sai impresso na hora. Puxe o papel para destacar.' },
    sites: { tag: 'Sites', titulo: 'Sites com a cara do seu negócio', texto: 'Arraste o da frente para o lado, ou toque num dos de trás.' },
    detalhes: { tag: 'Detalhes', titulo: 'Interações que dão vontade de clicar', texto: 'Um aviso de estoque com sino de verdade e um cupom que se destaca como papel.' },
    pasta: { tag: 'Sistema', titulo: 'Documentos num lugar só', texto: 'Abra a pasta e toque num documento para ler.' },
    agenda: { tag: 'Sistema', titulo: 'Agendamento em dois toques', texto: 'O botão vira o formulário e depois a confirmação.' },
    conta: { tag: 'Sistema', titulo: 'Área do cliente', texto: 'O cartão vira o menu: status, tema, trocar de conta e sair segurando o botão.' },
  },
  cta: 'Quero algo assim',
};

export const diferenciais = {
  eyebrow: 'Diferenciais',
  tituloSans: 'Tecnologia que',
  tituloSerif: 'acompanha você',
  intro: 'Mais do que entregar código, entregamos parceria. Você fala diretamente com quem desenvolve e conta com suporte mesmo após a entrega.',
  itens: [
    { icone: 'user', titulo: 'Atendimento direto', texto: 'Você fala com quem desenvolve, sem intermediários.' },
    { icone: 'shield', titulo: 'Suporte pós-entrega', texto: 'Estamos ao seu lado, mesmo depois do projeto estar no ar.' },
  ] satisfies { icone: Icone; titulo: string; texto: string }[],
};

export const processo = {
  eyebrow: 'Processo',
  intro: 'Um processo simples, transparente e colaborativo, para que você tenha clareza em cada etapa.',
  passos: [
    { n: '01', titulo: 'Entendemos seu objetivo', texto: 'Ouvimos sua ideia e alinhamos os próximos passos.' },
    { n: '02', titulo: 'Desenhamos a solução', texto: 'Planejamos a solução com foco em resultado.' },
    { n: '03', titulo: 'Desenvolvemos com você', texto: 'Construímos junto com você, do início à entrega.' },
  ],
};

export const depoimentos = {
  eyebrow: 'Depoimentos',
  tituloSans: 'Quem já',
  tituloSerif: 'construiu com a gente',
  intro: 'O que clientes contam sobre o atendimento e o resultado do trabalho.',
  nota: 'Exemplos ilustrativos nesta versão da página.',
  // PLACEHOLDER: depoimentos FICTÍCIOS (página de teste). Substituir por depoimentos reais autorizados antes de publicar.
  itens: [
    {
      texto: 'Eu controlava os pedidos no caderno e em planilha. Hoje está tudo num lugar só, e eu conversei direto com quem fez o sistema, do começo ao fim.',
      iniciais: 'MR',
      nome: 'M. R.',
      papel: 'Dona de confeitaria',
    },
    {
      texto: 'A página nova explica o que eu faço em poucos segundos, e os pedidos de orçamento chegam direto no meu WhatsApp.',
      iniciais: 'CA',
      nome: 'C. A.',
      papel: 'Eletricista autônomo',
    },
    {
      texto: 'Depois da entrega surgiram dúvidas e alguns ajustes. O suporte respondeu rápido e resolveu sem complicação.',
      iniciais: 'RT',
      nome: 'R. T.',
      papel: 'Dono de oficina mecânica',
    },
  ],
};

export const contato = {
  eyebrow: 'Contato',
  titulo: 'Vamos transformar sua ideia',
  tituloDestaque: 'em realidade?',
  texto: 'Fale com a gente e conte um pouco sobre o seu projeto. Será um prazer entender o seu desafio e te mostrar como podemos ajudar.',
  alt: 'Prefere e-mail?',
  campos: {
    nome: 'Seu nome',
    nomeErro: 'Diga como podemos te chamar.',
    tipo: 'Tipo de projeto',
    tipoErro: 'Escolha o tipo de projeto.',
    ideia: 'Conte um pouco sobre sua ideia...',
  },
  /** Formulário em etapas (Stepper): título curto no indicador e a pergunta de cada etapa. */
  etapas: {
    nome: { titulo: 'Você', pergunta: 'Para começar, como podemos te chamar?' },
    tipo: { titulo: 'Projeto', pergunta: 'O que você quer construir?' },
    ideia: { titulo: 'Ideia', pergunta: 'Conte um pouco da ideia (se quiser).', dica: 'Opcional: pode ser uma frase só, a gente conversa no WhatsApp.' },
    enviar: { titulo: 'Enviar', pergunta: 'Tudo certo? Confira e envie.' },
  },
  revisar: { nome: 'Nome', tipo: 'Projeto', ideia: 'Ideia', semIdeia: 'Sem detalhes por enquanto', editar: 'Editar' },
  enviar: 'Solicitar orçamento pelo WhatsApp',
  enviarCurto: 'Enviar pelo WhatsApp',
  enviado: 'Pronto! Abrimos o WhatsApp com a sua mensagem. Se não abriu, ',
  enviadoLink: 'toque aqui para abrir',
  lgpd: 'Seus dados servem só para responder ao seu contato. O envio abre uma conversa no WhatsApp com a mensagem pronta.',
};

export const rodape = {
  local: 'Atendimento online em todo o Brasil',
  copy: '© 2026 JK Software',
};

export const flutuante = { aria: 'Conversar com a JK Software no WhatsApp' };
