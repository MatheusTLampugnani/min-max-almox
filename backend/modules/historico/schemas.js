import { z } from 'zod';

export const listarHistoricoQuerySchema = z.object({
  termo: z.string().optional().default(''),
  tipoAcao: z.string().optional().default(''),
  dataInicio: z.string().optional(),
  dataFim: z.string().optional(),
  limite: z.coerce.number().int().positive().max(500).optional().default(100)
});

export const registrarHistoricoSchema = z.object({
  tipoAcao: z.enum([
    'alteracao_min_max_direta',
    'solicitacao_criada',
    'solicitacao_aprovada',
    'solicitacao_recusada'
  ]),
  titulo: z.string().min(3),
  usuario: z.string().min(2),
  perfil: z.string().min(2),
  item: z.object({
    id: z.string().optional(),
    codigo: z.string(),
    nome: z.string(),
    unidade: z.string().optional(),
    categoria: z.string().optional()
  }),
  alteracao: z
    .object({
      minAnterior: z.number().optional().nullable(),
      maxAnterior: z.number().optional().nullable(),
      novoMin: z.number().optional().nullable(),
      novoMax: z.number().optional().nullable()
    })
    .optional()
    .nullable(),
  justificativa: z.string().optional().nullable(),
  motivoRecusa: z.string().optional().nullable(),
  detalhesAdicionais: z.any().optional()
});
