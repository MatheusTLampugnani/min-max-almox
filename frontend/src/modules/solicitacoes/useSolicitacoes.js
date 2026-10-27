import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';

export function useSolicitacoes() {
  const [solicitacoes, setSolicitacoes] = useState([]);
  const [totalPendentes, setTotalPendentes] = useState(0);
  const [filtroStatus, setFiltroStatus] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);
  const [configEmails, setConfigEmails] = useState(null);

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

  const carregarConfigEmails = useCallback(async () => {
    try {
      const res = await api.get('/solicitacoes/config/destinatarios');
      setConfigEmails(res.data);
    } catch (err) {
      console.warn('Não foi possível carregar config de e-mails:', err.message);
    }
  }, []);

  useEffect(() => {
    carregarSolicitacoes();
  }, [carregarSolicitacoes]);

  useEffect(() => {
    carregarConfigEmails();
  }, [carregarConfigEmails]);

  // Aprovar solicitação na Filial (Reencaminha para a Matriz)
  const aprovarSolicitacao = async (id) => {
    try {
      const res = await api.post(`/solicitacoes/${id}/aprovar`);
      addToast(
        res.data.mensagem ||
          'Solicitação aprovada pela filial! E-mail encaminhado ao responsável da Matriz.',
        'sucesso'
      );
      carregarSolicitacoes();
      return res.data;
    } catch (err) {
      addToast(err.message || 'Erro ao aprovar solicitação.', 'erro');
      throw err;
    }
  };

  // Confirmar que a Matriz concluiu a alteração no SAP
  const concluirSolicitacaoMatriz = async (id) => {
    try {
      const res = await api.post(`/solicitacoes/${id}/concluir`);
      addToast(
        res.data.mensagem || 'Alteração no SAP confirmada! Parâmetros atualizados no sistema.',
        'sucesso'
      );
      carregarSolicitacoes();
      return res.data;
    } catch (err) {
      addToast(err.message || 'Erro ao confirmar alteração da Matriz.', 'erro');
      throw err;
    }
  };

  // Recusar solicitação
  const recusarSolicitacao = async (id, motivoRecusa = '') => {
    try {
      const res = await api.post(`/solicitacoes/${id}/recusar`, { motivoRecusa });
      addToast('Solicitação recusada pela Filial.', 'info');
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
    configEmails,
    recarregar: carregarSolicitacoes,
    aprovarSolicitacao,
    concluirSolicitacaoMatriz,
    recusarSolicitacao
  };
}

