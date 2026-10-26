import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { useDashboard } from './useDashboard.js';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Skeleton } from '../../components/ui/Skeleton.jsx';
import { DetalheItemModal } from '../itens/DetalheItemModal.jsx';
import { formatarNumero } from '../../lib/formatters.js';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Clock,
  RefreshCw,
  ShieldAlert,
  ChevronRight,
  Flame,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

function DonutCustomTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-slate-900 text-white px-3 py-2 rounded-lg shadow-xl border border-slate-700 text-xs">
        <p className="font-bold flex items-center gap-1.5" style={{ color: data.payload.cor }}>
          <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: data.payload.cor }} />
          {data.name}
        </p>
        <p className="text-sm font-extrabold text-white mt-1">
          {formatarNumero(data.value)} materiais{' '}
          <span className="text-slate-400 font-normal">({data.payload.percentual}%)</span>
        </p>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const { isAlmoxarifado } = useAuth();
  const { metricas, categoria, setCategoria, carregando, erro, recarregar } = useDashboard();
  const { addToast } = useToast();

  const [abaAtiva, setAbaAtiva] = useState('criticos'); // 'criticos' | 'excesso'
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [modoVisualizacaoCat, setModoVisualizacaoCat] = useState('top10'); // 'top10' | 'top15' | 'todas'

  // Abertura do modal ao clicar em item crítico ou em excesso
  async function abrirItem(itemResumo) {
    try {
      const res = await api.get(`/itens/${itemResumo.id}`);
      setItemSelecionado(res.data.data);
      setModalAberto(true);
    } catch (err) {
      addToast('Erro ao carregar detalhes completos do material.', 'erro');
    }
  }

  async function handleSalvarMinMax(id, novosValores) {
    try {
      await api.patch(`/itens/${id}/min-max`, novosValores);
      addToast('Mínimo e máximo atualizados com sucesso!', 'sucesso');
      setModalAberto(false);
      setItemSelecionado(null);
      recarregar();
    } catch (err) {
      addToast(err.message || 'Erro ao atualizar parâmetros.', 'erro');
      throw err;
    }
  }

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
            O painel analítico do Dashboard é restrito aos gestores e equipe do Almoxarifado Central.
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

  const kpis = metricas?.kpis || {};
  const distribuicaoStatus = metricas?.distribuicaoStatus || [];
  const categoriasDados = metricas?.consumoPorCategoria || [];
  const topConsumidos = metricas?.topConsumidos || [];
  const itensCriticos = metricas?.itensCriticos || [];
  const itensExcesso = metricas?.itensExcesso || [];

  // Agrupamento para gráfico de categorias limpo e legível (Top 10 / 15 + Outras)
  const dadosGraficoCategorias = useMemo(() => {
    if (!categoriasDados || categoriasDados.length === 0) return [];
    const limite = modoVisualizacaoCat === 'top15' ? 15 : 10;
    if (categoriasDados.length <= limite) return categoriasDados;

    const top = categoriasDados.slice(0, limite);
    const restantes = categoriasDados.slice(limite);
    const totalRestantes = restantes.reduce((acc, c) => acc + (c.totalItens || 0), 0);
    const abaixoRestantes = restantes.reduce((acc, c) => acc + (c.abaixo || 0), 0);
    const normalRestantes = restantes.reduce((acc, c) => acc + (c.normal || 0), 0);
    const acimaRestantes = restantes.reduce((acc, c) => acc + (c.acima || 0), 0);

    return [
      ...top,
      {
        categoria: `Outras (+${restantes.length})`,
        totalItens: totalRestantes,
        abaixo: abaixoRestantes,
        normal: normalRestantes,
        acima: acimaRestantes,
        isOutras: true
      }
    ];
  }, [categoriasDados, modoVisualizacaoCat]);

  return (
    <div className="w-full pb-12">
      {/* Navegação Secundária com Voltar à Consulta */}
      <Navegacao modo="subpagina" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho do Dashboard Totalmente Responsivo */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-800 tracking-tight">
                Dashboard de Gestão de Estoque Mín/Máx
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-videplast-primary border border-red-200">
                MRP Videplast
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Visão analítica em tempo real sobre cobertura, reposição e equilíbrio de estoque.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Seletor de Categoria Dinâmico */}
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm rounded-lg border border-slate-200 bg-white px-3 py-2 text-slate-700 font-medium focus:border-videplast-primary outline-none transition-colors shadow-xs cursor-pointer max-w-[340px] truncate"
            >
              <option value="">Todas as Categorias ({kpis.totalMateriais || 0})</option>
              {categoriasDados.map((opt) => (
                <option key={opt.categoria} value={opt.categoria}>
                  {opt.categoria} ({opt.totalItens} itens)
                </option>
              ))}
            </select>

            {/* Botão Atualizar */}
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={recarregar}
              disabled={carregando}
              className="text-slate-600 bg-white shrink-0"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </Button>
          </div>
        </div>

        {/* Grade de Cards de KPIs (Totalmente Responsiva) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4 mb-6">
          {/* Total Monitorado */}
          <Card className="p-3 sm:p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider truncate">
                Total Monitorado
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                <Package className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
              {carregando ? <Skeleton className="h-7 w-16" /> : formatarNumero(kpis.totalMateriais || 0)}
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-slate-500 font-medium">
              <span>Planilha MRP</span>
            </div>
          </Card>

          {/* Abaixo do Mínimo */}
          <Card className="p-3 sm:p-4 bg-white border border-red-200 hover:border-red-300 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-red-600 uppercase tracking-wider truncate">
                Abaixo Mínimo
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-red-600 tracking-tight flex items-baseline gap-1">
              {carregando ? <Skeleton className="h-7 w-16" /> : formatarNumero(kpis.abaixoMinimo || 0)}
              <span className="text-[11px] sm:text-xs font-bold text-red-500">
                ({kpis.percentualAbaixo || 0}%)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-red-600 font-medium">
              <span>Risco de Ruptura</span>
            </div>
          </Card>

          {/* Estoque Normal / Conforme */}
          <Card className="p-3 sm:p-4 bg-white border border-green-200 hover:border-green-300 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-green-700 uppercase tracking-wider truncate">
                Conforme
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-green-700 tracking-tight flex items-baseline gap-1">
              {carregando ? <Skeleton className="h-7 w-16" /> : formatarNumero(kpis.estoqueNormal || 0)}
              <span className="text-[11px] sm:text-xs font-bold text-green-600">
                ({kpis.percentualNormal || 0}%)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-green-700 font-medium">
              <span>Faixa Ideal</span>
            </div>
          </Card>

          {/* Acima do Máximo */}
          <Card className="p-3 sm:p-4 bg-white border border-amber-200 hover:border-amber-300 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase tracking-wider truncate">
                Acima Máximo
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-amber-700 tracking-tight flex items-baseline gap-1">
              {carregando ? <Skeleton className="h-7 w-16" /> : formatarNumero(kpis.acimaMaximo || 0)}
              <span className="text-[11px] sm:text-xs font-bold text-amber-600">
                ({kpis.percentualAcima || 0}%)
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1.5 text-[10px] sm:text-[11px] text-amber-700 font-medium">
              <span>Capital Parado</span>
            </div>
          </Card>

          {/* Cobertura Crítica (<30d) */}
          <Card className="col-span-2 sm:col-span-1 lg:col-span-1 p-3 sm:p-4 bg-white border border-slate-200 hover:border-slate-300 transition-all shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase tracking-wider truncate">
                Cobertura &lt; 30d
              </span>
              <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center shrink-0">
                <Clock className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-lg sm:text-2xl font-black text-orange-600 tracking-tight">
              {carregando ? <Skeleton className="h-7 w-16" /> : formatarNumero(kpis.coberturaCritica || 0)}
            </div>
            <div className="mt-1 flex items-center justify-between text-[10px] sm:text-[11px] text-slate-500 font-medium">
              <span>{kpis.solicitacoesPendentes || 0} solic. pendentes</span>
              <Link to="/solicitacoes" className="text-videplast-primary hover:underline font-bold">
                Ver
              </Link>
            </div>
          </Card>
        </div>

        {/* Seção de Gráficos Analíticos */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
          {/* Gráfico 1: Distribuição de Status (Donut Chart) */}
          <Card className="lg:col-span-5 p-4 sm:p-5 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-bold text-slate-800">
                  Distribuição de Status do Estoque
                </h3>
                <span className="text-[11px] text-slate-400 font-semibold">100% da base</span>
              </div>
              <p className="text-xs text-slate-500 mb-3">
                Proporção de materiais abaixo do mínimo, na faixa e excedentes.
              </p>
            </div>

            <div className="h-60 sm:h-64 relative flex items-center justify-center">
              {carregando ? (
                <Skeleton className="w-44 h-44 rounded-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={distribuicaoStatus}
                      dataKey="valor"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={3}
                    >
                      {distribuicaoStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.cor} stroke="#fff" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip content={<DonutCustomTooltip />} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Legenda Customizada */}
            <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-100 text-center">
              {distribuicaoStatus.map((s) => (
                <div key={s.name} className="flex flex-col items-center">
                  <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-semibold text-slate-600">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: s.cor }} />
                    <span className="truncate">{s.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm font-black text-slate-800 mt-0.5">
                    {formatarNumero(s.valor)}
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    {s.percentual}%
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Gráfico 2: Quantidade de Materiais por Categoria */}
          {/* Gráfico 2: Quantidade de Materiais por Categoria */}
          <Card className="lg:col-span-7 p-4 sm:p-5 bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1">
                <div>
                  <h3 className="text-sm font-bold text-slate-800">
                    Materiais por Categoria Industrial
                  </h3>
                  <p className="text-xs text-slate-500">
                    Agrupamento produtivo dos {formatarNumero(kpis.totalMateriais || 0)} materiais monitorados.
                  </p>
                </div>

                {/* Controles de Visualização: Top 10, Top 15, Todas em Lista */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-xs self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setModoVisualizacaoCat('top10')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] ${
                      modoVisualizacaoCat === 'top10'
                        ? 'bg-white text-videplast-primary shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 10
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVisualizacaoCat('top15')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] ${
                      modoVisualizacaoCat === 'top15'
                        ? 'bg-white text-videplast-primary shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Top 15
                  </button>
                  <button
                    type="button"
                    onClick={() => setModoVisualizacaoCat('todas')}
                    className={`px-2.5 py-1 rounded-md font-bold transition-all text-[11px] ${
                      modoVisualizacaoCat === 'todas'
                        ? 'bg-white text-videplast-primary shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Todas ({categoriasDados.length})
                  </button>
                </div>
              </div>
            </div>

            <div className="h-64 sm:h-72 mt-2">
              {carregando ? (
                <Skeleton className="w-full h-full rounded-lg" />
              ) : modoVisualizacaoCat === 'todas' ? (
                /* Modo Lista Completa Scrollável para todas as 69+ categorias */
                <div className="h-full overflow-y-auto pr-1 space-y-1 divide-y divide-slate-100 border border-slate-100 rounded-lg p-2 bg-slate-50/50">
                  {categoriasDados.map((cat, idx) => (
                    <div
                      key={cat.categoria}
                      onClick={() => setCategoria(cat.categoria)}
                      className="pt-1.5 first:pt-0 flex items-center justify-between text-xs hover:bg-white hover:shadow-xs p-1.5 rounded-md transition-all cursor-pointer group"
                      title={`Filtrar por ${cat.categoria}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-md bg-slate-200 text-slate-700 font-bold text-[10px] flex items-center justify-center font-mono">
                          #{idx + 1}
                        </span>
                        <div>
                          <span className="font-mono font-bold text-slate-800 group-hover:text-videplast-primary transition-colors">
                            {cat.categoria}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="hidden sm:flex items-center gap-1.5 text-[10px] font-mono">
                          {cat.abaixo > 0 && (
                            <span className="bg-red-50 text-red-700 border border-red-200 px-1.5 py-0.5 rounded font-bold" title="Abaixo do Mínimo">
                              {cat.abaixo} crít
                            </span>
                          )}
                          {cat.normal > 0 && (
                            <span className="bg-green-50 text-green-700 border border-green-200 px-1.5 py-0.5 rounded font-bold" title="Estoque Conforme">
                              {cat.normal} conf
                            </span>
                          )}
                          {cat.acima > 0 && (
                            <span className="bg-amber-50 text-amber-700 border border-amber-200 px-1.5 py-0.5 rounded font-bold" title="Acima do Máximo">
                              {cat.acima} exc
                            </span>
                          )}
                        </div>
                        <span className="font-extrabold text-slate-900 bg-white border border-slate-200 px-2 py-0.5 rounded-md text-[11px] shadow-xs">
                          {cat.totalItens} materiais
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Modo Gráfico de Barras Limpo (Top 10 ou Top 15 + Outras) */
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={dadosGraficoCategorias}
                    margin={{ top: 10, right: 10, left: -20, bottom: 45 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="categoria"
                      tick={{ fill: '#475569', fontSize: 10, fontWeight: 700 }}
                      interval={0}
                      angle={-30}
                      textAnchor="end"
                      height={50}
                      tickLine={false}
                      tickFormatter={(val) => {
                        if (!val) return '';
                        if (val.startsWith('Outras')) return val;
                        return val.length > 20 ? val.substring(0, 18) + '…' : val;
                      }}
                    />
                    <YAxis tick={{ fill: '#64748B', fontSize: 11 }} tickLine={false} />
                    <Tooltip
                      content={({ active, payload, label }) => {
                        if (!active || !payload || !payload.length) return null;
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1.5 border border-slate-700">
                            <div className="font-bold text-slate-100 border-b border-slate-700/80 pb-1 flex items-center justify-between gap-4">
                              <span>Categoria: {label}</span>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {d.totalItens} materiais
                              </span>
                            </div>
                            <div className="space-y-0.5 text-[11px]">
                              {d.abaixo > 0 && (
                                <div className="flex items-center justify-between gap-4 text-red-400">
                                  <span>• Abaixo do Mínimo:</span>
                                  <strong className="font-mono">{d.abaixo}</strong>
                                </div>
                              )}
                              {d.normal > 0 && (
                                <div className="flex items-center justify-between gap-4 text-emerald-400">
                                  <span>• Conforme:</span>
                                  <strong className="font-mono">{d.normal}</strong>
                                </div>
                              )}
                              {d.acima > 0 && (
                                <div className="flex items-center justify-between gap-4 text-amber-400">
                                  <span>• Acima do Máximo:</span>
                                  <strong className="font-mono">{d.acima}</strong>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                    <Bar dataKey="totalItens" radius={[4, 4, 0, 0]} barSize={26}>
                      {dadosGraficoCategorias.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={entry.isOutras ? '#94A3B8' : '#DC3545'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Rodapé do Gráfico */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-videplast-primary inline-block" />
                <span className="font-medium text-slate-600">Planilha MRP Videplast</span>
              </span>
              <span className="font-semibold text-slate-700">
                {categoriasDados.length} categorias cadastradas
              </span>
            </div>
          </Card>
        </div>

        {/* Ranking: Top Materiais Mais Consumidos da Fábrica */}
        <Card className="p-4 sm:p-5 bg-white border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-lg bg-red-100 text-videplast-primary flex items-center justify-center shrink-0">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                Top 8 Materiais de Maior Consumo Médio Mensal
              </h3>
              <p className="text-xs text-slate-500">
                Itens com maior giro fabril calculado diretamente da planilha.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {topConsumidos.map((item, idx) => (
              <div
                key={item.id}
                onClick={() => abrirItem(item)}
                className="p-3 rounded-lg border border-slate-200 hover:border-red-300 hover:bg-red-50/20 transition-all cursor-pointer group flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 font-bold text-[10px] flex items-center justify-center">
                      #{idx + 1}
                    </span>
                    <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      {item.codigo}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 group-hover:text-videplast-primary transition-colors">
                    {item.nome}
                  </h4>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Consumo Mensal:</span>
                  <span className="font-bold text-slate-900">
                    {formatarNumero(item.consumoMensal)}{' '}
                    <span className="text-slate-500 font-normal">{item.unidade}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Tabelas de Ação Rápida com Abas: Reposição Urgente vs Excesso de Estoque */}
        <Card className="bg-white border border-slate-200 shadow-xs overflow-hidden">
          {/* Cabeçalho das Abas */}
          <div className="border-b border-slate-200 px-3 sm:px-6 pt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/60">
            <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setAbaAtiva('criticos')}
                className={`
                  pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0
                  ${
                    abaAtiva === 'criticos'
                      ? 'border-red-600 text-red-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }
                `}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Reposição Urgente ({kpis.abaixoMinimo || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setAbaAtiva('excesso')}
                className={`
                  pb-3 px-2 sm:px-3 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-1.5 shrink-0
                  ${
                    abaAtiva === 'excesso'
                      ? 'border-amber-600 text-amber-600'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }
                `}
              >
                <TrendingUp className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                <span>Excesso de Estoque ({kpis.acimaMaximo || 0})</span>
              </button>
            </div>

            <span className="text-[11px] text-slate-400 font-medium pb-2 sm:pb-0 hidden md:inline">
              Clique em qualquer item para abrir parâmetros e histórico
            </span>
          </div>

          {/* ============================================================== */}
          {/* 1. VISÃO DESKTOP (Tabela Completa)                             */}
          {/* ============================================================== */}
          <div className="hidden md:block p-0 overflow-x-auto">
            {abaAtiva === 'criticos' ? (
              <table className="w-full text-left text-xs sm:text-sm min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código SAP</th>
                    <th className="py-3 px-4">Descrição do Material</th>
                    <th className="py-3 px-4 text-right">Saldo Atual</th>
                    <th className="py-3 px-4 text-right">Mínimo</th>
                    <th className="py-3 px-4 text-right">Reposição Sugerida</th>
                    <th className="py-3 px-4 text-center">Cobertura</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itensCriticos.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => abrirItem(item)}
                      className="hover:bg-red-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-xs sm:max-w-md">
                          <span className="font-medium text-slate-800 truncate" title={item.nome}>
                            {item.nome}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {item.categoria}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-red-600 whitespace-nowrap">
                        {formatarNumero(item.saldo)} {item.unidade}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatarNumero(item.min)} {item.unidade}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-extrabold text-videplast-primary bg-red-50 px-2 py-0.5 rounded border border-red-200">
                          +{formatarNumero(item.reposicaoSugerida)} {item.unidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="text-xs font-bold text-red-700 bg-red-100/70 px-2 py-0.5 rounded-full">
                          {item.coberturaDias !== null ? `${item.coberturaDias} dias` : 'Crítica'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirItem(item);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-videplast-primary hover:text-videplast-primary-hover hover:underline"
                        >
                          <span>Ajustar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-left text-xs sm:text-sm min-w-[760px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Código SAP</th>
                    <th className="py-3 px-4">Descrição do Material</th>
                    <th className="py-3 px-4 text-right">Saldo Atual</th>
                    <th className="py-3 px-4 text-right">Máximo Cadastrado</th>
                    <th className="py-3 px-4 text-right">Excedente Parado</th>
                    <th className="py-3 px-4 text-center">Cobertura</th>
                    <th className="py-3 px-4 text-center">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itensExcesso.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => abrirItem(item)}
                      className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {item.codigo}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex flex-col max-w-xs sm:max-w-md">
                          <span className="font-medium text-slate-800 truncate" title={item.nome}>
                            {item.nome}
                          </span>
                          <span className="text-[10px] text-slate-400 uppercase font-semibold">
                            {item.categoria}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-amber-700 whitespace-nowrap">
                        {formatarNumero(item.saldo)} {item.unidade}
                      </td>
                      <td className="py-3 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatarNumero(item.max)} {item.unidade}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          +{formatarNumero(item.excesso)} {item.unidade}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className="text-xs font-bold text-amber-800 bg-amber-100/70 px-2 py-0.5 rounded-full">
                          {item.coberturaDias !== null ? `${item.coberturaDias} dias` : 'Elevada'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            abrirItem(item);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700 hover:text-videplast-primary hover:underline"
                        >
                          <span>Ajustar</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* ============================================================== */}
          {/* 2. VISÃO MOBILE (Cards de Ação Rápida para Celular/Tablet)      */}
          {/* ============================================================== */}
          <div className="block md:hidden p-3 divide-y divide-slate-100">
            {abaAtiva === 'criticos'
              ? itensCriticos.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => abrirItem(item)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.codigo}
                      </span>
                      <span className="text-[11px] font-bold text-red-700 bg-red-100/80 px-2 py-0.5 rounded-full">
                        {item.coberturaDias !== null ? `${item.coberturaDias} dias` : 'Crítica'}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2">
                      {item.nome}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg text-xs mb-2">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Saldo Atual:</span>
                        <span className="font-black text-red-600">
                          {formatarNumero(item.saldo)} {item.unidade}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Mínimo:</span>
                        <span className="font-semibold text-slate-700">
                          {formatarNumero(item.min)} {item.unidade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-extrabold text-videplast-primary bg-red-50 px-2 py-0.5 rounded border border-red-200">
                        Reposição: +{formatarNumero(item.reposicaoSugerida)} {item.unidade}
                      </span>
                      <span className="text-videplast-primary font-bold flex items-center gap-0.5">
                        Ajustar <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))
              : itensExcesso.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => abrirItem(item)}
                    className="py-3 first:pt-0 last:pb-0 cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.codigo}
                      </span>
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                        {item.coberturaDias !== null ? `${item.coberturaDias} dias` : 'Elevada'}
                      </span>
                    </div>

                    <h4 className="text-xs font-semibold text-slate-800 line-clamp-2 mb-2">
                      {item.nome}
                    </h4>

                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg text-xs mb-2">
                      <div>
                        <span className="text-slate-400 text-[10px] block">Saldo Atual:</span>
                        <span className="font-black text-amber-700">
                          {formatarNumero(item.saldo)} {item.unidade}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 text-[10px] block">Máximo:</span>
                        <span className="font-semibold text-slate-700">
                          {formatarNumero(item.max)} {item.unidade}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-extrabold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Excedente: +{formatarNumero(item.excesso)} {item.unidade}
                      </span>
                      <span className="text-slate-700 font-bold flex items-center gap-0.5">
                        Ajustar <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                ))}
          </div>
        </Card>
      </div>

      {/* Modal de Detalhe e Parametrização Mín/Máx */}
      {modalAberto && itemSelecionado && (
        <DetalheItemModal
          item={itemSelecionado}
          isOpen={modalAberto}
          onClose={() => {
            setModalAberto(false);
            setItemSelecionado(null);
          }}
          onSalvarMinMax={handleSalvarMinMax}
        />
      )}
    </div>
  );
}
