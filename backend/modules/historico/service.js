import { historicoRepository } from './repository.js';
import { registrarHistoricoSchema } from './schemas.js';

export const historicoService = {
  async listar(filtros = {}) {
    return historicoRepository.listar(filtros);
  },

  async registrar(dados) {
    const validado = registrarHistoricoSchema.safeParse(dados);
    if (!validado.success) {
      // Fallback sem quebrar a operação principal, apenas loga warning
      console.warn('[HISTORICO] Falha na validação do log de auditoria:', validado.error.format());
    }
    return historicoRepository.criar(validado.success ? validado.data : dados);
  }
};
