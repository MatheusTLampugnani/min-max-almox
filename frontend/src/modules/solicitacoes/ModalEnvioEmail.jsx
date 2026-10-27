import React from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import {
  abrirOutlookWeb,
  abrirOutlookDesktop
} from './emailOutlook.js';
import { Mail, Globe, Monitor, Copy, Check, ExternalLink } from 'lucide-react';

export function ModalEnvioEmail({
  isOpen,
  onClose,
  titulo = 'Enviar Mensagem via Outlook',
  subtitulo = 'Escolha como deseja disparar o e-mail oficial',
  emailDados
}) {
  const { addToast } = useToast();
  const [copiado, setCopiado] = React.useState(false);

  if (!emailDados) return null;

  const { to, cc, subject, body } = emailDados;

  function handleCopiarTudo() {
    const textoCompleto = `Para: ${to}\n${cc ? `CC: ${cc}\n` : ''}Assunto: ${subject}\n\n${body}`;
    navigator.clipboard.writeText(textoCompleto);
    setCopiado(true);
    addToast('Mensagem completa copiada para a área de transferência!', 'sucesso');
    setTimeout(() => setCopiado(false), 2500);
  }

  function handleAbrirWeb() {
    abrirOutlookWeb(emailDados);
    addToast('Abrindo o Outlook Web (Office 365)...', 'info');
  }

  function handleAbrirDesktop() {
    abrirOutlookDesktop(emailDados);
    addToast('Invocando o aplicativo Outlook do Windows...', 'info');
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={titulo}
      subtitle={subtitulo}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4 text-left text-xs">
        {/* Banner de Opções de Envio */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Opção 1: Outlook Web (Office 365) */}
          <button
            type="button"
            onClick={handleAbrirWeb}
            className="p-3.5 rounded-xl border border-blue-300 bg-blue-50/70 hover:bg-blue-100/70 text-left transition-all group flex items-start gap-3 shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-blue-900 block text-xs flex items-center gap-1">
                Outlook Web (Office 365)
                <ExternalLink className="w-3 h-3 text-blue-500" />
              </span>
              <p className="text-[11px] text-blue-700 mt-0.5 leading-snug">
                Abre direto no navegador com sua conta Videplast já logada
              </p>
            </div>
          </button>

          {/* Opção 2: Outlook Aplicativo Desktop */}
          <button
            type="button"
            onClick={handleAbrirDesktop}
            className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-left transition-all group flex items-start gap-3 shadow-xs"
          >
            <div className="w-9 h-9 rounded-lg bg-slate-800 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Monitor className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-slate-800 block text-xs">
                Outlook Aplicativo (Windows)
              </span>
              <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                Abre a janela nativa do Outlook instalado no seu computador
              </p>
            </div>
          </button>
        </div>

        {/* Ficha técnica do E-mail */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200/80">
            <span className="text-[10px] uppercase font-bold text-slate-400">
              Pré-visualização do Conteúdo
            </span>
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={handleCopiarTudo}
              className="text-[11px] py-1 h-auto"
            >
              {copiado ? (
                <>
                  <Check className="w-3 h-3 text-emerald-600" />
                  Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  Copiar Texto
                </>
              )}
            </Button>
          </div>

          <div className="space-y-1.5 text-xs text-slate-700 font-mono">
            <div>
              <span className="font-bold text-slate-500">Para: </span>
              <span className="font-semibold text-slate-900">{to}</span>
            </div>
            {cc && (
              <div>
                <span className="font-bold text-slate-500">CC: </span>
                <span className="text-slate-800">{cc}</span>
              </div>
            )}
            <div>
              <span className="font-bold text-slate-500">Assunto: </span>
              <span className="font-semibold text-slate-900">{subject}</span>
            </div>
          </div>

          <div className="mt-2 pt-2 border-t border-slate-200/70">
            <textarea
              readOnly
              rows={8}
              value={body}
              className="w-full bg-white border border-slate-200 rounded-lg p-2.5 font-mono text-[11px] text-slate-700 outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline-secondary" size="sm" onClick={onClose}>
            Fechar
          </Button>
          <Button variant="primary" size="sm" onClick={handleAbrirWeb}>
            <Globe className="w-3.5 h-3.5" />
            Abrir no Outlook Web
          </Button>
        </div>
      </div>
    </Modal>
  );
}
