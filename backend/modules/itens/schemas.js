import { z } from 'zod';

export const CATEGORIAS_ITENS = [
  'Matéria-prima',
  'Embalagem',
  'Manutenção',
  'EPI',
  'Aparas',
  'Suprimentos'
];

export const SITUACOES_ESTOQUE = ['abaixo', 'dentro', 'acima'];

export const consultaItensQuerySchema = z.object({
  termo: z.string().optional().default(''),
  categoria: z.string().optional().default(''),
  situacao: z.enum(['', ...SITUACOES_ESTOQUE]).optional().default(''),
  distorcao: z.string().optional().default('')
});


export const itemIdParamSchema = z.object({
  id: z.string().min(1, 'O ID do item é obrigatório')
});

export const criarItemSchema = z
  .object({
    codigo: z.string().min(1, 'Código SAP é obrigatório'),
    nome: z.string().min(1, 'Descrição do material é obrigatória'),
    endereco: z.string().min(1, 'Endereço físico é obrigatório'),
    categoria: z.enum(CATEGORIAS_ITENS, {
      errorMap: () => ({ message: 'Categoria inválida' })
    }),
    unidade: z.string().min(1, 'Unidade de medida é obrigatória'),
    min: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a zero'),
    max: z.number().min(0, 'Quantidade máxima deve ser maior ou igual a zero'),
    saldo: z.number().min(0, 'Saldo deve ser maior ou igual a zero').default(0),
    sugestaoMrpMin: z.number().optional().nullable(),
    sugestaoMrpMax: z.number().optional().nullable(),
    consumo12Meses: z.number().optional().nullable(),
    consumoMedioPlanilha: z.number().optional().nullable(),
    ativo: z.boolean().optional().default(true)
  })
  .refine((data) => data.min < data.max, {
    message: 'A quantidade mínima deve ser obrigatoriamente menor que a máxima',
    path: ['min']
  });

export const atualizarItemSchema = criarItemSchema;

export const atualizarMinMaxSchema = z
  .object({
    min: z.number().min(0, 'Quantidade mínima deve ser maior ou igual a zero'),
    max: z.number().min(0, 'Quantidade máxima deve ser maior ou igual a zero')
  })
  .refine((data) => data.min < data.max, {
    message: 'A quantidade mínima deve ser menor que a quantidade máxima',
    path: ['min']
  });
