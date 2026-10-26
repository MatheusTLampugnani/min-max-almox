import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';

export function useSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const { addToast } = useToast();

  const carregarSolicitacoes = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {};
      if (filtroStatus) params.status = filtroStatus;

      const [resLista, resContador] = await Promise.all([
        api.get('/solicitacoes', { params }),
        api.get('/solicitacoes/pendentes/contador')
      ]);

      setSolicitacoes(resLista.data.data || []);
      setTotalPendentes(resContador.data.totalPendentes || 0);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar solicitações.');
    } finally {
      setCarregando(false);
    }
  }, [filtroStatus]);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  // Aprovar solicitação
  const aprovarSolicitacao = async (id) => {
    try {
      const res = await api.post(`/solicitacoes/${id}/aprovar`);
      addToast('Solicitação aprovada e novos parâmetros de estoque aplicados!', 'sucesso');
      carregarSolicitacoes();
      return res.data;
    } catch (err) {
      addToast(err.message || 'Erro ao aprovar solicitação.', 'erro');
      throw err;
    }
  };

  // Recusar solicitação
  const recusarSolicitacao = async (id, motivoRecusa = '') => {
    try {
      const res = await api.post(`/solicitacoes/${id}/recusar`, { motivoRecusa });
      addToast('Solicitação recusada pelo Almoxarifado.', 'info');
      carregarSolicitacoes();
      return res.data;
    } catch (err) {
      addToast(err.message || 'Erro ao recusar solicitação.', 'erro');
      throw err;
    }
  };

  return {
    solicitacoes,
    totalPendentes,
    filtroStatus,
    setFiltroStatus,
    carregando,
    erro,
    recarregar: carregarSolicitacoes,
    aprovarSolicitacao,
    recusarSolicitacao
  };
}
