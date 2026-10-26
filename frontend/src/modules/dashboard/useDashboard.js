import { useState, useEffect, useCallback } from 'react';
import { api } from '../../lib/api.js';

export function useDashboard() {
  const [metricas, setMetricas] = useState(null);
  const [categoria, setCategoria] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(null);

  const carregarMetricas = useCallback(async () => {
    try {
      setCarregando(true);
      setErro(null);

      const params = {};
      if (categoria) params.categoria = categoria;

      const res = await api.get('/dashboard/metricas', { params });
      setMetricas(res.data.data || null);
    } catch (err) {
      setErro(err.message || 'Erro ao carregar métricas do dashboard.');
    } finally {
      setCarregando(false);
    }
  }, [categoria]);

  useEffect(() => {
    carregarMetricas();
  }, [carregarMetricas]);

  return {
    metricas,
    categoria,
    setCategoria,
    carregando,
    erro,
    recarregar: carregarMetricas
  };
}
