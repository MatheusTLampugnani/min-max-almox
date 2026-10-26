import { Router } from 'express';
import { setoresService } from '../modules/setores/index.js';

const router = Router();

router.get('/', async (req, res, next) => {
  try {
    const setores = await setoresService.listar();
    res.json({ data: setores });
  } catch (error) {
    next(error);
  }
});

export default router;
