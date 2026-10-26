/**
 * Formata números no padrão pt-BR (ex: 1.234,56 ou 1.234)
 */
export function formatNumberBr(value, decimals = 2) {
  if (value === null || value === undefined || isNaN(value)) return '0';
  return Number(value).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals
  });
}

/**
 * Formata datas no padrão dd/mm/aaaa
 */
export function formatDateBr(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('pt-BR');
}
