import { Router } from 'express';
import {
  solicitacoesService,
  criarSolicitacaoSchema,
  solicitacaoIdParamSchema,
  listarSolicitacoesQuerySchema,
  recusarSolicitacaoSchema
} from '../modules/solicitacoes/index.js';
import { getZodErrorMessage, ValidationError, getEmailConfig } from '../modules/shared/index.js';
import { requirePerfil, PERFIS } from '../modules/auth/index.js';

const router = Router();

// Obter status das configurações de e-mail e destinatários do fluxo
router.get('/config/destinatarios', async (req, res, next) => {
  try {
    const config = getEmailConfig();
    res.json({
      smtpConfigurado: Boolean(config.smtp.host && config.smtp.auth.user),
      smtpHost: config.smtp.host || 'Não configurado (modo de simulação/log ativo)',
      remetente: config.from,
      destinatarios: {
        almoxarifado: config.recipients.almoxarifado,
        supervisor: config.recipients.supervisor,
        coordenador: config.recipients.coordenador,
        matriz: config.recipients.matriz
      }
    });
  } catch (error) {
    next(error);
  }
});

// Contador de solicitações pendentes (para o badge do header/menu)
router.get('/pendentes/contador', async (req, res, next) => {
  try {
    const total = await solicitacoesService.contarPendentes({
      perfil: req.perfil,
      cracha: req.cracha,
      usuario: req.usuario
    });
    res.json({ totalPendentes: total });
  } catch (error) {
    next(error);
  }
});

// Listar solicitações
router.get('/', async (req, res, next) => {
  try {
    const queryResult = listarSolicitacoesQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(getZodErrorMessage(queryResult.error));
    }

    const solicitacoes = await solicitacoesService.listar({
      ...queryResult.data,
      perfil: req.perfil,
      cracha: req.cracha,
      usuario: req.usuario
    });
    res.json({ data: solicitacoes });
  } catch (error) {
    next(error);
  }
});

// Criar nova solicitação de alteração (Supervisor ou Almoxarifado)
router.post(
  '/',
  requirePerfil(PERFIS.SUPERVISOR, PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const bodyResult = criarSolicitacaoSchema.safeParse(req.body);
      if (!bodyResult.success) {
        throw new ValidationError(getZodErrorMessage(bodyResult.error));
      }

      const novaSolicitacao = await solicitacoesService.criarSolicitacao({
        ...bodyResult.data,
        cracha: req.cracha
      });
      res.status(201).json({
        mensagem: 'Solicitação criada! Notificação por e-mail enviada ao Almoxarifado, Supervisor e Coordenador.',
        data: novaSolicitacao
      });
    } catch (error) {
      next(error);
    }
  }
);

// Aprovar solicitação na Filial e encaminhar para a Matriz (Almoxarifado ou Coordenação)
router.post(
  '/:id/aprovar',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const paramsResult = solicitacaoIdParamSchema.safeParse(req.params);
      if (!paramsResult.success) {
        throw new ValidationError(getZodErrorMessage(paramsResult.error));
      }

      const solicitacaoAprovada = await solicitacoesService.aprovarSolicitacao(
        paramsResult.data.id,
        { respondidoPor: req.usuario || req.perfil || 'Almoxarifado' }
      );

      res.json({
        mensagem: 'Solicitação aprovada pela filial! E-mail com os detalhes foi encaminhado ao responsável da Matriz para alteração no SAP.',
        data: solicitacaoAprovada
      });
    } catch (error) {
      next(error);
    }
  }
);

// Concluir solicitação após a Matriz efetuar a alteração no SAP
router.post(
  '/:id/concluir',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const paramsResult = solicitacaoIdParamSchema.safeParse(req.params);
      if (!paramsResult.success) {
        throw new ValidationError(getZodErrorMessage(paramsResult.error));
      }

      const solicitacaoConcluida = await solicitacoesService.concluirMatriz(
        paramsResult.data.id,
        { finalizadoPor: req.usuario || req.perfil || 'Almoxarifado' }
      );

      res.json({
        mensagem: 'Alteração no SAP confirmada! Parâmetros de estoque atualizados no sistema com sucesso.',
        data: solicitacaoConcluida
      });
    } catch (error) {
      next(error);
    }
  }
);

// Recusar solicitação (Apenas Almoxarifado)
router.post(
  '/:id/recusar',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const paramsResult = solicitacaoIdParamSchema.safeParse(req.params);
      if (!paramsResult.success) {
        throw new ValidationError(getZodErrorMessage(paramsResult.error));
      }

      const bodyResult = recusarSolicitacaoSchema.safeParse(req.body);
      const motivo = bodyResult.success ? bodyResult.data.motivoRecusa : '';

      const solicitacaoRecusada = await solicitacoesService.recusarSolicitacao(
        paramsResult.data.id,
        {
          respondidoPor: req.usuario || req.perfil || 'Almoxarifado',
          motivoRecusa: motivo
        }
      );

      res.json({
        mensagem: 'Solicitação recusada pelo Almoxarifado.',
        data: solicitacaoRecusada
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;

