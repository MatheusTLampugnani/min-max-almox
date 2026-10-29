import React, { useState, useEffect } from 'react';
import { useSolicitacoes } from './useSolicitacoes.js';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatarDataHora, formatarQuantidade } from '../../lib/formatters.js';
import {
  abrirOutlook,
  abrirOutlookWeb,
  abrirOutlookDesktop,
  redirecionarParaEmail,
  gerarEmailAprovacaoMatriz,
  gerarEmailNovaSolicitacao,
  gerarEmailConclusaoSAP,
  gerarEmailRecusa,
  obterDestinatariosSalvos,
  salvarDestinatarios
} from './emailOutlook.js';
import { ModalEnvioEmail } from './ModalEnvioEmail.jsx';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  Building2,
  Send,
  Mail,
  Check,
  X,
  Copy,
  ExternalLink,
  ShieldCheck,
  ChevronDown,
  ChevronUp,
  Settings
} from 'lucide-react';

export function SolicitacoesPage() {
  const { isAlmoxarifado, nomeCompleto, setor: setorUsuario } = useAuth();
  const { addToast } = useToast();
  const labelResponsavel = nomeCompleto
    ? `${nomeCompleto} (${setorUsuario || 'Almoxarifado Filial'})`
    : 'Almoxarifado Filial';
  const {
    solicitacoes,
    totalPendentes,
    filtroStatus,
    setFiltroStatus,
    carregando,
    erro,
    recarregar,
    aprovarSolicitacao,
    concluirSolicitacaoMatriz,
    recusarSolicitacao
  } = useSolicitacoes();

  // Modal de confirmação de aprovação / conclusão / recusa
  const [solicitacaoAlvo, setSolicitacaoAlvo] = useState(null);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState(null);
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [processando, setProcessando] = useState(false);

  // Modal para Envio de E-mail (Outlook Web ou Desktop)
  const [modalEmailInfo, setModalEmailInfo] = useState(null);

  // Destinatários de E-mail Corporativo (persiste no navegador do usuário)
  const [destinatarios, setDestinatarios] = useState(obterDestinatariosSalvos());
  const [mostrarConfigEmails, setMostrarConfigEmails] = useState(false);
  const [editandoDestinatarios, setEditandoDestinatarios] = useState(false);
  const [formDestinatarios, setFormDestinatarios] = useState(destinatarios);

  useEffect(() => {
    setFormDestinatarios(destinatarios);
  }, [destinatarios]);

  function salvarConfigDestinatarios(e) {
    e.preventDefault();
    salvarDestinatarios(formDestinatarios);
    setDestinatarios(formDestinatarios);
    setEditandoDestinatarios(false);
    addToast('Destinatários de e-mail atualizados com sucesso!', 'sucesso');
  }

  function abrirConfirmacao(sol, acao) {
    setSolicitacaoAlvo(sol);
    setAcaoConfirmacao(acao);
    setMotivoRecusa('');
  }

  function fecharConfirmacao() {
    setSolicitacaoAlvo(null);
    setAcaoConfirmacao(null);
    setMotivoRecusa('');
  }

  async function handleConfirmarAcao() {
    if (!solicitacaoAlvo || !acaoConfirmacao) return;

    try {
      setProcessando(true);

      if (acaoConfirmacao === 'aprovar') {

        await aprovarSolicitacao(solicitacaoAlvo.id);
        const emailDados = gerarEmailAprovacaoMatriz({
          solicitacao: solicitacaoAlvo,
          respondidoPor: labelResponsavel,
          customDestinatarios: destinatarios
        });

        // Redireciona imediatamente para o e-mail no Outlook com tudo pronto para enviar
        redirecionarParaEmail(emailDados);

        fecharConfirmacao();
        setModalEmailInfo({
          isOpen: true,
          titulo: 'Solicitação Aprovada! E-mail Gerado para a Matriz',
          subtitulo: 'A janela do Outlook foi aberta para você revisar e enviar para Cleidiomar.',
          dados: emailDados
        });
        return;
      } else if (acaoConfirmacao === 'concluir') {
        await concluirSolicitacaoMatriz(solicitacaoAlvo.id);
        const emailDados = gerarEmailConclusaoSAP({
          solicitacao: solicitacaoAlvo,
          finalizadoPor: labelResponsavel,
          customDestinatarios: destinatarios
        });

        // Redireciona para o e-mail no Outlook notificando a conclusão no SAP
        redirecionarParaEmail(emailDados);

        fecharConfirmacao();
        setModalEmailInfo({
          isOpen: true,
          titulo: 'Alteração Concluída no SAP! Notificar Filial',
          subtitulo: 'A janela do Outlook foi aberta com o aviso de conclusão no SAP.',
          dados: emailDados
        });
        return;
      } else {
        await recusarSolicitacao(solicitacaoAlvo.id, motivoRecusa);
        const emailDados = gerarEmailRecusa({
          solicitacao: solicitacaoAlvo,
          motivoRecusa,
          respondidoPor: labelResponsavel,
          customDestinatarios: destinatarios
        });

        // Redireciona para o e-mail informando a recusa
        redirecionarParaEmail(emailDados);

        fecharConfirmacao();
        setModalEmailInfo({
          isOpen: true,
          titulo: 'Solicitação Recusada! Notificar Solicitante',
          subtitulo: 'A janela do Outlook foi aberta com a justificativa da recusa.',
          dados: emailDados
        });
        return;
      }
    } catch (err) {
      // toast já disparado no hook
    } finally {
      setProcessando(false);
    }
  }


  function handleReabrirOutlookMatriz(sol) {
    const emailDados = gerarEmailAprovacaoMatriz({
      solicitacao: sol,
      respondidoPor: sol.respondidoPor || 'Almoxarifado Filial',
      customDestinatarios: destinatarios
    });
    setModalEmailInfo({
      isOpen: true,
      titulo: 'Encaminhar Solicitação para a Matriz',
      subtitulo: `${sol.itemCodigo} - ${sol.itemNome}`,
      dados: emailDados
    });
  }

  function handleCopiarTextoMatriz(sol) {
    const emailDados = gerarEmailAprovacaoMatriz({
      solicitacao: sol,
      respondidoPor: sol.respondidoPor || 'Almoxarifado Filial',
      customDestinatarios: destinatarios
    });
    const textoCompleto = `Assunto: ${emailDados.subject}\nPara: ${emailDados.to}\nCC: ${emailDados.cc}\n\n${emailDados.body}`;
    navigator.clipboard.writeText(textoCompleto);
    addToast('Texto do e-mail copiado para a área de transferência!', 'sucesso');
  }

  const abasFiltro = [
    { id: '', label: isAlmoxarifado ? 'Todas as Solicitações' : 'Minhas Solicitações' },
    { id: 'pendente', label: isAlmoxarifado ? 'Pendentes da Filial' : 'Minhas Pendentes', contador: totalPendentes },
    { id: 'encaminhada_matriz', label: 'Encaminhadas à Matriz' },
    { id: 'concluida', label: 'Concluídas no SAP' },
    { id: 'recusada', label: 'Recusadas' }
  ];

  return (
    <div className="w-full min-h-screen bg-videplast-bg text-left">
      {/* Navegação compacta no topo com botão voltar */}
      <Navegacao totalSolicitacoesPendentes={totalPendentes} modo="pagina" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Cabeçalho do Módulo */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Solicitações de Alteração de Mín/Máx
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Validação local pela Filial e encaminhamento formal via Outlook para o responsável na Matriz atualizar no SAP
            </p>
          </div>

          {/* Badge informativo de perfil */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 w-fit shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              {isAlmoxarifado ? 'ALM' : 'SUP'}
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block font-medium">Seu papel no fluxo:</span>
              <span className="font-bold text-slate-800">
                {isAlmoxarifado
                  ? 'Análise Filial e Encaminhamento à Matriz'
                  : 'Abertura e Acompanhamento'}
              </span>
            </div>
          </div>
        </div>

        {/* Abas de Filtros de Status */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-6 overflow-x-auto">
          {abasFiltro.map((aba) => {
            const isAtivo = filtroStatus === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                onClick={() => setFiltroStatus(aba.id)}
                className={`
                  inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all shrink-0
                  ${isAtivo
                    ? 'bg-videplast-primary text-white shadow-sm'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                  }
                `}
              >
                <span>{aba.label}</span>
                {aba.contador > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${isAtivo
                      ? 'bg-white text-videplast-primary'
                      : 'bg-red-100 text-red-700'
                      }`}
                  >
                    {aba.contador}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Listagem de Solicitações */}
        {carregando ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 bg-white rounded-xl border border-slate-200 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-96" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        ) : solicitacoes.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={isAlmoxarifado ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação aberta por você'}
            description={
              isAlmoxarifado
                ? 'Não há pedidos de alteração cadastrados para o filtro selecionado.'
                : 'Você só visualiza as solicitações que você mesmo abriu com seu crachá.'
            }
            actionLabel={isAlmoxarifado ? 'Ver Todas as Solicitações' : 'Ver Minhas Solicitações'}
            onAction={() => setFiltroStatus('')}
          />
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((sol) => {
              const isPendente = sol.status === 'pendente';
              const isEncaminhada = sol.status === 'encaminhada_matriz' || sol.status === 'aprovada';
              const isConcluida = sol.status === 'concluida';
              const isRecusada = sol.status === 'recusada';

              return (
                <Card
                  key={sol.id}
                  className={`p-5 sm:p-6 border transition-all ${isPendente
                    ? 'border-amber-300 bg-amber-50/15'
                    : isEncaminhada
                      ? 'border-blue-200 bg-blue-50/10'
                      : isConcluida
                        ? 'border-emerald-200 bg-emerald-50/10'
                        : 'border-slate-200 bg-white'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          SAP: {sol.itemCodigo}
                        </span>
                        <span className="text-xs text-slate-400">
                          Aberto em {formatarDataHora(sol.dataCriacao)}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                          <Mail className="w-3 h-3 text-blue-500" />
                          Integração Outlook
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1.5">
                        {sol.itemNome}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          Solicitante: <strong>{sol.solicitante}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          Setor: <strong>{sol.setor}</strong>
                        </span>
                      </div>
                    </div>

                    {/* Badge de Status no Fluxo */}
                    <div className="shrink-0">
                      {isPendente && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                          Pendente de Análise Filial
                        </span>
                      )}
                      {isEncaminhada && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-blue-100 text-blue-900 border border-blue-300 shadow-xs">
                          <Send className="w-3.5 h-3.5 text-blue-700" />
                          Aprovada Filial • Encaminhada à Matriz
                        </span>
                      )}
                      {isConcluida && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
                          Alteração Concluída no SAP
                        </span>
                      )}
                      {isRecusada && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300 shadow-xs">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Recusada pela Filial
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Comparativo de Parâmetros: Atual vs Proposto */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 my-3">
                    {/* Mínimo */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Estoque Mínimo
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 line-through">
                            {formatarQuantidade(sol.minAtual, sol.itemUnidade)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-extrabold text-slate-800">
                            {formatarQuantidade(sol.novoMin, sol.itemUnidade)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border text-slate-600">
                        {sol.novoMin > sol.minAtual ? '+ Aumento' : '- Redução'}
                      </span>
                    </div>

                    {/* Máximo */}
                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Estoque Máximo
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-slate-500 line-through">
                            {formatarQuantidade(sol.maxAtual, sol.itemUnidade)}
                          </span>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                          <span className="text-sm font-extrabold text-slate-800">
                            {formatarQuantidade(sol.novoMax, sol.itemUnidade)}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white border text-slate-600">
                        {sol.novoMax > sol.maxAtual ? '+ Aumento' : '- Redução'}
                      </span>
                    </div>
                  </div>

                  {/* Justificativa da Supervisão */}
                  <div className="p-3.5 bg-white rounded-xl border border-slate-200/80 text-xs my-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Justificativa da Alteração:
                    </span>
                    <p className="text-slate-700 italic">"{sol.justificativa}"</p>
                  </div>

                  {/* Linha do tempo / Auditoria de Resposta */}
                  {sol.dataResposta && (
                    <div className="p-3 bg-slate-50/80 rounded-lg border border-slate-200/60 text-xs text-slate-600 space-y-1 my-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>
                          Validado por <strong>{sol.respondidoPor}</strong> em {formatarDataHora(sol.dataResposta)}
                        </span>
                      </div>
                      {isEncaminhada && (
                        <p className="text-[11px] text-blue-700 pl-5.5">
                          ✓ Solicitação aprovada localmente e ficha técnica pronta para envio ao responsável de cadastro na Matriz.
                        </p>
                      )}
                      {isConcluida && sol.dataConclusaoMatriz && (
                        <p className="text-[11px] text-emerald-700 pl-5.5 font-medium">
                          ✓ Conclusão registrada no sistema em {formatarDataHora(sol.dataConclusaoMatriz)}. Parâmetros aplicados.
                        </p>
                      )}
                      {sol.motivoRecusa && (
                        <p className="text-[11px] text-red-700 pl-5.5 font-medium">
                          Motivo da recusa: {sol.motivoRecusa}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Barra de Ações Rápidas */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2.5 flex-wrap">
                    {/* Botões de Acesso ao E-mail Outlook em qualquer momento */}
                    <div className="flex items-center gap-2">
                      {isEncaminhada && (
                        <>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleReabrirOutlookMatriz(sol)}
                          >
                            <Mail className="w-3.5 h-3.5 text-blue-600" />
                            Abrir no Outlook
                          </Button>
                          <Button
                            variant="outline-secondary"
                            size="sm"
                            onClick={() => handleCopiarTextoMatriz(sol)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                            Copiar Texto
                          </Button>
                        </>
                      )}
                    </div>

                    {/* Ações Administrativas do Almoxarifado / Coordenação */}
                    {isAlmoxarifado && (
                      <div className="flex items-center gap-2.5 ml-auto">
                        {isPendente && (
                          <>
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => abrirConfirmacao(sol, 'recusar')}
                            >
                              <X className="w-3.5 h-3.5" />
                              Recusar
                            </Button>
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => abrirConfirmacao(sol, 'aprovar')}
                            >
                              <Send className="w-3.5 h-3.5" />
                              Aprovar e Abrir Outlook para Matriz
                            </Button>
                          </>
                        )}

                        {isEncaminhada && (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => abrirConfirmacao(sol, 'concluir')}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Confirmar que Matriz alterou no SAP
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Configuração dos Destinatários */}
      <Modal
        isOpen={editandoDestinatarios}
        onClose={() => setEditandoDestinatarios(false)}
        title="Configurar E-mails do Fluxo Videplast"
        subtitle="Defina os e-mails oficiais da filial e da matriz para envio direto via Outlook"
        maxWidth="max-w-md"
      >
        <form onSubmit={salvarConfigDestinatarios} className="space-y-3.5 text-left text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              E-mail do Almoxarifado Filial
            </label>
            <input
              type="email"
              value={formDestinatarios.almoxarifado}
              onChange={(e) => setFormDestinatarios({ ...formDestinatarios, almoxarifado: e.target.value })}
              className="w-full border rounded-corp p-2 text-xs outline-none focus:border-videplast-primary"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              E-mail do Supervisor
            </label>
            <input
              type="email"
              value={formDestinatarios.supervisor}
              onChange={(e) => setFormDestinatarios({ ...formDestinatarios, supervisor: e.target.value })}
              className="w-full border rounded-corp p-2 text-xs outline-none focus:border-videplast-primary"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-slate-700 uppercase mb-1">
              E-mail do Coordenador Filial
            </label>
            <input
              type="email"
              value={formDestinatarios.coordenador}
              onChange={(e) => setFormDestinatarios({ ...formDestinatarios, coordenador: e.target.value })}
              className="w-full border rounded-corp p-2 text-xs outline-none focus:border-videplast-primary"
              required
            />
          </div>
          <div>
            <label className="block font-bold text-emerald-700 uppercase mb-1">
              E-mail do Responsável na Matriz (Alterações SAP)
            </label>
            <input
              type="email"
              value={formDestinatarios.matriz}
              onChange={(e) => setFormDestinatarios({ ...formDestinatarios, matriz: e.target.value })}
              className="w-full border border-emerald-300 bg-emerald-50/30 rounded-corp p-2 text-xs outline-none focus:border-emerald-600 font-semibold"
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline-secondary" size="sm" type="button" onClick={() => setEditandoDestinatarios(false)}>
              Cancelar
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Salvar Destinatários
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Ações */}
      <Modal
        isOpen={Boolean(solicitacaoAlvo)}
        onClose={fecharConfirmacao}
        title={
          acaoConfirmacao === 'aprovar'
            ? 'Aprovar e Abrir Outlook para Matriz'
            : acaoConfirmacao === 'concluir'
              ? 'Confirmar Conclusão da Matriz no SAP'
              : 'Recusar Solicitação'
        }
        subtitle={solicitacaoAlvo ? `${solicitacaoAlvo.itemCodigo} - ${solicitacaoAlvo.itemNome}` : ''}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left text-sm">
          {acaoConfirmacao === 'aprovar' ? (
            <div>
              <p className="text-slate-700 leading-relaxed text-xs">
                Como somos filial, a alteração oficial no SAP é feita pela equipe da Matriz. Ao aprovar:
              </p>
              <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1.5 my-3">
                <li>A solicitação será aprovada localmente no sistema.</li>
                <li>
                  O <strong>Microsoft Outlook abrirá imediatamente</strong> com o e-mail completo preenchido para o responsável da Matriz com cópia para a Coordenação.
                </li>
                <li>Basta você revisar a tela do Outlook e clicar em <strong>"Enviar"</strong>.</li>
              </ul>
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200 text-xs text-blue-900 font-medium">
                Destinatário Matriz: <strong>{destinatarios.matriz}</strong><br />
                Novo Mínimo: <strong>{formatarQuantidade(solicitacaoAlvo?.novoMin, solicitacaoAlvo?.itemUnidade)}</strong> • Novo Máximo: <strong>{formatarQuantidade(solicitacaoAlvo?.novoMax, solicitacaoAlvo?.itemUnidade)}</strong>
              </div>
            </div>
          ) : acaoConfirmacao === 'concluir' ? (
            <div>
              <p className="text-slate-700 text-xs leading-relaxed">
                Você confirma que o responsável pelas alterações na Matriz <strong>já efetuou a alteração dos parâmetros no SAP</strong>?
              </p>
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium">
                Os parâmetros de estoque mínimo e máximo do material serão atualizados no sistema e o pedido será finalizado como Concluído.
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-700 text-xs">
                Informe o motivo da recusa desta solicitação para registro na auditoria:
              </p>
              <textarea
                rows={3}
                value={motivoRecusa}
                onChange={(e) => setMotivoRecusa(e.target.value)}
                placeholder="Ex: Capacidade física de armazenagem insuficiente no galpão atual..."
                className="w-full mt-2 rounded-corp border border-slate-200 p-2.5 text-xs outline-none focus:border-videplast-primary resize-none"
              />
            </div>
          )}

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <Button variant="outline-secondary" size="sm" onClick={fecharConfirmacao} disabled={processando}>
              Voltar
            </Button>
            <Button
              variant={acaoConfirmacao === 'concluir' ? 'success' : acaoConfirmacao === 'aprovar' ? 'primary' : 'outline-primary'}
              size="sm"
              loading={processando}
              onClick={handleConfirmarAcao}
            >
              {acaoConfirmacao === 'aprovar'
                ? 'Aprovar e Abrir no Outlook'
                : acaoConfirmacao === 'concluir'
                  ? 'Confirmar Conclusão no SAP'
                  : 'Confirmar Recusa'}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Interativo de Opções do Outlook (Web e Desktop) */}
      {modalEmailInfo && (
        <ModalEnvioEmail
          isOpen={modalEmailInfo.isOpen}
          onClose={() => setModalEmailInfo(null)}
          titulo={modalEmailInfo.titulo}
          subtitulo={modalEmailInfo.subtitulo}
          emailDados={modalEmailInfo.dados}
        />
      )}
    </div>
  );
}

