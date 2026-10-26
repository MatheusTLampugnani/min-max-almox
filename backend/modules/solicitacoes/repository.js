/**
 * Repositório em memória para Solicitações de alteração de Mín/Máx.
 * Permite que supervisores solicitem alterações e o almoxarifado aprove/recuse.
 */

let solicitacoesMemoria = [
  {
    id: 'sol-001',
    itemId: 'sap-3000516',
    itemCodigo: '3000516',
    itemNome: 'CAIXA PAP TAMPA 571X479X165MM ONDA SIMP',
    itemUnidade: 'un',
    minAtual: 5000,
    maxAtual: 10000,
    novoMin: 6000,
    novoMax: 12000,
    justificativa: 'Aumento na demanda projetada de exportação para o próximo trimestre. Necessário elevar o buffer de segurança.',
    solicitante: 'Supervisor de Corte e Solda',
    setor: 'Corte e Solda',
    status: 'pendente',
    dataCriacao: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dataResposta: null,
    respondidoPor: null,
    motivoRecusa: null
  }
];

export const solicitacoesRepository = {
  async listar({ status = '' } = {}) {
    let lista = [...solicitacoesMemoria];
    if (status) {
      lista = lista.filter((s) => s.status === status);
    }
    return lista.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  },

  async buscarPorId(id) {
    const item = solicitacoesMemoria.find((s) => s.id === id);
    return item ? { ...item } : null;
  },

  async contarPendentes() {
    return solicitacoesMemoria.filter((s) => s.status === 'pendente').length;
  },

  async criar(dados) {
    const novaSolicitacao = {
      id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...dados,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataResposta: null,
      respondidoPor: null,
      motivoRecusa: null
    };
    solicitacoesMemoria.unshift(novaSolicitacao);
    return { ...novaSolicitacao };
  },

  async atualizarStatus(id, { status, respondidoPor, motivoRecusa = null }) {
    const index = solicitacoesMemoria.findIndex((s) => s.id === id);
    if (index === -1) return null;

    solicitacoesMemoria[index] = {
      ...solicitacoesMemoria[index],
      status,
      respondidoPor,
      motivoRecusa,
      dataResposta: new Date().toISOString()
    };
    return { ...solicitacoesMemoria[index] };
  },

  _resetMock() {
    solicitacoesMemoria = [];
  }
};
