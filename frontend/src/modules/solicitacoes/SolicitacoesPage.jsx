import React, { useState } from 'react';
import { useSolicitacoes } from './useSolicitacoes.js';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Modal } from '../../components/ui/Modal.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { formatarNumero, formatarDataHora, formatarQuantidade } from '../../lib/formatters.js';
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ArrowRight,
  User,
  Building2,
  AlertTriangle,
  Check,
  X
} from 'lucide-react';

export function SolicitacoesPage() {
  const { isAlmoxarifado } = useAuth();
  const {
    solicitacoes,
    totalPendentes,
    filtroStatus,
    setFiltroStatus,
    carregando,
    erro,
    recarregar,
    aprovarSolicitacao,
    recusarSolicitacao
  } = useSolicitacoes();

  // Modal de confirmação de aprovação/recusa
  const [solicitacaoAlvo, setSolicitacaoAlvo] = useState(null);
  const [acaoConfirmacao, setAcaoConfirmacao] = useState(null); // 'aprovar' | 'recusar'
  const [motivoRecusa, setMotivoRecusa] = useState('');
  const [processando, setProcessando] = useState(false);

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
      } else {
        await recusarSolicitacao(solicitacaoAlvo.id, motivoRecusa);
      }
      fecharConfirmacao();
    } catch (err) {
      // toast já disparado no hook
    } finally {
      setProcessando(false);
    }
  }

  const abasFiltro = [
    { id: '', label: 'Todas as Solicitações' },
    { id: 'pendente', label: 'Pendentes de Aprovação', contador: totalPendentes },
    { id: 'aprovada', label: 'Aprovadas' },
    { id: 'recusada', label: 'Recusadas' }
  ];

  return (
    <div className="w-full min-h-screen bg-videplast-bg text-left">
      {/* Navegação compacta no topo com botão voltar */}
      <Navegacao totalSolicitacoesPendentes={totalPendentes} modo="pagina" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4">
        {/* Cabeçalho do Módulo */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Solicitações de Alteração de Mín/Máx
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ajustes solicitados pela supervisão setorial para validação da equipe de almoxarifado
            </p>
          </div>

          {/* Badge informativo de perfil */}
          <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-xs flex items-center gap-3 w-fit">
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              {isAlmoxarifado ? 'ALM' : 'SUP'}
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block font-medium">Seu papel no fluxo:</span>
              <span className="font-bold text-slate-800">
                {isAlmoxarifado
                  ? 'Aprovação e Aplicação Direta'
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
            title="Nenhuma solicitação encontrada"
            description="Não há pedidos de alteração cadastrados para o filtro selecionado."
            actionLabel="Ver Todas as Solicitações"
            onAction={() => setFiltroStatus('')}
          />
        ) : (
          <div className="space-y-4">
            {solicitacoes.map((sol) => {
              const isPendente = sol.status === 'pendente';
              const isAprovada = sol.status === 'aprovada';
              const isRecusada = sol.status === 'recusada';

              return (
                <Card
                  key={sol.id}
                  className={`p-5 sm:p-6 border transition-all ${isPendente
                      ? 'border-amber-300 bg-amber-50/15'
                      : 'border-slate-200/90 bg-white'
                    }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          SAP: {sol.itemCodigo}
                        </span>
                        <span className="text-xs text-slate-400">
                          {formatarDataHora(sol.dataCriacao)}
                        </span>
                      </div>
                      <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
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

                    {/* Badge de Status */}
                    <div className="shrink-0">
                      {isPendente && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300 shadow-xs">
                          <Clock className="w-3.5 h-3.5 text-amber-700 animate-spin" style={{ animationDuration: '4s' }} />
                          Pendente de Avaliação
                        </span>
                      )}
                      {isAprovada && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 shadow-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          Aprovada pelo Almoxarifado
                        </span>
                      )}
                      {isRecusada && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-300 shadow-xs">
                          <XCircle className="w-3.5 h-3.5 text-red-600" />
                          Recusada pelo Almoxarifado
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

                  {/* Detalhes de resposta se já finalizada */}
                  {sol.dataResposta && (
                    <div className="text-[11px] text-slate-500 mb-2">
                      Respondido em {formatarDataHora(sol.dataResposta)} por <strong>{sol.respondidoPor}</strong>
                      {sol.motivoRecusa && (
                        <p className="text-red-700 mt-0.5">Motivo: {sol.motivoRecusa}</p>
                      )}
                    </div>
                  )}

                  {/* Botões de Ação para o time de Almoxarifado */}
                  {isAlmoxarifado && isPendente && (
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                      <Button
                        variant="outline-primary"
                        size="sm"
                        onClick={() => abrirConfirmacao(sol, 'recusar')}
                      >
                        <X className="w-3.5 h-3.5" />
                        Recusar Solicitação
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => abrirConfirmacao(sol, 'aprovar')}
                      >
                        <Check className="w-3.5 h-3.5" />
                        Aprovar e Atualizar Mín/Máx
                      </Button>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal de Confirmação de Aprovação / Recusa */}
      <Modal
        isOpen={Boolean(solicitacaoAlvo)}
        onClose={fecharConfirmacao}
        title={
          acaoConfirmacao === 'aprovar'
            ? 'Confirmar Aprovação de Alteração'
            : 'Confirmar Recusa de Solicitação'
        }
        subtitle={solicitacaoAlvo ? `${solicitacaoAlvo.itemCodigo} - ${solicitacaoAlvo.itemNome}` : ''}
        maxWidth="max-w-md"
      >
        <div className="space-y-4 text-left text-sm">
          {acaoConfirmacao === 'aprovar' ? (
            <div>
              <p className="text-slate-700">
                Ao aprovar, os novos parâmetros de estoque serão <strong>aplicados imediatamente</strong> ao cadastro do material:
              </p>
              <div className="mt-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200 text-xs text-emerald-900 font-medium">
                Mínimo: {formatarQuantidade(solicitacaoAlvo?.novoMin, solicitacaoAlvo?.itemUnidade)} • Máximo: {formatarQuantidade(solicitacaoAlvo?.novoMax, solicitacaoAlvo?.itemUnidade)}
              </div>
            </div>
          ) : (
            <div>
              <p className="text-slate-700">
                Informe o motivo da recusa desta solicitação para registro no histórico:
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
              variant={acaoConfirmacao === 'aprovar' ? 'success' : 'primary'}
              size="sm"
              loading={processando}
              onClick={handleConfirmarAcao}
            >
              {acaoConfirmacao === 'aprovar' ? 'Confirmar e Aplicar' : 'Confirmar Recusa'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
