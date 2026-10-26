/**
 * Helper centralizado para formatar erros do Zod.
 * Compatível com Zod 3 (error.errors) e Zod 4 (error.issues).
 */
export function getZodErrorMessage(error) {
  if (!error) return 'Erro de validação desconhecido';

  const issues = error.issues || error.errors;
  if (!Array.isArray(issues) || issues.length === 0) {
    return error.message || 'Erro de validação nos dados fornecidos';
  }

  // Mapeia os campos e mensagens
  return issues
    .map((issue) => {
      const path = issue.path && issue.path.length > 0 ? issue.path.join('.') : 'campo';
      return `${path}: ${issue.message}`;
    })
    .join('; ');
}
