const SETORES_MOCK = [
  { id: 'extrusao', nome: 'Extrusão', sigla: 'EXT' },
  { id: 'impressao', nome: 'Impressão', sigla: 'IMP' },
  { id: 'corte-solda', nome: 'Corte e Solda', sigla: 'CS' },
  { id: 'manutencao', nome: 'Manutenção', sigla: 'MAN' },
  { id: 'expedicao', nome: 'Expedição', sigla: 'EXP' }
];

export const setoresRepository = {
  async listar() {
    return [...SETORES_MOCK];
  },
  async buscarPorId(id) {
    return SETORES_MOCK.find((s) => s.id === id) || null;
  }
};
