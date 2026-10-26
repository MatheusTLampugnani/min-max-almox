/**
 * Utilitários de formatação para padrão brasileiro (pt-BR)
 */

export function formatarNumero(valor, decimais = 2) {
  if (valor === null || valor === undefined || isNaN(valor)) return '0';
  return Number(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimais
  });
}

export function formatarData(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return '-';
  return data.toLocaleDateString('pt-BR');
}

export function formatarDataHora(dataString) {
  if (!dataString) return '-';
  const data = new Date(dataString);
  if (isNaN(data.getTime())) return '-';
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function formatarQuantidade(valor, unidade) {
  const num = formatarNumero(valor);
  return unidade ? `${num} ${unidade}` : num;
}
