import { Router } from 'express';
import {
  solicitacoesService,
  criarSolicitacaoSchema,
  solicitacaoIdParamSchema,
  listarSolicitacoesQuerySchema,
  recusarSolicitacaoSchema
} from '../modules/solicitacoes/index.js';
import { getZodErrorMessage, ValidationError } from '../modules/shared/index.js';
import { requirePerfil, PERFIS } from '../modules/auth/index.js';

const router = Router();

// Contador de solicitações pendentes (para o badge do header/menu)
router.get('/pendentes/contador', async (req, res, next) => {
  try {
    const total = await solicitacoesService.contarPendentes();
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

    const solicitacoes = await solicitacoesService.listar(queryResult.data);
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

      const novaSolicitacao = await solicitacoesService.criarSolicitacao(bodyResult.data);
      res.status(201).json({
        mensagem: 'Solicitação de alteração enviada com sucesso para o Almoxarifado.',
        data: novaSolicitacao
      });
    } catch (error) {
      next(error);
    }
  }
);

// Aprovar solicitação (Apenas Almoxarifado)
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
        { respondidoPor: req.perfil || 'Almoxarifado' }
      );

      res.json({
        mensagem: 'Solicitação aprovada e novos parâmetros de estoque aplicados ao material com sucesso.',
        data: solicitacaoAprovada
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
          respondidoPor: req.perfil || 'Almoxarifado',
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
