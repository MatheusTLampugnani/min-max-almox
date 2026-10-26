import { solicitacoesRepository } from './repository.js';
import { itensService } from '../itens/index.js';
import { NotFoundError, ValidationError } from '../shared/index.js';

export const solicitacoesService = {
  async listar({ status = '' } = {}) {
    return solicitacoesRepository.listar({ status });
  },

  async buscarPorId(id) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação de ID '${id}' não encontrada.`);
    }
    return sol;
  },

  async contarPendentes() {
    return solicitacoesRepository.contarPendentes();
  },

  async criarSolicitacao({ itemId, novoMin, novoMax, justificativa, solicitante, setor }) {
    if (novoMin >= novoMax) {
      throw new ValidationError('O novo estoque mínimo deve ser menor que o novo estoque máximo.');
    }

    if (!justificativa || justificativa.trim().length < 5) {
      throw new ValidationError('A justificativa da alteração é obrigatória (mínimo de 5 caracteres).');
    }

    // Busca os dados atuais do item no módulo de itens através do barrel público
    const item = await itensService.obterDetalheItem(itemId);
    if (!item) {
      throw new NotFoundError(`Material com ID '${itemId}' não encontrado.`);
    }

    const novaSolicitacao = await solicitacoesRepository.criar({
      itemId: item.id,
      itemCodigo: item.codigo,
      itemNome: item.nome,
      itemUnidade: item.unidade,
      minAtual: item.min,
      maxAtual: item.max,
      novoMin,
      novoMax,
      justificativa: justificativa.trim(),
      solicitante: solicitante || 'Supervisor',
      setor: setor || 'Produção'
    });

    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'solicitacao_criada',
        titulo: 'Abertura de Solicitação de Mín/Máx',
        usuario: `${solicitante || 'Supervisor'} (${setor || 'Geral'})`,
        perfil: 'supervisor',
        item: {
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          unidade: item.unidade,
          categoria: item.categoria
        },
        alteracao: {
          minAnterior: item.min,
          maxAnterior: item.max,
          novoMin,
          novoMax
        },
        justificativa: justificativa.trim()
      });
    } catch (err) {
      console.warn('[HISTORICO] Aviso ao registrar criação de solicitação:', err.message);
    }

    return novaSolicitacao;
  },

  /**
   * Aprova uma solicitação de alteração (Ação do Almoxarifado).
   * Aplica imediatamente o novo mínimo e máximo ao cadastro do material.
   */
  async aprovarSolicitacao(id, { respondidoPor = 'Almoxarifado' } = {}) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação com ID '${id}' não encontrada.`);
    }

    if (sol.status !== 'pendente') {
      throw new ValidationError(`Esta solicitação já foi finalizada com o status '${sol.status}'.`);
    }

    // Aplica os novos parâmetros no módulo de itens
    await itensService.atualizarMinMax(sol.itemId, {
      min: sol.novoMin,
      max: sol.novoMax
    });

    // Atualiza o status da solicitação para aprovada
    const solicitacaoAtualizada = await solicitacoesRepository.atualizarStatus(id, {
      status: 'aprovada',
      respondidoPor
    });

    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'solicitacao_aprovada',
        titulo: 'Aprovação de Solicitação de Mín/Máx',
        usuario: respondidoPor,
        perfil: 'almoxarifado',
        item: {
          id: sol.itemId,
          codigo: sol.itemCodigo,
          nome: sol.itemNome,
          unidade: sol.itemUnidade
        },
        alteracao: {
          minAnterior: sol.minAtual,
          maxAnterior: sol.maxAtual,
          novoMin: sol.novoMin,
          novoMax: sol.novoMax
        },
        justificativa: sol.justificativa
      });
    } catch (err) {
      console.warn('[HISTORICO] Aviso ao registrar aprovação de solicitação:', err.message);
    }

    return solicitacaoAtualizada;
  },

  /**
   * Recusa uma solicitação de alteração (Ação do Almoxarifado).
   */
  async recusarSolicitacao(id, { respondidoPor = 'Almoxarifado', motivoRecusa = '' } = {}) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação com ID '${id}' não encontrada.`);
    }

    if (sol.status !== 'pendente') {
      throw new ValidationError(`Esta solicitação já foi finalizada com o status '${sol.status}'.`);
    }

    const solicitacaoAtualizada = await solicitacoesRepository.atualizarStatus(id, {
      status: 'recusada',
      respondidoPor,
      motivoRecusa: motivoRecusa ? motivoRecusa.trim() : null
    });

    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'solicitacao_recusada',
        titulo: 'Recusa de Solicitação de Mín/Máx',
        usuario: respondidoPor,
        perfil: 'almoxarifado',
        item: {
          id: sol.itemId,
          codigo: sol.itemCodigo,
          nome: sol.itemNome,
          unidade: sol.itemUnidade
        },
        alteracao: {
          minAnterior: sol.minAtual,
          maxAnterior: sol.maxAtual,
          novoMin: sol.novoMin,
          novoMax: sol.novoMax
        },
        justificativa: sol.justificativa,
        motivoRecusa: motivoRecusa ? motivoRecusa.trim() : 'Recusado sem justificativa adicional.'
      });
    } catch (err) {
      console.warn('[HISTORICO] Aviso ao registrar recusa de solicitação:', err.message);
    }

    return solicitacaoAtualizada;
  }
};
