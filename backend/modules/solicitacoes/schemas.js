import { z } from 'zod';

export const STATUS_SOLICITACAO = ['pendente', 'aprovada', 'recusada'];

export const criarSolicitacaoSchema = z
  .object({
    itemId: z.string().min(1, 'O ID do material é obrigatório'),
    novoMin: z.number().min(0, 'O novo estoque mínimo deve ser maior ou igual a zero'),
    novoMax: z.number().min(0, 'O novo estoque máximo deve ser maior ou igual a zero'),
    justificativa: z
      .string()
      .min(5, 'A justificativa é obrigatória (mínimo de 5 caracteres)')
      .max(500, 'A justificativa não pode ultrapassar 500 caracteres'),
    solicitante: z.string().optional().default('Supervisor'),
    setor: z.string().optional().default('Produção')
  })
  .refine((data) => data.novoMin < data.novoMax, {
    message: 'O novo estoque mínimo deve ser obrigatoriamente menor que o novo estoque máximo',
    path: ['novoMin']
  });

export const solicitacaoIdParamSchema = z.object({
  id: z.string().min(1, 'O ID da solicitação é obrigatório')
});

export const listarSolicitacoesQuerySchema = z.object({
  status: z.enum(['', ...STATUS_SOLICITACAO]).optional().default('')
});

export const recusarSolicitacaoSchema = z.object({
  motivoRecusa: z.string().optional().default('')
});
