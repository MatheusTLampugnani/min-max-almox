import { describe, it, expect } from 'vitest';
import { dashboardService } from './service.js';

describe('Módulo de Dashboard (Métricas e Analytics)', () => {
  it('deve retornar KPIs calculados corretamente a partir do estoque', async () => {
    const dados = await dashboardService.obterMetricas();
    expect(dados).toBeDefined();
    expect(dados.kpis).toBeDefined();
    expect(dados.kpis.totalMateriais).toBeGreaterThan(1000);
    expect(dados.kpis.abaixoMinimo).toBeGreaterThanOrEqual(0);
    expect(dados.kpis.estoqueNormal).toBeGreaterThan(0);
    expect(dados.kpis.acimaMaximo).toBeGreaterThanOrEqual(0);
  });

  it('deve conter estrutura para gráfico de distribuição de status', async () => {
    const dados = await dashboardService.obterMetricas();
    expect(Array.isArray(dados.distribuicaoStatus)).toBe(true);
    expect(dados.distribuicaoStatus.length).toBe(3);
    const totalStatus = dados.distribuicaoStatus.reduce((acc, s) => acc + s.valor, 0);
    expect(totalStatus).toBe(dados.kpis.totalMateriais);
  });

  it('deve retornar ranking de top consumidos e itens críticos', async () => {
    const dados = await dashboardService.obterMetricas();
    expect(Array.isArray(dados.topConsumidos)).toBe(true);
    expect(dados.topConsumidos.length).toBeLessThanOrEqual(8);

    expect(Array.isArray(dados.itensCriticos)).toBe(true);
    expect(dados.itensCriticos.length).toBeLessThanOrEqual(10);
    dados.itensCriticos.forEach((it) => {
      expect(it.saldo).toBeLessThan(it.min);
    });
  });
});
