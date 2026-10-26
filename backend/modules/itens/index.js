export { itensService } from './service.js';
export { itensRepository } from './repository.js';
export {
  CATEGORIAS_ITENS,
  SITUACOES_ESTOQUE,
  consultaItensQuerySchema,
  itemIdParamSchema,
  criarItemSchema,
  atualizarItemSchema,
  atualizarMinMaxSchema
} from './schemas.js';
export {
  calcularSituacao,
  calcularCoberturaDias,
  calcularReposicaoSugerida
} from './regras.js';
