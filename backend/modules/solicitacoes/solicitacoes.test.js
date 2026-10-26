import { describe, it, expect } from 'vitest';
import { criarSolicitacaoSchema } from './schemas.js';

describe('Regras de Negócio - Solicitações de Alteração de Mín/Máx', () => {
  it('deve exigir justificativa com no mínimo 5 caracteres', () => {
    const semJustificativa = {
      itemId: 'sap-3000516',
      novoMin: 5000,
      novoMax: 10000,
      justificativa: 'abc'
    };

    const res = criarSolicitacaoSchema.safeParse(semJustificativa);
    expect(res.success).toBe(false);
  });

  it('deve rejeitar se novoMin for maior ou igual a novoMax', () => {
    const minMaior = {
      itemId: 'sap-3000516',
      novoMin: 12000,
      novoMax: 10000,
      justificativa: 'Necessidade urgente de ampliação do estoque da fábrica'
    };

    const res = criarSolicitacaoSchema.safeParse(minMaior);
    expect(res.success).toBe(false);
  });

  it('deve aceitar dados válidos com justificativa adequada e min < max', () => {
    const valida = {
      itemId: 'sap-3000516',
      novoMin: 6000,
      novoMax: 12000,
      justificativa: 'Aumento na demanda projetada para o próximo lote de produção',
      solicitante: 'Supervisor Extrusão',
      setor: 'Extrusão'
    };

    const res = criarSolicitacaoSchema.safeParse(valida);
    expect(res.success).toBe(true);
  });
});
