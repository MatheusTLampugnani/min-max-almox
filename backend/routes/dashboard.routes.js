import { Router } from 'express';
import { dashboardService } from '../modules/dashboard/index.js';
import { requirePerfil, PERFIS } from '../modules/auth/index.js';

const router = Router();

// Métricas consolidadas do dashboard (Almoxarifado)
router.get(
  '/metricas',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const { categoria = '' } = req.query;
      const metricas = await dashboardService.obterMetricas({
        categoria: typeof categoria === 'string' ? categoria : ''
      });
      res.json({ data: metricas });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
