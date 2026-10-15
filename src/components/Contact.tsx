import { useEffect, useRef, useState, type FormEvent } from 'react';
import { contato, EMAIL, flutuante, MENSAGENS, NOMES_TIPO, rodape, whatsapp, type TipoProjeto } from '../content/site';
import { Glass } from './Glass';
import { GlideSelect, type GlideOption } from './GlideSelect';
import { Stepper, type StepDef } from './Stepper';
import { SPECULAR } from './Button';
import { SpecularLight } from './SpecularLight';
import { Topo } from './Topo';
import { Icon } from './Icons';
import { Reveal, SplitHeading } from './Motion';

// ícones dos serviços na lista do tipo de projeto (os mesmos dos cards)
const ICONE_TIPO = { sistemas: 'layers', sites: 'monitor', automacao: 'sync', geral: 'spark' } as const;
const TIPOS: GlideOption<TipoProjeto>[] = (Object.keys(NOMES_TIPO) as TipoProjeto[]).map((t) => ({ value: t, label: NOMES_TIPO[t], icon: ICONE_TIPO[t] }));

/**
 * Formulário em etapas (Stepper) que monta a mensagem e abre o WhatsApp (nada é enviado a servidor):
 * nome, tipo de projeto, ideia (opcional) e revisão com o botão de enviar. Só avança com a etapa válida.
 */
function ContactForm() {
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<TipoProjeto | ''>('');
  const [ideia, setIdeia] = useState('');
  const [erros, setErros] = useState({ nome: false, tipo: false });
  const [enviado, setEnviado] = useState<string | null>(null);
  const [etapa, setEtapa] = useState(1);
  const [alcancada, setAlcancada] = useState(1);
  const nomeRef = useRef<HTMLInputElement>(null);
  const tipoRef = useRef<HTMLButtonElement>(null);
  const e = contato.etapas;
  const TOTAL = 4;

  /** Vai para a etapa `n` se as anteriores estiverem válidas; senão para na primeira com erro. */
  const irPara = (n: number) => {
    const alvo = Math.max(1, Math.min(TOTAL, n));
    if (alvo > 1 && !nome.trim()) {
      setErros((x) => ({ ...x, nome: true }));
      if (etapa === 1) nomeRef.current?.focus();
      else setEtapa(1);
      return;
    }
    if (alvo > 2 && !tipo) {
      setErros((x) => ({ ...x, tipo: true }));
      if (etapa === 2) tipoRef.current?.focus();
      else setEtapa(2);
      return;
    }
    setEtapa(alvo);
    setAlcancada((r) => Math.max(r, alvo));
  };

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    // Enter num campo antes da última etapa só avança
    if (etapa < TOTAL) return irPara(etapa + 1);
    // na última etapa, só envia pelo botão "Enviar pelo WhatsApp" (nunca por um clique que começou em outro botão)
    const quem = (ev.nativeEvent as SubmitEvent).submitter;
    if (!quem?.classList.contains('stepper__send')) return;
    if (!nome.trim() || !tipo) return irPara(TOTAL);
    const linhas = [MENSAGENS[tipo], '', `Nome: ${nome.trim()}`, `Tipo de projeto: ${NOMES_TIPO[tipo]}`];
    if (ideia.trim()) linhas.push(`Sobre a ideia: ${ideia.trim()}`);
    const url = whatsapp(linhas.join('\n'));
    // window.open com noopener sempre retorna null: não dá para detectar bloqueio.
    // Por isso a confirmação traz o link para abrir manualmente.
    window.open(url, '_blank', 'noopener');
    setEnviado(url);
  };

  const revisao = [
    { k: contato.revisar.nome, v: nome.trim(), passo: 1 },
    { k: contato.revisar.tipo, v: tipo ? NOMES_TIPO[tipo] : '', passo: 2 },
    { k: contato.revisar.ideia, v: ideia.trim() || contato.revisar.semIdeia, passo: 3 },
  ];

  const passos: StepDef[] = [
    {
      title: e.nome.titulo,
      content: (
        <div className="form-step">
          <p className="form-step__q">{e.nome.pergunta}</p>
          <div className="field">
            <input
              ref={nomeRef}
              id="f-nome"
              name="nome"
              type="text"
              autoComplete="name"
              placeholder=" "
              required
              aria-describedby="e-nome"
              aria-invalid={erros.nome || undefined}
              value={nome}
              onChange={(ev) => {
                setNome(ev.target.value);
                if (ev.target.value.trim()) setErros((x) => ({ ...x, nome: false }));
              }}
            />
            <label htmlFor="f-nome">{contato.campos.nome}</label>
            <p className="field-error" id="e-nome" hidden={!erros.nome}>
              {contato.campos.nomeErro}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: e.tipo.titulo,
      content: (
        <div className="form-step">
          <p className="form-step__q">{e.tipo.pergunta}</p>
          <div className={tipo ? 'field field-select has-value' : 'field field-select'}>
            {/* lista de vidro no lugar do select nativo (que o sistema desenha cru, em azul) */}
            <GlideSelect
              ref={tipoRef}
              id="f-tipo"
              labelId="l-tipo"
              options={TIPOS}
              value={tipo}
              describedBy="e-tipo"
              invalid={erros.tipo}
              onChange={(v) => {
                setTipo(v);
                setErros((x) => ({ ...x, tipo: false }));
              }}
            />
            <label id="l-tipo" htmlFor="f-tipo">
              {contato.campos.tipo}
            </label>
            <input type="hidden" name="tipo" value={tipo} />
            <p className="field-error" id="e-tipo" hidden={!erros.tipo}>
              {contato.campos.tipoErro}
            </p>
          </div>
        </div>
      ),
    },
    {
      title: e.ideia.titulo,
      content: (
        <div className="form-step">
          <p className="form-step__q">{e.ideia.pergunta}</p>
          <div className="field">
            <textarea id="f-ideia" name="ideia" rows={4} placeholder=" " aria-describedby="d-ideia" value={ideia} onChange={(ev) => setIdeia(ev.target.value)} />
            <label htmlFor="f-ideia">{contato.campos.ideia}</label>
          </div>
          <p className="form-step__hint" id="d-ideia">
            {e.ideia.dica}
          </p>
        </div>
      ),
    },
    {
      title: e.enviar.titulo,
      content: (
        <div className="form-step">
          <p className="form-step__q">{e.enviar.pergunta}</p>
          <dl className="form-review">
            {revisao.map((r) => (
              <div key={r.k}>
                <dt>{r.k}</dt>
                <dd>{r.v}</dd>
                <button type="button" className="form-review__edit" onClick={() => irPara(r.passo)}>
                  {contato.revisar.editar}
                  <span className="sr-only"> {r.k.toLowerCase()}</span>
                </button>
              </div>
            ))}
          </dl>
        </div>
      ),
    },
  ];

  return (
    <Glass as="form" tone="dark" glow liquid className="contact-form reveal" id="form-contato" noValidate data-form="" onSubmit={onSubmit}>
      <Stepper
        steps={passos}
        current={etapa}
        reached={alcancada}
        onGo={irPara}
        finalAction={
          // mesmo botão do topo ("Vamos conversar"): vidro verde-água translúcido, cantos de 16px, seta no quadrado menta
          <button className="btn btn-mint btn-specular btn-hero stepper__send" type="submit">
            <SpecularLight radius={16} lineColor={SPECULAR.mint.lineColor} baseColor={SPECULAR.mint.baseColor} />
            <span className="specular__label">
              <Icon name="whatsapp" className="ic-wa" />
              {contato.enviarCurto}
              <span className="btn-hero__arrow" aria-hidden="true">
                <Icon name="arrow" className="ic-arrow" />
              </span>
            </span>
          </button>
        }
      />
      <p className="form-status" role="status" aria-live="polite" hidden={!enviado} data-form-status="">
        {enviado && (
          <>
            {contato.enviado}
            <a href={enviado} target="_blank" rel="noopener">
              {contato.enviadoLink}
            </a>
            .
          </>
        )}
      </p>
      <p className="lgpd">{contato.lgpd}</p>
    </Glass>
  );
}

export function Contact() {
  return (
    <section className="section deep deep-contato" id="contato" aria-labelledby="contato-titulo">
      <Topo seed={87} />
      <div className="wrap contact-grid">
        <div className="contact-copy">
          <Reveal className="eyebrow">{contato.eyebrow}</Reveal>
          <SplitHeading id="contato-titulo" className="h-serif-up" nodes={[`${contato.titulo} `, { tag: 'em', nodes: [contato.tituloDestaque] }]} />
          <Reveal i={2}>{contato.texto}</Reveal>
          <Reveal className="contact-alt" i={3}>
            {contato.alt} <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </Reveal>
        </div>
        <ContactForm />
      </div>

      <footer className="wrap site-footer">
        <a className="brand brand-footer" href="#topo" aria-label="JK Software, voltar ao início">
          <img src="/img/logo-jk-120.webp" srcSet="/img/logo-jk-120.webp 1x, /img/logo-jk-240.png 2x" alt="" width={72} height={52} loading="lazy" />
          <span>JK Software</span>
        </a>
        <ul className="footer-info" role="list">
          <li>
            <Icon name="mail" />
            <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </li>
          <li>
            <Icon name="pin" />
            <span>{rodape.local}</span>
          </li>
        </ul>
        <p className="copy">{rodape.copy}</p>
      </footer>
    </section>
  );
}

/** Botão flutuante de WhatsApp: some enquanto o formulário ou o rodapé estão na tela. */
export function WhatsAppFloat() {
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const alvos = [document.getElementById('form-contato'), document.querySelector('.site-footer')].filter(Boolean) as Element[];
    if (!alvos.length || !('IntersectionObserver' in window)) return;
    const visiveis = new Set<Element>();
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((en) => (en.isIntersecting ? visiveis.add(en.target) : visiveis.delete(en.target)));
        setHidden(visiveis.size > 0);
      },
      { threshold: 0.15 },
    );
    alvos.forEach((a) => io.observe(a));
    return () => io.disconnect();
  }, []);

  return (
    <a
      className={hidden ? 'wa-float is-hidden' : 'wa-float'}
      href={whatsapp(MENSAGENS.geral)}
      data-wa="geral"
      target="_blank"
      rel="noopener"
      aria-label={flutuante.aria}
      data-wa-float=""
    >
      <Icon name="whatsapp" />
    </a>
  );
}
