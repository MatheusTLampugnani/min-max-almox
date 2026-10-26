/**
 * Calcula a situação do estoque com base no saldo e limites.
 * - saldo < min: 'abaixo'
 * - saldo > max: 'acima'
 * - caso contrário: 'dentro'
 */
export function calcularSituacao(saldo, min, max) {
  const s = Number(saldo) || 0;
  const m = Number(min) || 0;
  const M = Number(max) || 0;

  if (s < m) return 'abaixo';
  if (s > M) return 'acima';
  return 'dentro';
}

/**
 * Calcula a cobertura de estoque em dias.
 * Fórmula: saldo / (soma das saídas dos últimos 3 meses / 90)
 * Retorna número arredondado em 1 casa decimal, ou null se não houver saídas registradas.
 */
export function calcularCoberturaDias(saldo, somaSaidas3Meses) {
  const s = Number(saldo) || 0;
  const saidas = Number(somaSaidas3Meses) || 0;

  if (saidas <= 0) {
    return null; // Sem saídas nos últimos 3 meses para projetar consumo
  }

  const mediaDiaria = saidas / 90;
  if (mediaDiaria <= 0) return null;

  const dias = s / mediaDiaria;
  return Math.round(dias * 10) / 10;
}

/**
 * Reposição sugerida = máximo - saldo, apenas para itens abaixo do mínimo.
 * Para itens dentro da faixa ou acima, retorna 0.
 */
export function calcularReposicaoSugerida(saldo, min, max) {
  const situacao = calcularSituacao(saldo, min, max);
  if (situacao !== 'abaixo') {
    return 0;
  }
  const reposicao = (Number(max) || 0) - (Number(saldo) || 0);
  return reposicao > 0 ? reposicao : 0;
}
