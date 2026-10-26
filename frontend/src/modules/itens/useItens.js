import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api.js';

export function useItens() {
  const [searchParams, setSearchParams] = useSearchParams();

  // Estados derivados da URL (query params)
  const termoURL = searchParams.get('termo') || '';
  const categoriaURL = searchParams.get('categoria') || '';
  const situacaoURL = searchParams.get('situacao') || '';

  // Estado local do input de busca (para digitação imediata e debounce)
  const [termoBusca, setTermoBusca] = useState(termoURL);
  const [categoria, setCategoria] = useState(categoriaURL);
  const [situacao, setSituacao] = useState(situacaoURL);

  // Dados e estados assíncronos
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Item selecionado para modal de detalhes
  const [itemSelecionado, setItemSelecionado] = useState(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);

  // Ordenação
  const [ordenacao, setOrdenacao] = useState({ coluna: 'nome', direcao: 'asc' });

  // Sincroniza estado local se a URL mudar (ex: botão voltar do navegador)
  useEffect(() => {
    setTermoBusca(termoURL);
    setCategoria(categoriaURL);
    setSituacao(situacaoURL);
  }, [termoURL, categoriaURL, situacaoURL]);

  // Atualiza query params na URL
  const atualizarParametrosURL = useCallback(
    (novoTermo, novaCategoria, novaSituacao) => {
      const params = new URLSearchParams();
      if (novoTermo && novoTermo.trim()) params.set('termo', novoTermo.trim());
      if (novaCategoria) params.set('categoria', novaCategoria);
      if (novaSituacao) params.set('situacao', novaSituacao);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Busca itens na API
  const carregarItens = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {};
      if (termoURL) params.termo = termoURL;
      if (categoriaURL) params.categoria = categoriaURL;
      if (situacaoURL) params.situacao = situacaoURL;

      const resposta = await api.get('/itens', { params });
      setItens(resposta.data.data || []);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar lista de materiais');
    } finally {
      setCarregando(false);
    }
  }, [termoURL, categoriaURL, situacaoURL]);

  useEffect(() => {
    carregarItens();
  }, [carregarItens]);

  // Debounce na busca por texto (400ms)
  useEffect(() => {
    const handler = setTimeout(() => {
      if (termoBusca !== termoURL) {
        atualizarParametrosURL(termoBusca, categoria, situacao);
      }
    }, 400);

    return () => clearTimeout(handler);
  }, [termoBusca, termoURL, categoria, situacao, atualizarParametrosURL]);

  // Disparo imediato da busca ao pressionar Enter ou clicar em "Consultar"
  const dispararBuscaImediata = useCallback(() => {
    atualizarParametrosURL(termoBusca, categoria, situacao);
  }, [termoBusca, categoria, situacao, atualizarParametrosURL]);

  // Altera categoria
  const handleSelecionarCategoria = (novaCat) => {
    setCategoria(novaCat);
    atualizarParametrosURL(termoBusca, novaCat, situacao);
  };

  // Altera situação
  const handleSelecionarSituacao = (novaSit) => {
    setSituacao(novaSit);
    atualizarParametrosURL(termoBusca, categoria, novaSit);
  };

  // Limpa todos os filtros e busca
  const limparFiltros = () => {
    setTermoBusca('');
    setCategoria('');
    setSituacao('');
    atualizarParametrosURL('', '', '');
  };

  // Abertura do modal de detalhe
  const abrirDetalhe = async (itemOuId) => {
    const id = typeof itemOuId === 'string' ? itemOuId : itemOuId.id;
    try {
      setCarregandoDetalhe(true);
      const res = await api.get(`/itens/${id}`);
      setItemSelecionado(res.data.data);
    } catch (err) {
      // Fallback para o item básico se já estiver em memória
      if (typeof itemOuId === 'object') {
        setItemSelecionado(itemOuId);
      }
    } finally {
      setCarregandoDetalhe(false);
    }
  };

  const fecharDetalhe = () => {
    setItemSelecionado(null);
  };

  // Atualiza Min e Max diretamente
  const atualizarMinMax = async (id, novosValores) => {
    const res = await api.patch(`/itens/${id}/min-max`, novosValores);
    // Atualiza localmente
    setItens((prev) =>
      prev.map((it) => (it.id === id ? { ...it, ...novosValores } : it))
    );
    if (itemSelecionado && itemSelecionado.id === id) {
      setItemSelecionado((prev) => ({ ...prev, ...novosValores }));
    }
    // Recarrega para recalcular cobertura e reposição
    carregarItens();
    return res.data;
  };

  // Controle de ordenação de colunas
  const handleOrdenar = (coluna) => {
    setOrdenacao((prev) => {
      if (prev.coluna === coluna) {
        return {
          coluna,
          direcao: prev.direcao === 'asc' ? 'desc' : 'asc'
        };
      }
      return { coluna, direcao: 'asc' };
    });
  };

  // Itens ordenados em memória
  const itensOrdenados = useMemo(() => {
    if (!itens || itens.length === 0) return [];

    const resultado = [...itens];

    resultado.sort((a, b) => {
      // Prioridade se filtro de situação crítico estiver ativo (abaixo do mínimo primeiro)
      if (situacao === 'abaixo' && a.situacao !== b.situacao) {
        return a.situacao === 'abaixo' ? -1 : 1;
      }

      const campo = ordenacao.coluna;
      if (!campo) return 0;

      let valA = a[campo];
      let valB = b[campo];

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return ordenacao.direcao === 'asc' ? -1 : 1;
      if (valA > valB) return ordenacao.direcao === 'asc' ? 1 : -1;
      return 0;
    });

    return resultado;
  }, [itens, ordenacao, situacao]);

  return {
    itens: itensOrdenados,
    totalItens: itens.length,
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
    carregandoDetalhe,
    abrirDetalhe,
    fecharDetalhe,
    atualizarMinMax,
    ordenacao,
    handleOrdenar,
    recarregar: carregarItens
  };
}
