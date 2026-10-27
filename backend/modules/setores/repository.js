const SETORES = [
  { id: 'extrusao', nome: 'Extrusão', sigla: 'EXT' },
  { id: 'impressao', nome: 'Impressão', sigla: 'IMP' },
  { id: 'corte-solda', nome: 'Corte e Solda', sigla: 'CS' },
  { id: 'manutencao', nome: 'Manutenção', sigla: 'MAN' },
  { id: 'expedicao', nome: 'Expedição', sigla: 'EXP' }
];

export const setoresRepository = {
  async listar() {
    return [...SETORES];
  },
  async buscarPorId(id) {
    return SETORES.find((s) => s.id === id) || null;
  }
};
