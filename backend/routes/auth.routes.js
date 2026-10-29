import { Router } from 'express';
import { authService } from '../modules/auth/service.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { cracha } = req.body;
    const usuario = await authService.autenticarPorCracha(cracha);

    res.json({
      mensagem: 'Login autorizado!',
      usuario,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/login/:id
router.get('/login/:id', async (req, res, next) => {
  try {
    const usuario = await authService.autenticarPorCracha(req.params.id);

    res.json({
      mensagem: 'Login autorizado!',
      usuario,
      data: usuario
    });
  } catch (error) {
    next(error);
  }
});

export default router;
