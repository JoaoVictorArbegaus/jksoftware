/* JK Software - interações da landing page (JS puro, sem dependências) */
(function () {
  'use strict';

  /* ===== WhatsApp: número e mensagens num único lugar =====
     Número PROVISÓRIO informado pelo cliente: (49) 99812-9876.
     Para trocar, altere só WHATSAPP_NUMERO (formato 55 + DDD + número). */
  var WHATSAPP_NUMERO = '5549998129876';
  var MENSAGENS = {
    geral: 'Olá! Vi o site da JK Software e quero conversar sobre um projeto.',
    sistemas: 'Olá! Vi o site da JK Software e quero um orçamento de sistema sob medida.',
    sites: 'Olá! Vi o site da JK Software e quero um orçamento de site ou landing page.',
    automacao: 'Olá! Vi o site da JK Software e quero um orçamento de automação/integração.'
  };
  var NOMES_TIPO = {
    sistemas: 'Sistema sob medida',
    sites: 'Site ou landing page',
    automacao: 'Automação e integração',
    geral: 'Outro ou ainda não sei'
  };

  function linkWhatsApp(texto) {
    return 'https://wa.me/' + WHATSAPP_NUMERO + '?text=' + encodeURIComponent(texto);
  }

  document.documentElement.classList.add('js');

  // Todos os links com data-wa recebem o link pronto (sem JS, levam ao formulário/e-mail).
  document.querySelectorAll('[data-wa]').forEach(function (el) {
    var chave = el.getAttribute('data-wa');
    el.setAttribute('href', linkWhatsApp(MENSAGENS[chave] || MENSAGENS.geral));
  });

  /* ===== Cabeçalho: ganha fundo de vidro ao rolar ===== */
  var header = document.querySelector('[data-header]');
  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 24);
  }
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });

  /* ===== Menu no celular ===== */
  var toggle = document.querySelector('[data-menu-toggle]');
  var menu = document.querySelector('[data-menu]');
  function setMenu(aberto) {
    if (!toggle || !menu) return;
    toggle.setAttribute('aria-expanded', String(aberto));
    toggle.querySelector('.sr-only').textContent = aberto ? 'Fechar menu' : 'Abrir menu';
    menu.classList.toggle('is-open', aberto);
    header.classList.toggle('menu-open', aberto);
    if (aberto) header.classList.add('is-scrolled'); else onScroll();
  }
  if (toggle && menu) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
  }

  /* ===== Entrada dos blocos ao aparecer na tela ===== */
  var reveals = document.querySelectorAll('.reveal');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Atraso escalonado dentro de cada seção
  document.querySelectorAll('section').forEach(function (sec) {
    sec.querySelectorAll('.reveal').forEach(function (el, i) {
      el.style.setProperty('--d', Math.min(i * 80, 480) + 'ms');
    });
  });
  if (reduz || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var io = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ===== Botão flutuante: some quando o formulário está na tela ===== */
  var flutuante = document.querySelector('[data-wa-float]');
  var contato = document.getElementById('form-contato');
  var rodape = document.querySelector('.site-footer');
  if (flutuante && contato && 'IntersectionObserver' in window) {
    var visiveis = new Set();
    var obs = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        if (en.isIntersecting) visiveis.add(en.target); else visiveis.delete(en.target);
      });
      flutuante.classList.toggle('is-hidden', visiveis.size > 0);
    }, { threshold: 0.15 });
    obs.observe(contato);
    if (rodape) obs.observe(rodape);
  }

  /* ===== Menu: marca a seção atual ===== */
  var linksMenu = document.querySelectorAll('.nav a[href^="#"]:not(.nav-cta-mobile)');
  if ('IntersectionObserver' in window && linksMenu.length) {
    var porId = {};
    linksMenu.forEach(function (a) { porId[a.getAttribute('href').slice(1)] = a; });
    var obsMenu = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (en) {
        var a = porId[en.target.id];
        if (!a) return;
        if (en.isIntersecting) {
          linksMenu.forEach(function (l) { l.classList.remove('is-active'); l.removeAttribute('aria-current'); });
          a.classList.add('is-active');
          a.setAttribute('aria-current', 'true');
        } else if (a.classList.contains('is-active')) {
          a.classList.remove('is-active');
          a.removeAttribute('aria-current');
        }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    Object.keys(porId).forEach(function (id) {
      var s = document.getElementById(id);
      if (s) obsMenu.observe(s);
    });
  }

  /* ===== Divisórias em onda: maré contínua + reação à rolagem =====
     Parada, a onda ondula sozinha devagar (maré). Ao rolar, a "energia" sobe conforme a velocidade da rolagem:
     amplitude e velocidade aumentam e voltam suavemente ao ritmo de repouso quando a rolagem para.
     Duas camadas de preenchimento (frente e trás, em paralaxe) + linha de luz na crista.
     Só o atributo d muda (sem layout); as pontas sempre cobrem 0..1440, então não abre fenda nas bordas.
     O laço de animação só roda com alguma onda visível e a aba ativa. Com prefers-reduced-motion: estáticas. */
  var ondas = Array.prototype.slice.call(document.querySelectorAll('[data-wave]'));
  var PARAMS = [
    { base: 60, a1: 24, f1: 0.72, p1: 2.6, a2: 7, f2: 1.7, p2: 0.4, v: 1.0 },   // hero > serviços
    { base: 54, a1: 22, f1: 0.95, p1: 0.2, a2: 7, f2: 2.1, p2: 1.1, v: 1.15 },  // serviços > diferenciais
    { base: 54, a1: 23, f1: 1.05, p1: -0.7, a2: 6, f2: 1.9, p2: 2.0, v: 0.9 },  // diferenciais > processo
    { base: 56, a1: 22, f1: 0.85, p1: 1.3, a2: 7, f2: 2.2, p2: 0.6, v: 1.05 }   // depoimentos > contato
  ];
  var W = 1440, H = 110, PASSOS = 16, TAU = Math.PI * 2;
  var REPOUSO = 0.5;      // rad/s da maré parada
  var EXTRA = 2.6;        // rad/s a mais com rolagem rápida
  var AMP_EXTRA = 0.55;   // até +55% de amplitude com rolagem rápida
  function limita(y) { return Math.max(5, Math.min(105, y)); }
  function pontos(fn) {
    var pts = [];
    for (var i = 0; i <= PASSOS; i++) { var x = (W * i) / PASSOS; pts.push([x, limita(fn(x / W))]); }
    return pts;
  }
  function curva(pts) {
    var d = '';
    for (var k = 0; k < pts.length - 1; k++) {
      var p0 = pts[k - 1] || pts[k], p1 = pts[k], p2 = pts[k + 1], p3 = pts[k + 2] || p2;
      d += 'C' + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + ' ' + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + ' ' +
           (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + ' ' + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + ' ' +
           p2[0].toFixed(1) + ' ' + p2[1].toFixed(1);
    }
    return d;
  }
  function preenchido(pts) { return 'M0 ' + (H + 1) + 'L0 ' + pts[0][1].toFixed(1) + curva(pts) + 'L' + W + ' ' + (H + 1) + 'Z'; }
  function linha(pts) { return 'M0 ' + pts[0][1].toFixed(1) + curva(pts); }
  function desenhaOnda(onda, fase, energia) {
    var c = onda.c, amp = 1 + AMP_EXTRA * energia;
    var frente = pontos(function (t) {
      return c.base + c.a1 * amp * Math.sin(TAU * c.f1 * t + c.p1 + fase) + c.a2 * amp * Math.sin(TAU * c.f2 * t + c.p2 - 1.3 * fase);
    });
    var tras = pontos(function (t) {
      return c.base - 15 + 0.9 * c.a1 * amp * Math.sin(TAU * c.f1 * t + c.p1 + 0.6 + 1.4 * fase) + c.a2 * Math.sin(TAU * c.f2 * t + c.p2 + 1.2 - 0.8 * fase);
    });
    var dFrente = linha(frente);
    onda.front.setAttribute('d', preenchido(frente));
    onda.back.setAttribute('d', preenchido(tras));
    onda.crest.setAttribute('d', dFrente);
    onda.glow.setAttribute('d', dFrente);
    onda.crestBack.setAttribute('d', linha(tras));
    onda.svg.style.setProperty('--wave-energy', energia.toFixed(3));
  }
  function faseRolagem(svg) {
    var r = svg.getBoundingClientRect(), vh = window.innerHeight || 800;
    var prog = ((vh / 2) - (r.top + r.height / 2)) / vh;   // -1 entrando por baixo, +1 saindo por cima
    return Math.max(-1.5, Math.min(1.5, prog)) * 2.4;
  }
  if (ondas.length) {
    var lista = ondas.map(function (svg, i) {
      return {
        svg: svg, c: PARAMS[i % PARAMS.length], tempo: 0, visivel: true,
        front: svg.querySelector('.wave-front'), back: svg.querySelector('.wave-back'),
        crest: svg.querySelector('.wave-crest'), glow: svg.querySelector('.wave-glow'), crestBack: svg.querySelector('.wave-crest-back')
      };
    });
    if (reduz) {
      lista.forEach(function (o) { desenhaOnda(o, 0, 0); });
    } else {
      var energia = 0, ultimoY = window.scrollY, ultimoT = 0, rodando = false;
      var quadro = function (agora) {
        var dt = ultimoT ? Math.min(0.05, (agora - ultimoT) / 1000) : 0.016;
        ultimoT = agora;
        // velocidade da rolagem -> energia (sobe rápido, desce suave em ~0,8 s)
        var y = window.scrollY, vel = Math.abs(y - ultimoY) / Math.max(dt, 0.001);
        ultimoY = y;
        var alvo = Math.min(1, vel / 2200);
        var decaida = energia * Math.exp(-dt / 0.8);
        energia = alvo > decaida ? decaida + (alvo - decaida) * 0.3 : decaida;
        var algumaVisivel = false;
        lista.forEach(function (o) {
          o.tempo += dt * (REPOUSO + EXTRA * energia) * o.c.v;
          if (!o.visivel) return;
          algumaVisivel = true;
          desenhaOnda(o, o.tempo + faseRolagem(o.svg), energia);
        });
        if (algumaVisivel && !document.hidden) { window.requestAnimationFrame(quadro); } else { rodando = false; ultimoT = 0; }
      };
      var liga = function () { if (!rodando) { rodando = true; ultimoY = window.scrollY; window.requestAnimationFrame(quadro); } };
      if ('IntersectionObserver' in window) {
        var obsOnda = new IntersectionObserver(function (entradas) {
          entradas.forEach(function (en) {
            lista.forEach(function (o) { if (o.svg === en.target) o.visivel = en.isIntersecting; });
          });
          liga();
        }, { rootMargin: '120px 0px' });
        lista.forEach(function (o) { obsOnda.observe(o.svg); });
      }
      lista.forEach(function (o) { desenhaOnda(o, faseRolagem(o.svg), 0); });
      document.addEventListener('visibilitychange', function () { if (!document.hidden) liga(); });
      window.addEventListener('scroll', liga, { passive: true });
      liga();
    }
  }

  /* ===== Formulário: monta a mensagem e abre o WhatsApp ===== */
  var form = document.querySelector('[data-form]');
  if (!form) return;
  var nome = form.querySelector('#f-nome');
  var tipo = form.querySelector('#f-tipo');
  var ideia = form.querySelector('#f-ideia');
  var campoTipo = tipo.closest('.field-select');

  function marcaTipo() { campoTipo.classList.toggle('has-value', !!tipo.value); }
  tipo.addEventListener('change', function () { marcaTipo(); limpaErro(tipo); });
  marcaTipo();

  function mostraErro(campo) {
    campo.setAttribute('aria-invalid', 'true');
    document.getElementById(campo.getAttribute('aria-describedby')).hidden = false;
  }
  function limpaErro(campo) {
    campo.removeAttribute('aria-invalid');
    var msg = document.getElementById(campo.getAttribute('aria-describedby'));
    if (msg) msg.hidden = true;
  }
  nome.addEventListener('input', function () { if (nome.value.trim()) limpaErro(nome); });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var primeiroErro = null;
    if (!nome.value.trim()) { mostraErro(nome); primeiroErro = primeiroErro || nome; }
    if (!tipo.value) { mostraErro(tipo); primeiroErro = primeiroErro || tipo; }
    if (primeiroErro) { primeiroErro.focus(); return; }

    var chave = tipo.value;
    var linhas = [
      MENSAGENS[chave] || MENSAGENS.geral,
      '',
      'Nome: ' + nome.value.trim(),
      'Tipo de projeto: ' + (NOMES_TIPO[chave] || chave)
    ];
    if (ideia.value.trim()) linhas.push('Sobre a ideia: ' + ideia.value.trim());

    var url = linkWhatsApp(linhas.join('\n'));
    // window.open com noopener sempre retorna null: não dá para detectar bloqueio.
    // Por isso a confirmação abaixo traz o link para abrir manualmente.
    window.open(url, '_blank', 'noopener');
    var status = form.querySelector('[data-form-status]');
    status.textContent = 'Pronto! Abrimos o WhatsApp com a sua mensagem. Se não abriu, ';
    var link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener';
    link.textContent = 'toque aqui para abrir';
    status.appendChild(link);
    status.appendChild(document.createTextNode('.'));
    status.hidden = false;
  });
})();
