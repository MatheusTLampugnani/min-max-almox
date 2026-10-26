import React, { useRef, useEffect } from 'react';
import { Search, X, Filter, Clock, MapPin, Eye, AlertCircle, ChevronRight, Layers, Tag, FileSpreadsheet, UploadCloud } from 'lucide-react';
import { useItens } from './useItens.js';
import { BarraEstoque } from './BarraEstoque.jsx';
import { CardsResumoEstoque } from './CardsResumoEstoque.jsx';
import { DetalheItemModal } from './DetalheItemModal.jsx';
import { ModalImportarPlanilha } from './ModalImportarPlanilha.jsx';
import { useAuth } from '../auth/useAuth.jsx';
import { Navegacao } from '../../components/layout/Navegacao.jsx';
import { Badge } from '../../components/ui/Badge.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Card } from '../../components/ui/Card.jsx';
import { DataTable } from '../../components/ui/DataTable.jsx';
import { SkeletonTabela } from '../../components/ui/Skeleton.jsx';
import { EmptyState } from '../../components/ui/EmptyState.jsx';
import { Paginacao } from '../../components/ui/Paginacao.jsx';
import { formatarNumero, formatarQuantidade } from '../../lib/formatters.js';
import { api } from '../../lib/api.js';

const SITUACOES_FILTRO = [
  { valor: '', label: 'Todas as Situações' },
  { valor: 'abaixo', label: 'Abaixo do Mínimo' },
  { valor: 'dentro', label: 'Dentro da Faixa' },
  { valor: 'acima', label: 'Acima do Máximo' }
];

export function ConsultaPage() {
  const {
    itens,
    totalItens,
    carregando,
    erro,
    termoBusca,
    setTermoBusca,
    categoria,
    situacao,
    handleSelecionarCategoria,
    handleSelecionarSituacao,
    dispararBuscaImediata,
    limparFiltros,
    itemSelecionado,
    abrirDetalhe,
    fecharDetalhe,
    atualizarMinMax,
    ordenacao,
    handleOrdenar,
    recarregar
  } = useItens();

  const { isAlmoxarifado } = useAuth();
  const [modalImportarAberto, setModalImportarAberto] = React.useState(false);
  const [paginaAtual, setPaginaAtual] = React.useState(1);
  const [itensPorPagina, setItensPorPagina] = React.useState(25);
  const [listaCategorias, setListaCategorias] = React.useState([]);
  const inputBuscaRef = useRef(null);

  // Carrega lista dinâmica de categorias para o filtro
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

  // Reseta para a página 1 sempre que a busca, categoria ou situação mudarem
  useEffect(() => {
    setPaginaAtual(1);
  }, [termoBusca, categoria, situacao]);

  const itensPaginados = React.useMemo(() => {
    const inicio = (paginaAtual - 1) * itensPorPagina;
    return itens.slice(inicio, inicio + itensPorPagina);
  }, [itens, paginaAtual, itensPorPagina]);

  const handleMudarPagina = (novaPagina) => {
    setPaginaAtual(novaPagina);
    const secao = document.getElementById('secao-tabela-materiais');
    if (secao) {
      secao.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleMudarItensPorPagina = (novaQtd) => {
    setItensPorPagina(novaQtd);
    setPaginaAtual(1);
  };

  useEffect(() => {
    if (inputBuscaRef.current) {
      inputBuscaRef.current.focus();
    }
  }, []);

  // Definição das colunas estilizadas para a tabela desktop
  const colunas = [
    {
      campo: 'codigo',
      titulo: 'Código',
      ordenavel: true,
      className: 'w-32',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100/90 border border-slate-200/60 px-2.5 py-1 rounded-md shadow-xs">
          {item.codigo}
        </span>
      )
    },
    {
      campo: 'nome',
      titulo: 'Material',
      ordenavel: true,
      render: (item) => (
        <div className="py-0.5">
          <div className="font-bold text-slate-800 text-sm group-hover:text-videplast-brand transition-colors flex items-center gap-1.5">
            {item.nome}
          </div>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[11px] font-medium text-slate-400 flex items-center gap-1">
              <Tag className="w-3 h-3 text-slate-400" />
              {item.categoria}
            </span>
          </div>
        </div>
      )
    },
    {
      campo: 'endereco',
      titulo: 'Endereço Físico',
      ordenavel: true,
      className: 'w-44',
      render: (item) => (
        <span className="text-xs font-medium text-slate-600 flex items-center gap-1.5 bg-slate-50 border border-slate-200/50 px-2 py-1 rounded w-fit">
          <MapPin className="w-3.5 h-3.5 text-videplast-primary shrink-0" />
          {item.endereco}
        </span>
      )
    },
    {
      campo: 'saldo',
      titulo: 'Mínimo / Máximo',
      ordenavel: true,
      className: 'w-56',
      render: (item) => (
        <BarraEstoque
          saldo={item.saldo}
          min={item.min}
          max={item.max}
          unidade={item.unidade}
          situacao={item.situacao}
        />
      )
    },
    {
      campo: 'coberturaDias',
      titulo: 'Cobertura',
      ordenavel: true,
      className: 'w-28 text-center',
      tdClassName: 'text-center',
      render: (item) => (
        <span
          className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${item.coberturaDias !== null && item.coberturaDias < 15
            ? 'bg-red-50 text-red-700 border border-red-200'
            : 'text-slate-700 bg-slate-100'
            }`}
        >
          <Clock className="w-3 h-3 text-slate-400" />
          {item.coberturaDias !== null
            ? `${formatarNumero(item.coberturaDias, 1)} d`
            : '-'}
        </span>
      )
    },
    {
      campo: 'situacao',
      titulo: 'Situação',
      ordenavel: true,
      className: 'w-44 text-right',
      tdClassName: 'text-right',
      render: (item) => <Badge situacao={item.situacao} />
    },
    {
      campo: 'acoes',
      titulo: '',
      className: 'w-10 text-center',
      tdClassName: 'text-center',
      render: () => (
        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-videplast-brand group-hover:translate-x-0.5 transition-all" />
      )
    }
  ];

  // Card Mobile elegante estilo etiqueta de almoxarifado industrial
  const renderCardMobile = (item) => (
    <Card
      hoverable
      className="p-4 transition-all border border-slate-200/90 shadow-sm active:scale-[0.99] relative overflow-hidden"
    >
      {/* Faixa decorativa lateral por situação */}
      <div
        className={`absolute top-0 left-0 bottom-0 w-1.5 ${item.situacao === 'abaixo'
          ? 'bg-red-600'
          : item.situacao === 'acima'
            ? 'bg-amber-400'
            : 'bg-emerald-500'
          }`}
      />

      <div className="pl-1">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div>
            <span className="font-mono text-[11px] font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
              {item.codigo}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-slate-800 mt-1 leading-snug">
              {item.nome}
            </h3>
            <span className="text-xs text-slate-400 font-medium">{item.categoria}</span>
          </div>
          <Badge situacao={item.situacao} />
        </div>

        {/* Localização estilo prateleira */}
        <div className="flex items-center gap-1.5 text-xs text-slate-600 my-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200/50">
          <MapPin className="w-3.5 h-3.5 text-videplast-primary shrink-0" />
          <span>Localização: <strong className="text-slate-800">{item.endereco}</strong></span>
        </div>

        {/* Barra de Saldo */}
        <div className="my-3 pt-2 border-t border-slate-100">
          <BarraEstoque
            saldo={item.saldo}
            min={item.min}
            max={item.max}
            unidade={item.unidade}
            situacao={item.situacao}
          />
        </div>

        <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100 text-slate-600">
          <span className="flex items-center gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            Cobertura: <strong className="text-slate-800">{item.coberturaDias !== null ? `${formatarNumero(item.coberturaDias, 1)} dias` : 'Sem saídas'}</strong>
          </span>
          <span className="text-videplast-primary font-bold flex items-center gap-1 hover:underline">
            <Eye className="w-3.5 h-3.5" />
            Ver detalhes
          </span>
        </div>
      </div>
    </Card>
  );

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 text-center">
      {/* Badge e Título Corporativo Videplast */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
          Consulta de Estoque Mín/Máx
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1 max-w-xl mx-auto">
          Busque por código, nome ou endereço do material em tempo real
        </p>
      </div>

      {/* Barra de Busca de Alto Impacto com Botão Colado "Consultar" */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          dispararBuscaImediata();
        }}
        className="w-full max-w-3xl mx-auto mb-3"
      >
        <div className="flex items-stretch shadow-lg shadow-slate-200/60 hover:shadow-xl hover:shadow-slate-200/70 rounded-xl overflow-hidden border border-slate-200 focus-within:border-videplast-primary focus-within:ring-4 focus-within:ring-red-500/10 transition-all duration-200 bg-white">
          <div className="relative flex-1 flex items-center">
            <div className="absolute left-4 text-slate-400 pointer-events-none">
              <Search className="w-5 h-5" />
            </div>
            <input
              ref={inputBuscaRef}
              type="text"
              value={termoBusca}
              onChange={(e) => setTermoBusca(e.target.value)}
              placeholder="Digite o código (ex: PEBD-VIR-01), material ou localização..."
              className="w-full pl-12 pr-12 py-3.5 text-sm sm:text-base text-slate-800 bg-transparent border-0 outline-none placeholder-slate-400 min-h-[52px]"
            />
            {termoBusca && (
              <button
                type="button"
                onClick={() => setTermoBusca('')}
                className="absolute right-3 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors"
                title="Limpar busca"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          {/* Botão Vermelho "Consultar" com gradiente sutil e colado ao campo */}
          <button
            type="submit"
            className="bg-gradient-to-r from-[#DC3545] to-[#B02A37] hover:from-[#C82333] hover:to-[#9F222F] text-white font-bold px-6 sm:px-8 text-sm sm:text-base transition-all duration-150 shrink-0 flex items-center justify-center gap-2 select-none min-h-[52px] active:scale-[0.98]"
          >
            <Search className="w-4 h-4 hidden sm:inline" />
            <span>Consultar</span>
          </button>
        </div>
      </form>

      {/* Fileira de Botões de Navegação com as variações originais do print */}
      <Navegacao modo="home" />

      {/* Cards de Resumo e Filtro com 1 Clique */}
      <CardsResumoEstoque
        itens={itens}
        situacaoAtiva={situacao}
        onSelecionarSituacao={handleSelecionarSituacao}
      />

      {/* Barra de Filtros Refinada */}
      <div className="w-full max-w-5xl mx-auto mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200/90 shadow-xs text-left">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
          <Filter className="w-4 h-4 text-videplast-brand" />
          <span>Filtros Refinados</span>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 flex-1 justify-end">
          {/* Categoria */}
          <div className="relative">
            <select
              value={categoria}
              onChange={(e) => handleSelecionarCategoria(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 text-slate-700 font-medium focus:border-videplast-primary focus:bg-white outline-none min-h-[40px] transition-colors cursor-pointer max-w-[340px] truncate"
            >
              <option value="">Todas as Categorias ({totalItens || 0})</option>
              {listaCategorias.map((cat) => (
                <option key={cat.categoria} value={cat.categoria}>
                  {cat.categoria} ({cat.total} itens)
                </option>
              ))}
            </select>
          </div>

          {/* Situação */}
          <div className="relative">
            <select
              value={situacao}
              onChange={(e) => handleSelecionarSituacao(e.target.value)}
              className="w-full sm:w-auto text-xs sm:text-sm rounded-lg border border-slate-200 bg-slate-50 hover:bg-white px-3 py-2 text-slate-700 font-medium focus:border-videplast-primary focus:bg-white outline-none min-h-[40px] transition-colors cursor-pointer"
            >
              {SITUACOES_FILTRO.map((sit) => (
                <option key={sit.valor} value={sit.valor}>
                  {sit.label}
                </option>
              ))}
            </select>
          </div>

          {/* Botão limpar filtros */}
          {(termoBusca || categoria || situacao) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={limparFiltros}
              className="text-slate-500 hover:text-videplast-primary"
            >
              <X className="w-3.5 h-3.5" />
              Limpar Filtros
            </Button>
          )}
        </div>
      </div>

      {/* Alerta de Erro caso ocorra */}
      {erro && (
        <div className="max-w-3xl mx-auto mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
            <span>{erro}</span>
          </div>
          <Button variant="outline-primary" size="sm" onClick={recarregar}>
            Tentar Novamente
          </Button>
        </div>
      )}

      {/* Resultados da Consulta */}
      <div id="secao-tabela-materiais" className="w-full max-w-7xl mx-auto scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3 px-1 text-left">
          <div>
            <span className="text-xs sm:text-sm text-slate-500 font-medium">
              Exibindo <strong>{itens.length}</strong> {itens.length === 1 ? 'material cadastrado' : 'materiais cadastrados'}
            </span>
            <span className="text-[11px] text-slate-400 hidden sm:inline ml-2">
              • Clique na linha do material para visualizar detalhes e parâmetros MRP
            </span>
          </div>

          {isAlmoxarifado && (
            <Button
              variant="outline-primary"
              size="sm"
              onClick={() => setModalImportarAberto(true)}
              className="flex items-center gap-2 font-bold shadow-xs border-emerald-600 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-700 bg-white self-start sm:self-auto"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Importar Planilha SAP</span>
            </Button>
          )}
        </div>

        {carregando ? (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
            <SkeletonTabela linhas={6} />
          </div>
        ) : itens.length === 0 ? (
          <div className="space-y-4">
            <EmptyState
              title="Nenhum material encontrado no banco de dados"
              description={
                isAlmoxarifado
                  ? 'O catálogo de materiais está aguardando a importação da primeira planilha exportada do SAP.'
                  : 'Tente outro termo ou limpe os filtros para visualizar os itens cadastrados.'
              }
              actionLabel={isAlmoxarifado ? 'Importar Planilha SAP Agora' : 'Limpar Todos os Filtros'}
              onAction={isAlmoxarifado ? () => setModalImportarAberto(true) : limparFiltros}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <DataTable
              colunas={colunas}
              dados={itensPaginados}
              chaveId="id"
              onLinhaClick={(item) => abrirDetalhe(item)}
              ordenacaoAtual={ordenacao}
              onOrdenar={handleOrdenar}
              renderCardMobile={renderCardMobile}
            />

            {/* Paginação Completa */}
            <Paginacao
              paginaAtual={paginaAtual}
              totalItens={itens.length}
              itensPorPagina={itensPorPagina}
              onMudarPagina={handleMudarPagina}
              onMudarItensPorPagina={handleMudarItensPorPagina}
              opcoesItensPorPagina={[15, 25, 50, 100]}
            />
          </div>
        )}
      </div>

      {/* Modal de Detalhes do Item */}
      <DetalheItemModal
        item={itemSelecionado}
        isOpen={Boolean(itemSelecionado)}
        onClose={fecharDetalhe}
        onSalvarMinMax={atualizarMinMax}
      />

      {/* Modal de Importação de Planilha SAP (Exclusivo Almoxarifado) */}
      <ModalImportarPlanilha
        isOpen={modalImportarAberto}
        onClose={() => setModalImportarAberto(false)}
        onImportadoComSucesso={() => {
          recarregar();
        }}
      />
    </div>
  );
}

