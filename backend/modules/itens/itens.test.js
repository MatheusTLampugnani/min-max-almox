import { describe, it, expect } from 'vitest';
import {
  calcularSituacao,
  calcularCoberturaDias,
  calcularReposicaoSugerida
} from './regras.js';
import { criarItemSchema } from './schemas.js';

describe('Regras de Negócio - Estoque de Itens', () => {
  describe('calcularSituacao', () => {
    it('deve retornar "abaixo" quando saldo for menor que o mínimo', () => {
      expect(calcularSituacao(99, 100, 500)).toBe('abaixo');
      expect(calcularSituacao(0, 10, 50)).toBe('abaixo');
    });

    it('deve retornar "dentro" quando saldo estiver entre o mínimo e o máximo (inclusive)', () => {
      expect(calcularSituacao(100, 100, 500)).toBe('dentro');
      expect(calcularSituacao(300, 100, 500)).toBe('dentro');
      expect(calcularSituacao(500, 100, 500)).toBe('dentro');
    });

    it('deve retornar "acima" quando saldo for maior que o máximo', () => {
      expect(calcularSituacao(501, 100, 500)).toBe('acima');
      expect(calcularSituacao(1000, 100, 500)).toBe('acima');
    });
  });

  describe('calcularCoberturaDias', () => {
    it('deve calcular a cobertura corretamente com base nas saídas dos últimos 3 meses', () => {
      // 900 saídas em 90 dias = 10 por dia. Saldo 300 => 30 dias de cobertura
      const resultado = calcularCoberturaDias(300, 900);
      expect(resultado).toBe(30);
    });

    it('deve retornar null se não houver saídas registradas (divisão por zero prevenida)', () => {
      expect(calcularCoberturaDias(300, 0)).toBeNull();
      expect(calcularCoberturaDias(300, -10)).toBeNull();
    });

    it('deve calcular 0 dias de cobertura se saldo for zero', () => {
      expect(calcularCoberturaDias(0, 900)).toBe(0);
    });
  });

  describe('calcularReposicaoSugerida', () => {
    it('deve calcular máximo - saldo quando o item estiver abaixo do mínimo', () => {
      // min: 100, max: 500, saldo: 40 -> reposição = 500 - 40 = 460
      expect(calcularReposicaoSugerida(40, 100, 500)).toBe(460);
    });

    it('deve retornar 0 quando o item estiver dentro da faixa', () => {
      expect(calcularReposicaoSugerida(200, 100, 500)).toBe(0);
    });

    it('deve retornar 0 quando o item estiver acima do máximo', () => {
      expect(calcularReposicaoSugerida(600, 100, 500)).toBe(0);
    });
  });

  describe('Validações de Schema (Zod)', () => {
    it('deve rejeitar item onde mínimo é maior ou igual ao máximo', () => {
      const itemInvalido = {
        codigo: 'MAT-001',
        nome: 'Resina Polietileno',
        endereco: 'RUA-A-01',
        categoria: 'Matéria-prima',
        unidade: 'kg',
        min: 500,
        max: 300,
        saldo: 100
      };

      const resultado = criarItemSchema.safeParse(itemInvalido);
      expect(resultado.success).toBe(false);
    });

    it('deve rejeitar valores negativos de estoque', () => {
      const itemComNegativo = {
        codigo: 'MAT-002',
        nome: 'Tinta Flexo Azul',
        endereco: 'RUA-B-02',
        categoria: 'Matéria-prima',
        unidade: 'kg',
        min: -10,
        max: 100,
        saldo: 50
      };

      const resultado = criarItemSchema.safeParse(itemComNegativo);
      expect(resultado.success).toBe(false);
    });
  });
});
