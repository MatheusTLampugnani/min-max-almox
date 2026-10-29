import { solicitacoesRepository } from './repository.js';
import { itensService } from '../itens/index.js';
import {
  NotFoundError,
  ValidationError,
  notificarNovaSolicitacao,
  notificarAprovacaoParaMatriz
} from '../shared/index.js';

export const solicitacoesService = {
  async listar({ status = '', perfil = 'almoxarifado', cracha = '', usuario = '' } = {}) {
    return solicitacoesRepository.listar({ status, perfil, cracha, usuario });
  },

  async buscarPorId(id) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação de ID '${id}' não encontrada.`);
    }
    return sol;
  },

  async contarPendentes({ perfil = 'almoxarifado', cracha = '', usuario = '' } = {}) {
    return solicitacoesRepository.contarPendentes({ perfil, cracha, usuario });
  },

  async criarSolicitacao({ itemId, novoMin, novoMax, justificativa, solicitante, setor, cracha = '' }) {
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

    let solicitanteFormatado = (solicitante || 'Supervisor').trim();
    if (cracha && !solicitanteFormatado.includes(cracha)) {
      solicitanteFormatado = `${solicitanteFormatado} (Crachá ${cracha})`;
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
      solicitante: solicitanteFormatado,
      setor: setor || 'Produção'
    });

    // 1. Notifica por e-mail a equipe da filial (Almoxarifado, Supervisor e Coordenador)
    try {
      await notificarNovaSolicitacao({
        solicitacao: novaSolicitacao,
        item
      });
    } catch (errEmail) {
      console.warn('[EMAIL] Falha ao notificar criação de solicitação:', errEmail.message);
    }

    // 2. Registra no histórico de auditoria
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
   * Aprovação Local da Filial (Almoxarifado / Coordenador).
   * Como a filial não altera o SAP diretamente, esta etapa aprova internamente
   * e REENCAMINHA automaticamente o e-mail para o responsável na MATRIZ realizar a alteração.
   */
  async aprovarSolicitacao(id, { respondidoPor = 'Almoxarifado' } = {}) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação com ID '${id}' não encontrada.`);
    }

    if (sol.status !== 'pendente') {
      throw new ValidationError(`Esta solicitação já foi finalizada com o status '${sol.status}'.`);
    }

    // Atualiza o status da solicitação para encaminhada_matriz
    const solicitacaoAtualizada = await solicitacoesRepository.atualizarStatus(id, {
      status: 'encaminhada_matriz',
      respondidoPor,
      dataAprovacaoFilial: new Date().toISOString(),
      emailNotificacaoMatriz: true
    });

    // Reencaminha e-mail detalhado com a aprovação para o Responsável pelas Alterações na Matriz
    try {
      await notificarAprovacaoParaMatriz({
        solicitacao: sol,
        respondidoPor
      });
    } catch (errEmail) {
      console.warn('[EMAIL] Falha ao encaminhar aprovação para a matriz:', errEmail.message);
    }

    // Registra no histórico do sistema
    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'solicitacao_aprovada_filial',
        titulo: 'Aprovação pela Filial e Encaminhamento à Matriz',
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
      console.warn('[HISTORICO] Aviso ao registrar aprovação da filial:', err.message);
    }

    return solicitacaoAtualizada;
  },

  /**
   * Conclusão da Alteração no SAP pela Matriz.
   * Quando o responsável da matriz realiza a alteração no SAP, a filial confirma
   * a conclusão e os parâmetros são atualizados no sistema.
   */
  async concluirMatriz(id, { finalizadoPor = 'Almoxarifado' } = {}) {
    const sol = await solicitacoesRepository.buscarPorId(id);
    if (!sol) {
      throw new NotFoundError(`Solicitação com ID '${id}' não encontrada.`);
    }

    if (sol.status !== 'encaminhada_matriz' && sol.status !== 'aprovada') {
      throw new ValidationError(`Apenas solicitações encaminhadas à Matriz podem ser marcadas como concluídas.`);
    }

    // Atualiza os parâmetros no catálogo de itens local
    try {
      await itensService.atualizarMinMax(sol.itemId, {
        min: sol.novoMin,
        max: sol.novoMax
      });
    } catch (errItens) {
      console.warn('[ITENS] Falha ao atualizar material no catálogo local:', errItens.message);
    }

    // Atualiza o status da solicitação para concluida
    const solicitacaoAtualizada = await solicitacoesRepository.atualizarStatus(id, {
      status: 'concluida',
      concluidoPor: finalizadoPor,
      dataConclusaoMatriz: new Date().toISOString()
    });

    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'alteracao_sap_concluida',
        titulo: 'Alteração Concluída no SAP pela Matriz',
        usuario: finalizadoPor,
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
        justificativa: 'Alteração no SAP efetuada com sucesso pelo responsável da matriz.'
      });
    } catch (err) {
      console.warn('[HISTORICO] Aviso ao registrar conclusão da matriz:', err.message);
    }

    return solicitacaoAtualizada;
  },

  /**
   * Recusa uma solicitação de alteração (Ação do Almoxarifado / Coordenação).
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

