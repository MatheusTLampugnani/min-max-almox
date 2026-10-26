import { PERFIS, PERFIS_VALIDOS } from './roles.js';
import { ForbiddenError } from '../shared/index.js';

/**
 * Middleware que identifica o perfil atual a partir do header x-perfil.
 * Padrão: 'supervisor' se não especificado.
 */
export function authMiddleware(req, res, next) {
  const headerPerfil = (req.headers['x-perfil'] || '').toString().toLowerCase().trim();

  if (headerPerfil && PERFIS_VALIDOS.includes(headerPerfil)) {
    req.perfil = headerPerfil;
  } else {
    // Perfil default de consulta e solicitação
    req.perfil = PERFIS.SUPERVISOR;
  }

  next();
}

/**
 * Middleware para autorização baseada em perfil.
 * @param {string[]} perfisPermitidos
 */
export function requirePerfil(...perfisPermitidos) {
  return (req, res, next) => {
    const perfilAtual = req.perfil || PERFIS.SUPERVISOR;

    if (!perfisPermitidos.includes(perfilAtual)) {
      return next(
        new ForbiddenError(
          `Perfil '${perfilAtual}' não tem permissão para realizar esta operação.`
        )
      );
    }

    next();
  };
}
