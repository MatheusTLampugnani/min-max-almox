import { Router } from 'express';
import {
  itensService,
  consultaItensQuerySchema,
  itemIdParamSchema,
  criarItemSchema,
  atualizarItemSchema,
  atualizarMinMaxSchema
} from '../modules/itens/index.js';
import { getZodErrorMessage, ValidationError } from '../modules/shared/index.js';
import { requirePerfil, PERFIS } from '../modules/auth/index.js';

const router = Router();

// Consulta pública / autenticada de itens com filtros
router.get('/', async (req, res, next) => {
  try {
    const queryResult = consultaItensQuerySchema.safeParse(req.query);
    if (!queryResult.success) {
      throw new ValidationError(getZodErrorMessage(queryResult.error));
    }

    const itens = await itensService.consultarItens(queryResult.data);
    res.json({ data: itens });
  } catch (error) {
    next(error);
  }
});

// Análise consolidada de Distorções MRP (materiais acima e abaixo de 0)
router.get('/analise-distorcao', async (req, res, next) => {
  try {
    const { termo = '', categoria = '', distorcao = 'distorcidos' } = req.query;
    const resultado = await itensService.obterAnaliseDistorcao({
      termo: String(termo || ''),
      categoria: String(categoria || ''),
      distorcao: String(distorcao || 'distorcidos')
    });
    res.json({ data: resultado });
  } catch (error) {
    next(error);
  }
});

// Listagem consolidada de todas as categorias industriais com contagem de itens
router.get('/categorias', async (req, res, next) => {
  try {
    const categorias = await itensService.listarCategorias();
    res.json({ data: categorias });
  } catch (error) {
    next(error);
  }
});

// Importação em lote da planilha do SAP (Restrito ao Almoxarifado)
router.post('/importar', requirePerfil(PERFIS.ALMOXARIFADO), async (req, res, next) => {
  try {
    const { itens, nomeArquivo } = req.body;
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new ValidationError('A lista de materiais para importação está vazia.');
    }

    const usuario = req.usuario || 'Almoxarifado Central';
    const resultado = await itensService.importarPlanilhaSap({
      itens,
      usuario,
      nomeArquivo: nomeArquivo || 'planilha_sap.xlsx'
    });

    res.status(200).json({
      mensagem: 'Planilha do SAP importada e sincronizada com sucesso!',
      data: resultado
    });
  } catch (error) {
    next(error);
  }
});

// Detalhes completos do item (histórico de saídas de 6 meses, média, reposição)
router.get('/:id', async (req, res, next) => {

  try {
    const paramsResult = itemIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(getZodErrorMessage(paramsResult.error));
    }

    const item = await itensService.obterDetalheItem(paramsResult.data.id);
    res.json({ data: item });
  } catch (error) {
    next(error);
  }
});

// Atualização direta de Mínimo e Máximo (restrito a Almoxarifado)
router.patch(
  '/:id/min-max',
  requirePerfil(PERFIS.ALMOXARIFADO),
  async (req, res, next) => {
    try {
      const paramsResult = itemIdParamSchema.safeParse(req.params);
      if (!paramsResult.success) {
        throw new ValidationError(getZodErrorMessage(paramsResult.error));
      }

      const bodyResult = atualizarMinMaxSchema.safeParse(req.body);
      if (!bodyResult.success) {
        throw new ValidationError(getZodErrorMessage(bodyResult.error));
      }

      const itemAtualizado = await itensService.atualizarMinMax(
        paramsResult.data.id,
        bodyResult.data,
        {
          usuario: req.usuario || 'Almoxarifado Central',
          perfil: req.perfil || 'almoxarifado'
        }
      );

      res.json({
        mensagem: 'Parâmetros de estoque mínimo e máximo atualizados com sucesso.',
        data: itemAtualizado
      });
    } catch (error) {
      next(error);
    }
  }
);

// Cadastro de novo item (restrito a Almoxarifado)
router.post('/', requirePerfil(PERFIS.ALMOXARIFADO), async (req, res, next) => {
  try {
    const bodyResult = criarItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(getZodErrorMessage(bodyResult.error));
    }

    const novoItem = await itensService.criarItem(bodyResult.data);
    res.status(201).json({
      mensagem: 'Material cadastrado com sucesso.',
      data: novoItem
    });
  } catch (error) {
    next(error);
  }
});

// Atualização de cadastro de item (restrito a Almoxarifado)
router.put('/:id', requirePerfil(PERFIS.ALMOXARIFADO), async (req, res, next) => {
  try {
    const paramsResult = itemIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(getZodErrorMessage(paramsResult.error));
    }

    const bodyResult = atualizarItemSchema.safeParse(req.body);
    if (!bodyResult.success) {
      throw new ValidationError(getZodErrorMessage(bodyResult.error));
    }

    const itemAtualizado = await itensService.atualizarItem(
      paramsResult.data.id,
      bodyResult.data
    );

    res.json({
      mensagem: 'Dados do material atualizados com sucesso.',
      data: itemAtualizado
    });
  } catch (error) {
    next(error);
  }
});

// Inativação de item (restrito a Almoxarifado)
router.delete('/:id', requirePerfil(PERFIS.ALMOXARIFADO), async (req, res, next) => {
  try {
    const paramsResult = itemIdParamSchema.safeParse(req.params);
    if (!paramsResult.success) {
      throw new ValidationError(getZodErrorMessage(paramsResult.error));
    }

    const itemInativado = await itensService.inativarItem(paramsResult.data.id);
    res.json({
      mensagem: 'Material inativado com sucesso.',
      data: itemInativado
    });
  } catch (error) {
    next(error);
  }
});

export default router;
