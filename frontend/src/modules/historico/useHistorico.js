import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';

export function useHistorico() {
  const [registros, setRegistros] = useState([]);
  const [termo, setTermo] = useState('');
  const [tipoAcao, setTipoAcao] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  // Paginação
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [itensPorPagina, setItensPorPagina] = useState(15);

  const carregarHistorico = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {};
      if (termo.trim()) params.termo = termo.trim();
      if (tipoAcao) params.tipoAcao = tipoAcao;

      const res = await api.get('/historico', { params });
      setRegistros(res.data.data || []);
      setPaginaAtual(1); // Volta à primeira página ao filtrar
    } catch (err) {
      setErro(err.message || 'Erro ao carregar histórico de auditoria.');
    } finally {
      setCarregando(false);
    }
  }, [termo, tipoAcao]);

  useEffect(() => {
    carregarHistorico();
  }, [carregarHistorico]);

  const limparFiltros = () => {
    setTermo('');
    setTipoAcao('');
  };

  // Paginação no cliente sobre a lista filtrada
  const totalRegistros = registros.length;
  const totalPaginas = Math.ceil(totalRegistros / itensPorPagina) || 1;
  const indiceInicio = (paginaAtual - 1) * itensPorPagina;
  const registrosPaginados = registros.slice(indiceInicio, indiceInicio + itensPorPagina);

  return {
    registros: registrosPaginados,
    totalRegistros,
    termo,
    setTermo,
    tipoAcao,
    setTipoAcao,
    carregando,
    erro,
    recarregar: carregarHistorico,
    limparFiltros,
    paginaAtual,
    setPaginaAtual,
    itensPorPagina,
    setItensPorPagina,
    totalPaginas
  };
}
