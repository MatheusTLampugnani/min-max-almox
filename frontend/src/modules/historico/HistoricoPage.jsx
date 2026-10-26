import React from 'react';
import { useHistorico } from './useHistorico.js';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { SkeletonTabela } from '../../components/ui/Skeleton.jsx';
import { Paginacao } from '../../components/ui/Paginacao.jsx';
import { formatarNumero, formatarDataHora } from '../../lib/formatters.js';
import {
  History,
  Search,
  X,
  Sliders,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  ShieldAlert,
  Calendar,
  Layers,
  MessageSquareQuote
} from 'lucide-react';
import { Link } from 'react-router-dom';

const TIPOS_ACAO_OPCOES = [
  { valor: '', label: 'Todas as Ações' },
  { valor: 'importacao_sap', label: 'Sincronização SAP (Planilha)' },
  { valor: 'novo_material_sap', label: 'Novos Materiais (SAP)' },
  { valor: 'alteracao_min_max_direta', label: 'Alteração Direta Mín/Máx' },
  { valor: 'solicitacao_aprovada', label: 'Solicitação Aprovada' },
  { valor: 'solicitacao_criada', label: 'Abertura de Solicitação' },
  { valor: 'solicitacao_recusada', label: 'Solicitação Recusada' }
];


export function HistoricoPage() {
  const { isAlmoxarifado } = useAuth();
  const {
    registros,
    totalRegistros,
    termo,
    setTermo,
    tipoAcao,
    setTipoAcao,
    carregando,
    erro,
    recarregar,
    limparFiltros,
    paginaAtual,
    setPaginaAtual,
    itensPorPagina,
    setItensPorPagina
  } = useHistorico();

  // Controle de acesso
  if (!isAlmoxarifado) {
    return (
      <div className="w-full">
        <Navegacao modo="subpagina" />
        <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-corp border border-videplast-border text-center shadow-sm">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-videplast-dark">Acesso Restrito ao Almoxarifado</h2>
          <p className="text-sm text-gray-500 mt-2">
            O histórico de auditoria e parametrização é restrito à equipe do Almoxarifado Central.
          </p>
          <div className="mt-6">
            <Link
              to="/"
              className="inline-flex items-center justify-center px-4 py-2 rounded-corp bg-videplast-primary text-white text-sm font-semibold hover:bg-videplast-primary-hover"
            >
              Voltar para Consulta
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Renderização do Badge de Ação
  function renderBadgeAcao(tipo) {
    switch (tipo) {
      case 'importacao_sap':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
            <Layers className="w-3.5 h-3.5 text-emerald-600" />
            Sincronização SAP
          </span>
        );
      case 'novo_material_sap':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-purple-600" />
            Novo Material (SAP)
          </span>
        );
      case 'alteracao_min_max_direta':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
            <Sliders className="w-3.5 h-3.5 text-blue-600" />
            Alteração Direta
          </span>
        );
      case 'solicitacao_aprovada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shrink-0">
            <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
            Solicitação Aprovada
          </span>
        );
      case 'solicitacao_criada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 shrink-0">
            <FileText className="w-3.5 h-3.5 text-amber-600" />
            Solicitação Aberta
          </span>
        );
      case 'solicitacao_recusada':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200 shrink-0">
            <XCircle className="w-3.5 h-3.5 text-red-600" />
            Solicitação Recusada
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 shrink-0">
            <History className="w-3.5 h-3.5" />
            {tipo}
          </span>
        );
    }
  }


  return (
    <div className="w-full pb-12">
      {/* Navegação Secundária com Voltar à Consulta */}
      <Navegacao modo="subpagina" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Página */}
        <div className="mb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Histórico de Auditoria & Alterações
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
                {totalRegistros} {totalRegistros === 1 ? 'registro' : 'registros'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Rastreabilidade de todas as alterações de Mín/Máx e deliberações de solicitações na Videplast.
            </p>
          </div>
        </div>

        {/* Barra de Filtros Totalmente Responsiva */}
        <Card className="p-3 sm:p-4 mb-6 bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Input de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por código SAP, material, usuário ou justificativa..."
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-videplast-primary outline-none transition-colors"
              />
              {termo && (
                <button
                  type="button"
                  onClick={() => setTermo('')}
                  aria-label="Limpar termo de busca"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Select Tipo de Ação */}
            <div className="w-full sm:w-64 shrink-0">
              <select
                value={tipoAcao}
                onChange={(e) => setTipoAcao(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 text-slate-700 font-medium focus:border-videplast-primary outline-none transition-colors cursor-pointer"
              >
                {TIPOS_ACAO_OPCOES.map((opt) => (
                  <option key={opt.valor} value={opt.valor}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Limpar Filtros */}
            {(termo || tipoAcao) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="text-slate-500 hover:text-videplast-primary shrink-0 justify-center"
              >
                <X className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </Button>
            )}
          </div>
        </Card>

        {/* Conteúdo do Histórico */}
        {carregando ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
            <SkeletonTabela linhas={8} />
          </div>
        ) : totalRegistros === 0 ? (
          <EmptyState
            title="Nenhum registro encontrado no histórico"
            description="Não encontramos nenhuma alteração ou solicitação correspondente aos filtros aplicados."
            actionLabel="Limpar Filtros"
            onAction={limparFiltros}
          />
        ) : (
          <div className="space-y-4">
            {/* ============================================================== */}
            {/* 1. VISÃO DESKTOP (Tabela Completa com colunas proporcionais) */}
            {/* ============================================================== */}
            <div className="hidden lg:block bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm min-w-[960px]">
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '25%' }} />
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '14%' }} />
                    <col style={{ width: '15%' }} />
                  </colgroup>
                  <thead className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="py-3 px-3.5">Data & Hora</th>
                      <th className="py-3 px-3.5">Ação</th>
                      <th className="py-3 px-3.5">Material (SAP)</th>
                      <th className="py-3 px-3.5">Usuário</th>
                      <th className="py-3 px-3.5">Parâmetros</th>
                      <th className="py-3 px-3.5">Justificativa / Parecer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {registros.map((item) => {
                      const alt = item.alteracao;
                      const temAlteracao = alt && (alt.novoMin !== null || alt.novoMax !== null);
                      const minSubiu = alt && alt.novoMin > alt.minAnterior;
                      const maxSubiu = alt && alt.novoMax > alt.maxAnterior;

                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-slate-50/70 transition-colors duration-150"
                        >
                          {/* Data/Hora */}
                          <td className="py-3.5 px-3.5 align-top whitespace-nowrap">
                            <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                              <span className="text-xs">{formatarDataHora(item.dataHora)}</span>
                            </div>
                          </td>

                          {/* Tipo de Ação */}
                          <td className="py-3.5 px-3.5 align-top">
                            {renderBadgeAcao(item.tipoAcao)}
                          </td>

                          {/* Material */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="flex flex-col">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-[11px] border border-slate-200">
                                  {item.item?.codigo || '---'}
                                </span>
                                {item.item?.categoria && (
                                  <span className="text-[10px] text-slate-400 font-semibold uppercase">
                                    {item.item.categoria}
                                  </span>
                                )}
                              </div>
                              <span className="text-slate-800 font-medium line-clamp-2 mt-1" title={item.item?.nome}>
                                {item.item?.nome || 'Material'}
                              </span>
                            </div>
                          </td>

                          {/* Usuário / Responsável */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="flex items-start gap-2">
                              <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 mt-0.5">
                                <User className="w-3 h-3" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-slate-800 text-xs truncate" title={item.usuario}>
                                  {item.usuario || 'Usuário'}
                                </span>
                                <span className="text-[10px] text-slate-400 uppercase font-medium">
                                  {item.perfil}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Alteração Mín / Máx e Saldo */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="flex flex-col gap-1 text-xs">
                              {/* Variação de Saldo (Sincronização SAP) */}
                              {item.saldoNovo !== null && item.saldoNovo !== undefined && (
                                <div className="flex items-center gap-1 text-[11px] pb-1 border-b border-slate-100 mb-0.5">
                                  <span className="text-slate-400 font-bold uppercase w-10">Saldo:</span>
                                  <span className="text-slate-400">{formatarNumero(item.saldoAnterior)}</span>
                                  <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                  <span className="font-bold text-slate-800">{formatarNumero(item.saldoNovo)}</span>
                                  {item.variacaoSaldo !== 0 && item.variacaoSaldo !== null && (
                                    <span
                                      className={`inline-flex items-center gap-0.5 font-bold px-1.5 py-0.5 rounded text-[10px] ml-1 ${
                                        item.variacaoSaldo > 0
                                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                          : 'bg-red-50 text-red-700 border border-red-200'
                                      }`}
                                    >
                                      {item.variacaoSaldo > 0 ? (
                                        <TrendingUp className="w-2.5 h-2.5 shrink-0" />
                                      ) : (
                                        <TrendingDown className="w-2.5 h-2.5 shrink-0" />
                                      )}
                                      {item.variacaoSaldo > 0 ? '+' : ''}
                                      {formatarNumero(item.variacaoSaldo)}
                                    </span>
                                  )}
                                </div>
                              )}

                              {temAlteracao ? (
                                <>
                                  {/* Mínimo */}
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase w-10">
                                      Mín:
                                    </span>
                                    <span className="text-slate-400 line-through">
                                      {formatarNumero(alt.minAnterior)}
                                    </span>
                                    <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span className={`font-bold ${minSubiu ? 'text-red-700' : 'text-slate-800'}`}>
                                      {formatarNumero(alt.novoMin)}
                                    </span>
                                    {minSubiu ? (
                                      <TrendingUp className="w-3 h-3 text-red-500 shrink-0" title="Aumento de Mínimo" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 text-blue-500 shrink-0" title="Redução de Mínimo" />
                                    )}
                                  </div>

                                  {/* Máximo */}
                                  <div className="flex items-center gap-1 text-[11px]">
                                    <span className="text-slate-400 font-bold uppercase w-10">
                                      Máx:
                                    </span>
                                    <span className="text-slate-400 line-through">
                                      {formatarNumero(alt.maxAnterior)}
                                    </span>
                                    <ArrowRight className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                                    <span className={`font-bold ${maxSubiu ? 'text-amber-700' : 'text-slate-800'}`}>
                                      {formatarNumero(alt.novoMax)}
                                    </span>
                                    {maxSubiu ? (
                                      <TrendingUp className="w-3 h-3 text-amber-500 shrink-0" title="Aumento de Máximo" />
                                    ) : (
                                      <TrendingDown className="w-3 h-3 text-blue-500 shrink-0" title="Redução de Máximo" />
                                    )}
                                  </div>
                                </>
                              ) : (
                                item.saldoNovo === null && <span className="text-slate-400 text-xs italic">Sem alteração</span>
                              )}
                            </div>
                          </td>


                          {/* Justificativa / Parecer */}
                          <td className="py-3.5 px-3.5 align-top">
                            <div className="space-y-1.5">
                              {item.justificativa && (
                                <p className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200/80 leading-relaxed">
                                  <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                                    Justificativa:
                                  </span>
                                  {item.justificativa}
                                </p>
                              )}
                              {item.motivoRecusa && (
                                <p className="text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200 leading-relaxed">
                                  <span className="font-semibold text-red-900 block text-[11px] mb-0.5">
                                    Motivo da Recusa:
                                  </span>
                                  {item.motivoRecusa}
                                </p>
                              )}
                              {!item.justificativa && !item.motivoRecusa && (
                                <span className="text-slate-400 text-xs italic">Não informada</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ============================================================== */}
            {/* 2. VISÃO MOBILE & TABLET (Cards Responsivos Elegantes)         */}
            {/* ============================================================== */}
            <div className="block lg:hidden space-y-3">
              {registros.map((item) => {
                const alt = item.alteracao;
                const temAlteracao = alt && (alt.novoMin !== null || alt.novoMax !== null);
                const minSubiu = alt && alt.novoMin > alt.minAnterior;
                const maxSubiu = alt && alt.novoMax > alt.maxAnterior;

                return (
                  <Card
                    key={item.id}
                    className="p-3.5 sm:p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs"
                  >
                    {/* Topo do Card: Data/Hora e Badge de Ação */}
                    <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-100 flex-wrap">
                      <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{formatarDataHora(item.dataHora)}</span>
                      </div>
                      {renderBadgeAcao(item.tipoAcao)}
                    </div>

                    {/* Material */}
                    <div className="py-2.5">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="font-mono font-bold text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded text-xs border border-slate-200">
                          {item.item?.codigo || '---'}
                        </span>
                        {item.item?.categoria && (
                          <span className="text-[10px] text-slate-400 font-semibold uppercase">
                            {item.item.categoria}
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm font-semibold text-slate-800 leading-snug">
                        {item.item?.nome || 'Material'}
                      </h3>
                    </div>

                    {/* Usuário e Parâmetros */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 py-2.5 border-t border-slate-100">
                      {/* Usuário */}
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-semibold text-slate-800">
                            {item.usuario || 'Usuário'}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-medium">
                            {item.perfil}
                          </span>
                        </div>
                      </div>

                      {/* Parâmetros */}
                      {temAlteracao && (
                        <div className="bg-slate-50 p-2 rounded-lg border border-slate-150 flex flex-col gap-1 text-xs">
                          {/* Mínimo */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-bold uppercase text-[10px] w-8">
                              Mín:
                            </span>
                            <span className="text-slate-400 line-through">
                              {formatarNumero(alt.minAnterior)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className={`font-bold ${minSubiu ? 'text-red-700' : 'text-slate-800'}`}>
                              {formatarNumero(alt.novoMin)}
                            </span>
                            {minSubiu ? (
                              <TrendingUp className="w-3 h-3 text-red-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-blue-500" />
                            )}
                            <span className="text-[10px] text-slate-400">
                              {item.item?.unidade || ''}
                            </span>
                          </div>

                          {/* Máximo */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 font-bold uppercase text-[10px] w-8">
                              Máx:
                            </span>
                            <span className="text-slate-400 line-through">
                              {formatarNumero(alt.maxAnterior)}
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className={`font-bold ${maxSubiu ? 'text-amber-700' : 'text-slate-800'}`}>
                              {formatarNumero(alt.novoMax)}
                            </span>
                            {maxSubiu ? (
                              <TrendingUp className="w-3 h-3 text-amber-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-blue-500" />
                            )}
                            <span className="text-[10px] text-slate-400">
                              {item.item?.unidade || ''}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Justificativa / Parecer */}
                    {(item.justificativa || item.motivoRecusa) && (
                      <div className="pt-2 border-t border-slate-100 space-y-1.5">
                        {item.justificativa && (
                          <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200/80">
                            <span className="font-semibold text-slate-800 block text-[11px] mb-0.5">
                              Justificativa:
                            </span>
                            <p className="leading-relaxed">{item.justificativa}</p>
                          </div>
                        )}
                        {item.motivoRecusa && (
                          <div className="text-xs text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                            <span className="font-semibold text-red-900 block text-[11px] mb-0.5">
                              Motivo da Recusa:
                            </span>
                            <p className="leading-relaxed">{item.motivoRecusa}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>

            {/* Paginação Completa Responsiva */}
            <Paginacao
              paginaAtual={paginaAtual}
              totalItens={totalRegistros}
              itensPorPagina={itensPorPagina}
              onMudarPagina={setPaginaAtual}
              onMudarItensPorPagina={setItensPorPagina}
              opcoesItensPorPagina={[15, 25, 50]}
            />
          </div>
        )}
      </div>
    </div>
  );
}
