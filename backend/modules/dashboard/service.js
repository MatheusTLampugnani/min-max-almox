import { itensService } from '../itens/index.js';
import { solicitacoesService } from '../solicitacoes/index.js';
import { formatarCategoria } from '../itens/categoriasSap.js';

export const dashboardService = {
  async obterMetricas({ categoria = '' } = {}) {
    const todosItens = await itensService.consultarItens({ categoria });
    const pendentesCount = await solicitacoesService.contarPendentes();

    const total = todosItens.length;
    let abaixoMin = 0;
    let dentroNormal = 0;
    let acimaMax = 0;
    let coberturaCritica = 0;

    const mapaCategorias = new Map();

    for (const item of todosItens) {
      if (item.saldo < item.min) {
        abaixoMin++;
      } else if (item.saldo > item.max) {
        acimaMax++;
      } else {
        dentroNormal++;
      }

      if (item.coberturaDias !== null && item.coberturaDias < 30) {
        coberturaCritica++;
      }

      // Agrupamento por categoria formatada (cod. categoria - nome categoria)
      const cat = formatarCategoria(item.categoria);
      if (!mapaCategorias.has(cat)) {
        mapaCategorias.set(cat, {
          categoria: cat,
          totalItens: 0,
          abaixo: 0,
          normal: 0,
          acima: 0,
          consumoMedioTotal: 0,
          unidades: {}
        });
      }

      const dadosCat = mapaCategorias.get(cat);
      dadosCat.totalItens++;
      if (item.saldo < item.min) dadosCat.abaixo++;
      else if (item.saldo > item.max) dadosCat.acima++;
      else dadosCat.normal++;

      const consumo = Number(item.consumoMedioPlanilha) || 0;
      dadosCat.consumoMedioTotal += consumo;

      const un = item.unidade || 'und';
      dadosCat.unidades[un] = (dadosCat.unidades[un] || 0) + 1;
    }

    // Calcula unidade predominante de cada categoria para integridade de unidade
    const resumoCategorias = Array.from(mapaCategorias.values()).map((c) => {
      let unPred = 'und';
      let maxCont = 0;
      for (const [u, qtd] of Object.entries(c.unidades)) {
        if (qtd > maxCont) {
          maxCont = qtd;
          unPred = u;
        }
      }
      return {
        categoria: c.categoria,
        totalItens: c.totalItens,
        abaixo: c.abaixo,
        normal: c.normal,
        acima: c.acima,
        consumoMedioTotal: Math.round(c.consumoMedioTotal),
        unidadePredominante: unPred
      };
    });

    // Ordenação do resumo de categorias por total de itens
    resumoCategorias.sort((a, b) => b.totalItens - a.totalItens);

    // Distribuição de status para gráfico de rosca
    const pctAbaixo = total > 0 ? Number(((abaixoMin / total) * 100).toFixed(1)) : 0;
    const pctNormal = total > 0 ? Number(((dentroNormal / total) * 100).toFixed(1)) : 0;
    const pctAcima = total > 0 ? Number(((acimaMax / total) * 100).toFixed(1)) : 0;

    const distribuicaoStatus = [
      { name: 'Abaixo do Mínimo', valor: abaixoMin, percentual: pctAbaixo, cor: '#DC2626' },
      { name: 'Estoque Conforme', valor: dentroNormal, percentual: pctNormal, cor: '#16A34A' },
      { name: 'Acima do Máximo', valor: acimaMax, percentual: pctAcima, cor: '#D97706' }
    ];

    // Top 8 Materiais mais consumidos mensalmente
    const topConsumidos = [...todosItens]
      .sort((a, b) => (Number(b.consumoMedioPlanilha) || 0) - (Number(a.consumoMedioPlanilha) || 0))
      .slice(0, 8)
      .map((it) => ({
        id: it.id,
        codigo: it.codigo,
        nome: it.nome,
        categoria: it.categoria,
        unidade: it.unidade,
        saldo: it.saldo,
        min: it.min,
        max: it.max,
        consumoMensal: Math.round(Number(it.consumoMedioPlanilha) || 0)
      }));

    // Top 10 Itens Críticos que exigem reposição imediata (maior déficit)
    const itensCriticos = todosItens
      .filter((it) => it.saldo < it.min)
      .sort((a, b) => (b.min - b.saldo) - (a.min - a.saldo))
      .slice(0, 10)
      .map((it) => ({
        id: it.id,
        codigo: it.codigo,
        nome: it.nome,
        categoria: it.categoria,
        unidade: it.unidade,
        saldo: it.saldo,
        min: it.min,
        max: it.max,
        deficit: it.min - it.saldo,
        reposicaoSugerida: it.reposicaoSugerida,
        coberturaDias: it.coberturaDias
      }));

    // Top 10 Itens com Excesso de Estoque (capital imobilizado)
    const itensExcesso = todosItens
      .filter((it) => it.saldo > it.max)
      .sort((a, b) => (b.saldo - b.max) - (a.saldo - a.max))
      .slice(0, 10)
      .map((it) => ({
        id: it.id,
        codigo: it.codigo,
        nome: it.nome,
        categoria: it.categoria,
        unidade: it.unidade,
        saldo: it.saldo,
        min: it.min,
        max: it.max,
        excesso: it.saldo - it.max,
        coberturaDias: it.coberturaDias
      }));

    return {
      kpis: {
        totalMateriais: total,
        abaixoMinimo: abaixoMin,
        percentualAbaixo: pctAbaixo,
        estoqueNormal: dentroNormal,
        percentualNormal: pctNormal,
        acimaMaximo: acimaMax,
        percentualAcima: pctAcima,
        coberturaCritica,
        solicitacoesPendentes: pendentesCount
      },
      distribuicaoStatus,
      consumoPorCategoria: resumoCategorias,
      topConsumidos,
      itensCriticos,
      itensExcesso
    };
  }
};
