import { Router } from 'express';
import {
  historicoService,
  listarHistoricoQuerySchema
} from '../modules/historico/index.js';
import { getZodErrorMessage, ValidationError } from '../modules/shared/index.js';
import { requirePerfil, PERFIS } from '../modules/auth/index.js';

const router = Router();

// Listar eventos do histórico de auditoria
router.get(
  '/',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const queryResult = listarHistoricoQuerySchema.safeParse(req.query);
      if (!queryResult.success) {
        throw new ValidationError(getZodErrorMessage(queryResult.error));
      }

      const historico = await historicoService.listar(queryResult.data);
      res.json({ data: historico });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
