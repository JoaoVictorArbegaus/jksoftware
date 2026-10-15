/*
 * DocFolder: inspirado no Folder do React Bits (https://reactbits.dev, MIT).
 * Pasta de documentos do cliente: com o mouse em cima a aba da frente cede um pouco; clicando, ela abre e os
 * documentos sobem em leque; tocar num documento traz ele para a frente, maior, para ler.
 * Reescrito do zero em CSS 3D (o original desenha os documentos em WebGL e tem perto de 2.000 linhas): TypeScript,
 * marcas e documentos fictícios, teclado (Enter abre, Esc fecha) e cores da página.
 */
import { useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

const DOCS = [
  { nome: 'Proposta comercial', tipo: 'PDF · 4 páginas', cor: '#9DE8DE', linhas: ['Escopo: loja virtual + pedidos', 'Prazo: 6 semanas', 'Investimento em 3 etapas'] },
  { nome: 'Contrato assinado', tipo: 'PDF · assinado em 12/10', cor: '#E9C98A', linhas: ['Partes: JK Software e Loja Mar Azul', 'Suporte: 12 meses', 'Assinatura digital válida'] },
  { nome: 'NF-e 4.182', tipo: 'XML + PDF', cor: '#A4E0EA', linhas: ['Serviço: desenvolvimento', 'Valor: R$ 4.800,00', 'Emitida em 14/10/2026'] },
  { nome: 'Manual do sistema', tipo: 'PDF · 18 páginas', cor: '#C4F7F0', linhas: ['Como cadastrar produtos', 'Como acompanhar pedidos', 'Relatórios do mês'] },
];

export function DocFolder() {
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) setSel(null);
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => !rootRef.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  const onKey = (e: KeyboardEvent) => {
    if (e.key !== 'Escape') return;
    if (sel !== null) setSel(null);
    else setOpen(false);
  };

  const n = DOCS.length;
  return (
    <div ref={rootRef} className={['folder', open && 'is-open', sel !== null && 'has-sel'].filter(Boolean).join(' ')} onKeyDown={onKey}>
      <div className="folder__stage">
        <span className="folder__back" aria-hidden="true">
          <span className="folder__tab">Projeto Mar Azul</span>
        </span>
        <ul className="folder__docs" aria-label="Documentos">
          {DOCS.map((d, i) => (
            <li key={d.nome} className={sel === i ? 'folder__doc is-sel' : 'folder__doc'} style={{ '--i': i, '--k': i - (n - 1) / 2, '--cor': d.cor } as CSSProperties}>
              <button type="button" tabIndex={open ? 0 : -1} aria-pressed={sel === i} onClick={() => setSel((s) => (s === i ? null : i))}>
                <span className="folder__doc-head">
                  <i />
                  <strong>{d.nome}</strong>
                  <small>{d.tipo}</small>
                </span>
                <span className="folder__doc-body" aria-hidden={sel !== i}>
                  {d.linhas.map((l) => (
                    <span key={l}>{l}</span>
                  ))}
                </span>
                <span className="folder__lines" aria-hidden="true">
                  <b />
                  <b />
                  <b />
                  <b />
                </span>
              </button>
            </li>
          ))}
        </ul>
        <button type="button" className="folder__front" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
          <span className="folder__front-label">
            <strong>{open ? 'Fechar a pasta' : 'Abrir a pasta'}</strong>
            <small>{n} documentos</small>
          </span>
        </button>
      </div>
    </div>
  );
}
