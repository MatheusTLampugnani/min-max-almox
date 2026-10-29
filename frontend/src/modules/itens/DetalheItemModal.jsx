import React, { useState } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { Modal } from '../../components/ui/Modal.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { formatarNumero, formatarData, formatarQuantidade } from '../../lib/formatters.js';
import { useAuth } from '../auth/useAuth.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { NovaSolicitacaoModal } from '../solicitacoes/NovaSolicitacaoModal.jsx';
import {
  Clock,
  TrendingDown,
  Layers,
  MapPin,
  Calendar,
  AlertTriangle,
  Edit2,
  Check,
  FileSpreadsheet,
  FileText
} from 'lucide-react';

function CustomTooltip({ active, payload, label, unidade }) {
  if (active && payload && payload.length) {
    const valor = payload[0].value;
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 text-xs">
        <p className="font-bold text-slate-300">Mês: {label}</p>
        <p className="text-sm font-extrabold text-white mt-0.5">
          {formatarNumero(valor)} <span className="text-slate-400 font-normal">{unidade}</span>
        </p>
      </div>
    );
  }
  return null;
}

export function DetalheItemModal({
  item,
  isOpen,
  onClose,
  onSalvarMinMax,
  onSolicitacaoEnviada
}) {
  const { isAlmoxarifado, isSupervisor } = useAuth();
  const { addToast } = useToast();

  const [modoEdicao, setModoEdicao] = useState(false);
  const [novoMin, setNovoMin] = useState('');
  const [novoMax, setNovoMax] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [erroValidacao, setErroValidacao] = useState('');

  // Modal para supervisor criar solicitação
  const [modalSolicitacaoAberto, setModalSolicitacaoAberto] = useState(false);

  if (!item) return null;

  function iniciarEdicao() {
    setNovoMin(item.min.toString());
    setNovoMax(item.max.toString());
    setErroValidacao('');
    setModoEdicao(true);
  }

  async function handleSalvar() {
    const minNum = Number(novoMin);
    const maxNum = Number(novoMax);

    if (isNaN(minNum) || isNaN(maxNum) || minNum < 0 || maxNum < 0) {
      setErroValidacao('Informe valores numéricos válidos e maiores ou iguais a zero.');
      return;
    }
    if (minNum >= maxNum) {
      setErroValidacao('A quantidade mínima deve ser menor que a máxima.');
      return;
    }

    try {
      setSalvando(true);
      await onSalvarMinMax(item.id, { min: minNum, max: maxNum });
      addToast('Parâmetros de estoque mínimo e máximo atualizados com sucesso.', 'sucesso');
      setModoEdicao(false);
    } catch (err) {
      setErroValidacao(err.message || 'Erro ao atualizar parâmetros.');
    } finally {
      setSalvando(false);
    }
  }

  const temDadosPlanilha = item.sugestaoMrpMin !== undefined && item.sugestaoMrpMin !== null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={item.nome}
        subtitle={`Código SAP: ${item.codigo} • Categoria: ${item.categoria}`}
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 text-left">
          {/* Bloco 1: KPIs Principais em Cards com Gradientes Sutis */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Situação */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Situação
              </span>
              <div className="mt-2">
                <Badge situacao={item.situacao} />
              </div>
            </div>

            {/* Saldo Atual */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Saldo em Estoque
              </span>
              <div className="mt-1">
                <span className="text-lg sm:text-xl font-black text-slate-800">
                  {formatarQuantidade(item.saldo, item.unidade)}
                </span>
              </div>
            </div>

            {/* Cobertura */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Cobertura Projetada
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-slate-800">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-base sm:text-lg font-bold">
                  {item.coberturaDias !== null ? `${formatarNumero(item.coberturaDias, 1)} dias` : 'Sem consumo'}
                </span>
              </div>
            </div>

            {/* Reposição */}
            <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Reposição Sugerida
              </span>
              <div className="mt-1 flex items-center gap-1.5">
                <TrendingDown className={`w-4 h-4 shrink-0 ${item.reposicaoSugerida > 0 ? 'text-red-600' : 'text-slate-400'}`} />
                <span
                  className={`text-base sm:text-lg font-bold ${item.reposicaoSugerida > 0 ? 'text-red-600' : 'text-slate-700'
                    }`}
                >
                  {item.reposicaoSugerida > 0
                    ? formatarQuantidade(item.reposicaoSugerida, item.unidade)
                    : 'Zero'}
                </span>
              </div>
            </div>
          </div>

          {/* Bloco 2: Localização e Faixas de Min/Máx Atuais com Ações por Perfil */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-4 sm:gap-6 text-sm text-slate-700">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-videplast-brand shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Localização Física no Almoxarifado:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {item.endereco || 'Sem endereço'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:pl-4 sm:border-l border-slate-200">
                  <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600 shrink-0">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs text-slate-400 block font-medium">Data do Último Consumo:</span>
                    <span className="font-bold text-slate-800 text-sm">
                      {item.ultimoConsumo || 'Sem registro'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Botões de Ação por Perfil */}
              <div className="flex items-center gap-2 shrink-0">
                {/* Almoxarifado: Ajuste Direto */}
                {isAlmoxarifado && !modoEdicao && (
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={iniciarEdicao}
                    className="shadow-xs"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>Alterar Mín / Máx Direto</span>
                  </Button>
                )}

                {/* Supervisor: Solicitar Alteração */}
                {isSupervisor && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setModalSolicitacaoAberto(true)}
                    className="shadow-xs"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Solicitar Alteração de Mín/Máx</span>
                  </Button>
                )}
              </div>
            </div>

            {modoEdicao ? (
              <div className="mt-4 p-4 bg-red-50/50 rounded-xl border border-red-200 animate-fadeIn">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-videplast-brand" />
                  Edição Direta de Mínimo e Máximo (Perfil Almoxarifado)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label={`Quantidade Mínima (${item.unidade})`}
                    type="number"
                    value={novoMin}
                    onChange={(e) => setNovoMin(e.target.value)}
                  />
                  <Input
                    label={`Quantidade Máxima (${item.unidade})`}
                    type="number"
                    value={novoMax}
                    onChange={(e) => setNovoMax(e.target.value)}
                  />
                </div>

                {erroValidacao && (
                  <p className="mt-2 text-xs text-red-600 font-semibold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {erroValidacao}
                  </p>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => setModoEdicao(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    loading={salvando}
                    onClick={handleSalvar}
                  >
                    <Check className="w-3.5 h-3.5" />
                    Confirmar Parâmetros
                  </Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div className="p-2.5 bg-slate-50/70 rounded-lg">
                  <span className="text-[11px] font-medium text-slate-400 block">Estoque Mínimo Atual</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatarQuantidade(item.min, item.unidade)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/70 rounded-lg">
                  <span className="text-[11px] font-medium text-slate-400 block">Estoque Máximo Atual</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatarQuantidade(item.max, item.unidade)}
                  </span>
                </div>
                <div className="p-2.5 bg-slate-50/70 rounded-lg">
                  <span className="text-[11px] font-medium text-slate-400 block">Média Mensal</span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatarQuantidade(item.mediaMensal, item.unidade)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Bloco 3: Dados Especiais da Planilha e Sugestão MRP */}
          {temDadosPlanilha && (
            <div className="bg-gradient-to-r from-purple-50/70 to-indigo-50/50 p-4 sm:p-5 rounded-xl border border-purple-200/80 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-6 h-6 rounded bg-purple-600 text-white flex items-center justify-center">
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs sm:text-sm font-bold text-purple-950 uppercase tracking-wider">
                  Sugestões MRP
                </h3>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Mínimo Sugerido MRP
                  </span>
                  <span className="text-sm font-bold text-purple-900">
                    {formatarQuantidade(
                      item.sugestaoMrpMin !== null && item.sugestaoMrpMin !== undefined
                        ? Math.round(Number(item.sugestaoMrpMin))
                        : null,
                      item.unidade
                    )}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Máximo Sugerido MRP
                  </span>
                  <span className="text-sm font-bold text-purple-900">
                    {formatarQuantidade(
                      item.sugestaoMrpMax !== null && item.sugestaoMrpMax !== undefined
                        ? Math.round(Number(item.sugestaoMrpMax))
                        : null,
                      item.unidade
                    )}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Consumo 12 Meses
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatarQuantidade(item.consumo12Meses, item.unidade)}
                  </span>
                </div>

                <div className="bg-white/80 p-2.5 rounded-lg border border-purple-100">
                  <span className="text-slate-500 block text-[10px] uppercase font-semibold">
                    Média 12 Meses (Planilha)
                  </span>
                  <span className="text-sm font-bold text-slate-800">
                    {formatarQuantidade(item.consumoMedioPlanilha, item.unidade)}/mês
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Bloco 4: Dashboard de Média de Consumo e Histórico */}
          <div className="bg-white p-4 sm:p-5 rounded-xl border border-slate-200/90 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <Calendar className="w-4 h-4 text-videplast-brand" />
                Média e Consumo Histórico dos Últimos 6 Meses
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                Média Mensal: <strong className="text-slate-800">{formatarQuantidade(item.mediaMensal, item.unidade)}/mês</strong>
              </span>
            </div>

            <div className="h-56 w-full mt-2">
              {item.historicoUltimos6Meses && item.historicoUltimos6Meses.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={item.historicoUltimos6Meses}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                    <XAxis
                      dataKey="mes"
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <YAxis
                      tick={{ fontSize: 11, fill: '#64748B' }}
                      axisLine={{ stroke: '#E2E8F0' }}
                    />
                    <Tooltip
                      content={<CustomTooltip unidade={item.unidade} />}
                    />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]}>
                      {item.historicoUltimos6Meses.map((entry, index) => {
                        const isUltimo = index === item.historicoUltimos6Meses.length - 1;
                        return (
                          <Cell
                            key={`cell-${index}`}
                            fill={isUltimo ? '#E31E2D' : '#64748B'}
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  Nenhum registro de consumo disponível.
                </div>
              )}
            </div>
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 mt-2">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-slate-500 inline-block" />
                Meses Anteriores (Tons Neutros)
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#E31E2D] inline-block" />
                Mês Atual (Destaque Videplast)
              </span>
            </div>
          </div>
        </div>
      </Modal>

      {/* Modal de Solicitação de Alteração exclusivo para Supervisão */}
      <NovaSolicitacaoModal
        item={item}
        isOpen={modalSolicitacaoAberto}
        onClose={() => setModalSolicitacaoAberto(false)}
        onSucesso={() => {
          setModalSolicitacaoAberto(false);
          if (onSolicitacaoEnviada) onSolicitacaoEnviada();
        }}
      />
    </>
  );
}
