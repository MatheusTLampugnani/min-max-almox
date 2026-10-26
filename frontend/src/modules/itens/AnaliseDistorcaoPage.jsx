import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Scale,
  Search,
  X,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Filter,
  Layers,
  ChevronRight,
  ArrowUpDown,
  Tag,
  MapPin,
  Sliders
} from 'lucide-react';
import { api } from '../../lib/api.js';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { SkeletonTabela } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Paginacao } from '../../components/ui/Paginacao.jsx';
import { DetalheItemModal } from './DetalheItemModal.jsx';
import { formatarNumero } from '../../lib/formatters.js';

export function AnaliseDistorcaoPage() {
  const { isAlmoxarifado } = useAuth();

  // Estados de filtros
  const [termo, setTermo] = useState('');
  const [categoria, setCategoria] = useState('');
  // Padrão: 'distorcidos' (materiais acima e abaixo de 0) conforme pedido pelo usuário
  const [abaDistorcao, setAbaDistorcao] = useState('distorcidos');

  // Estados de dados
  const [itens, setItens] = useState([]);
  const [listaCategorias, setListaCategorias] = useState([]);
  const [estatisticas, setEstatisticas] = useState({
    total: 0,
    distorcidos: 0,
    acimaZero: 0,
    abaixoZero: 0,
    alinhados: 0
  });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Carrega categorias industriais ativas
  useEffect(() => {
    let ativo = true;
    api.get('/itens/categorias')
      .then((res) => {
        if (ativo && res.data?.data) {
          setListaCategorias(res.data.data);
        }
      })
      .catch((err) => console.warn('Erro ao carregar categorias:', err));
    return () => { ativo = false; };
  }, []);

  // Paginação e Ordenação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(25);
  const [ordenacao, setOrdenacao] = useState({ coluna: 'distorcaoAbs', direcao: 'desc' });

  // Modal de Detalhe e Ajuste
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const inputBuscaRef = useRef(null);

  const carregarDados = async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {
        termo,
        categoria,
        distorcao: abaDistorcao
      };

      const resposta = await api.get('/itens/analise-distorcao', { params });
      const { estatisticas: stats, itens: lista } = resposta.data.data;
      setEstatisticas(stats || {});
      setItens(lista || []);
    } catch (err) {
      console.error('[ERRO ANALISE DISTORCAO]', err);
      setErro(err.response?.data?.erro || err.message || 'Erro ao carregar análise de distorções.');
    } finally {
      setCarregando(false);
    }
  };

  useEffect(() => {
    carregarDados();
  }, [categoria, abaDistorcao]);

  // Recalcula página 1 ao alterar filtros
  useEffect(() => {
    setPaginaAtual(1);
  }, [termo, categoria, abaDistorcao]);

  const dispararBuscaImediata = () => {
    carregarDados();
  };

  // Ordenação dos itens
  const handleOrdenar = (coluna) => {
    setOrdenacao((prev) => {
      if (prev.coluna === coluna) {
        return {
          coluna,
          direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
        };
      }
      return { coluna, direcao: 'desc' };
    });
  };

  const itensOrdenados = useMemo(() => {
    const lista = [...itens];
    const { coluna, direcao } = ordenacao;

    lista.sort((a, b) => {
      let valA = a[coluna];
      let valB = b[coluna];

      if (coluna === 'distorcaoAbs') {
        valA = Math.abs(a.distorcao || 0);
        valB = Math.abs(b.distorcao || 0);
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return direcao === 'asc' ? -1 : 1;
      if (valA > valB) return direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return lista;
  }, [itens, ordenacao]);

  const itensPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itensOrdenados.slice(inicio, inicio + itensPorPagina);
  }, [itensOrdenados, paginaAtual, itensPorPagina]);

  const handleSalvarMinMax = async (dados) => {
    if (!itemSelecionado) return;
    try {
      await api.patch(`/itens/${itemSelecionado.codigo}/min-max`, dados);
      carregarDados();
      setItemSelecionado(null);
    } catch (err) {
      throw err;
    }
  };

  return (
    <div className="w-full pb-12">
      {/* Navegação Secundária com Botão de Voltar */}
      <Navegacao modo="subpagina" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cabeçalho da Página */}
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-50 text-purple-700 border border-purple-200">
                <Scale className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Análise de Distorção MRP
              </h1>
            </div>
          </div>
        </div>

        {/* 4 Cards de Indicadores de Topo (KPIs) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
          {/* Card 1: Total com Distorção (≠ 0) */}
          <button
            type="button"
            onClick={() => setAbaDistorcao('distorcidos')}
            className={`p-4 rounded-xl text-left border transition-all shadow-xs ${abaDistorcao === 'distorcidos'
              ? 'bg-purple-50/80 border-purple-300 ring-2 ring-purple-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50/80'
              }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-purple-700">
              <span>Total c/ Distorção</span>
              <Scale className="w-4 h-4 text-purple-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-900 mt-1">
              {estatisticas.distorcidos || 0}
            </div>
            <span className="text-[11px] text-purple-600 font-medium">
              Acima ou abaixo de 0
            </span>
          </button>

          {/* Card 2: Acima de Zero (Sugestão > Atual) */}
          <button
            type="button"
            onClick={() => setAbaDistorcao('acima')}
            className={`p-4 rounded-xl text-left border transition-all shadow-xs ${abaDistorcao === 'acima'
              ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50/80'
              }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-blue-700">
              <span>Acima de Zero (&gt; 0)</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-blue-900 mt-1">
              {estatisticas.acimaZero || 0}
            </div>
            <span className="text-[11px] text-blue-600 font-medium">
              Sugestão maior que Atual
            </span>
          </button>

          {/* Card 3: Abaixo de Zero (Sugestão < Atual) */}
          <button
            type="button"
            onClick={() => setAbaDistorcao('abaixo')}
            className={`p-4 rounded-xl text-left border transition-all shadow-xs ${abaDistorcao === 'abaixo'
              ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50/80'
              }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-amber-700">
              <span>Abaixo de Zero (&lt; 0)</span>
              <TrendingDown className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-amber-900 mt-1">
              {estatisticas.abaixoZero || 0}
            </div>
            <span className="text-[11px] text-amber-600 font-medium">
              Superdimensionados
            </span>
          </button>

          {/* Card 4: Alinhados (Distorção = 0) */}
          <button
            type="button"
            onClick={() => setAbaDistorcao('alinhado')}
            className={`p-4 rounded-xl text-left border transition-all shadow-xs ${abaDistorcao === 'alinhado'
              ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50/80'
              }`}
          >
            <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-emerald-700">
              <span>Alinhados</span>
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-1">
              {estatisticas.alinhados || 0}
            </div>
            <span className="text-[11px] text-emerald-600 font-medium">
              Parâmetros sincronizados
            </span>
          </button>
        </div>

        {/* Barra de Filtros e Busca */}
        <Card className="p-3.5 sm:p-4 mb-6 bg-white border border-slate-200 shadow-xs">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Input de Busca */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                dispararBuscaImediata();
              }}
              className="relative flex-1"
            >
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputBuscaRef}
                type="text"
                value={termo}
                onChange={(e) => setTermo(e.target.value)}
                placeholder="Buscar por código, material ou localização..."
                className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white focus:bg-white focus:border-videplast-primary outline-none transition-colors"
              />
              {termo && (
                <button
                  type="button"
                  onClick={() => {
                    setTermo('');
                    setTimeout(carregarDados, 0);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  title="Limpar busca"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </form>

            {/* Filtro por Categoria */}
            <div className="flex items-center gap-2">
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 text-slate-700 font-medium focus:border-videplast-primary outline-none cursor-pointer max-w-[340px] truncate"
              >
                <option value="">Todas as Categorias ({estatisticas.total || 0})</option>
                {listaCategorias.map((cat) => (
                  <option key={cat.categoria} value={cat.categoria}>
                    {cat.categoria} ({cat.total} itens)
                  </option>
                ))}
              </select>

              {(termo || categoria) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setTermo('');
                    setCategoria('');
                    setTimeout(carregarDados, 0);
                  }}
                  className="text-slate-500 hover:text-videplast-primary text-xs"
                >
                  <X className="w-3.5 h-3.5" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Tabela de Análise Comparativa */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-3.5 sm:p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
            <div>
              <span className="text-xs sm:text-sm font-bold text-slate-800">
                Lista de Materiais para Análise
              </span>
              <span className="text-xs text-slate-500 ml-2">
                ({itens.length} {itens.length === 1 ? 'material encontrado' : 'materiais encontrados'})
              </span>
            </div>
            <div className="text-[11px] text-slate-400">
              * Distorção = Sugestão MRP Máximo − Estoque Máximo Atual
            </div>
          </div>

          {carregando ? (
            <div className="p-4">
              <SkeletonTabela linhas={8} />
            </div>
          ) : erro ? (
            <div className="p-8 text-center text-red-600 text-sm">
              <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p>{erro}</p>
              <Button variant="outline-primary" size="sm" onClick={carregarDados} className="mt-4">
                Tentar Novamente
              </Button>
            </div>
          ) : itens.length === 0 ? (
            <EmptyState
              title="Nenhum material encontrado para este filtro"
              description="Não foram encontrados materiais com as condições de distorção ou busca selecionadas."
              actionLabel="Ver Todos com Distorção"
              onAction={() => {
                setAbaDistorcao('distorcidos');
                setTermo('');
                setCategoria('');
              }}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm">
                <thead className="bg-slate-100/80 text-slate-600 font-bold uppercase tracking-wider text-[11px] border-b border-slate-200">
                  <tr>
                    <th
                      className="py-3 px-3.5 cursor-pointer hover:text-slate-900 select-none"
                      onClick={() => handleOrdenar('codigo')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Código / Material</span>
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5 text-right">Saldo Atual</th>
                    <th className="py-3 px-3.5 text-center">Parâmetros Atuais (Mín / Máx)</th>
                    <th className="py-3 px-3.5 text-center">Sugestão MRP (Mín / Máx)</th>
                    <th
                      className="py-3 px-3.5 text-center cursor-pointer hover:text-purple-700 select-none bg-purple-50/50"
                      onClick={() => handleOrdenar('distorcaoAbs')}
                    >
                      <div className="flex items-center justify-center gap-1 text-purple-900 font-black">
                        <span>Distorção</span>
                        <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                      </div>
                    </th>
                    <th className="py-3 px-3.5 text-center">Diagnóstico / Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {itensPaginados.map((item) => {
                    const dist = item.distorcao || 0;
                    const ehAcima = dist > 0;
                    const ehAbaixo = dist < 0;

                    return (
                      <tr
                        key={item.codigo}
                        onClick={() => setItemSelecionado(item)}
                        className="hover:bg-purple-50/30 transition-colors cursor-pointer group"
                      >
                        {/* Código e Nome */}
                        <td className="py-3 px-3.5 align-middle">
                          <div className="font-mono text-xs font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded w-fit mb-1">
                            {item.codigo}
                          </div>
                          <div className="font-bold text-slate-800 text-xs sm:text-sm group-hover:text-videplast-brand transition-colors">
                            {item.nome}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                            <span>{item.categoria}</span>
                            <span>•</span>
                            <span className="flex items-center gap-0.5 font-mono">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              {item.endereco}
                            </span>
                          </div>
                        </td>

                        {/* Saldo Atual */}
                        <td className="py-3 px-3.5 text-right font-bold text-slate-700 align-middle whitespace-nowrap">
                          {formatarNumero(item.saldo)} {item.unidade}
                        </td>

                        {/* Parâmetros Atuais */}
                        <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-xs font-semibold border border-slate-200">
                            <span>Mín: <strong>{formatarNumero(item.min)}</strong></span>
                            <span className="text-slate-300">|</span>
                            <span>Máx: <strong>{formatarNumero(item.max)}</strong></span>
                          </span>
                        </td>

                        {/* Sugestão MRP */}
                        <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 text-xs font-semibold border border-purple-200">
                            <span>Mín: <strong>{formatarNumero(item.sugestaoMrpMin)}</strong></span>
                            <span className="text-purple-300">|</span>
                            <span>Máx: <strong>{formatarNumero(item.sugestaoMrpMax)}</strong></span>
                          </span>
                        </td>

                        {/* Distorção Destacada */}
                        <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap bg-purple-50/20">
                          {ehAcima ? (
                            <span className="inline-flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-800 border border-blue-200 shadow-2xs">
                              <TrendingUp className="w-3.5 h-3.5 text-blue-600" />
                              <span>+{formatarNumero(dist)}</span>
                            </span>
                          ) : ehAbaixo ? (
                            <span className="inline-flex items-center gap-1 font-black text-xs px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200 shadow-2xs">
                              <TrendingDown className="w-3.5 h-3.5 text-red-600" />
                              <span>{formatarNumero(dist)}</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 font-bold text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              <span>0 (Alinhado)</span>
                            </span>
                          )}
                        </td>

                        {/* Diagnóstico / Ação */}
                        <td className="py-3 px-3.5 text-center align-middle whitespace-nowrap">
                          <div className="flex items-center justify-center gap-2">
                            {ehAcima ? (
                              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded border border-blue-200">
                                Sugestão maior (Aumentar)
                              </span>
                            ) : ehAbaixo ? (
                              <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-1 rounded border border-amber-200">
                                Superdimensionado (Reduzir)
                              </span>
                            ) : (
                              <span className="text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                                Calibrado
                              </span>
                            )}

                            {isAlmoxarifado && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setItemSelecionado(item);
                                }}
                                className="text-purple-700 hover:text-purple-900 hover:bg-purple-100/60 p-1.5"
                                title="Ajustar parâmetros Mín/Máx"
                              >
                                <Sliders className="w-3.5 h-3.5" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Paginação */}
          {!carregando && itens.length > 0 && (
            <div className="p-3.5 sm:p-4 border-t border-slate-100">
              <Paginacao
                paginaAtual={paginaAtual}
                totalItens={itens.length}
                itensPorPagina={itensPorPagina}
                onMudarPagina={(p) => setPaginaAtual(p)}
                onMudarItensPorPagina={(qtd) => {
                  setItensPorPagina(qtd);
                  setPaginaAtual(1);
                }}
                opcoesItensPorPagina={[15, 25, 50, 100]}
              />
            </div>
          )}
        </div>
      </div>

      {/* Modal de Detalhes e Ajuste de Mín/Máx */}
      {itemSelecionado && (
        <DetalheItemModal
          item={itemSelecionado}
          isOpen={Boolean(itemSelecionado)}
          onClose={() => setItemSelecionado(null)}
          onSalvarMinMax={handleSalvarMinMax}
        />
      )}
    </div>
  );
}
