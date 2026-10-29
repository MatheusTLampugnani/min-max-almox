import { PERFIS, PERFIS_VALIDOS } from './roles.js';
import { ForbiddenError } from '../shared/index.js';

/**
 * Middleware que identifica o perfil e os dados do colaborador logado a partir dos headers.
 * Padrão: 'supervisor' se não especificado.
 */
export function authMiddleware(req, res, next) {
  const headerPerfil = (req.headers['x-perfil'] || '').toString().toLowerCase().trim();

  if (headerPerfil && PERFIS_VALIDOS.includes(headerPerfil)) {
    req.perfil = headerPerfil;
  } else {
    req.perfil = PERFIS.SUPERVISOR;
  }

  req.usuario = req.headers['x-usuario']
    ? decodeURIComponent(String(req.headers['x-usuario']))
    : null;
  req.cracha = req.headers['x-cracha'] ? String(req.headers['x-cracha']).trim() : null;
  req.setor = req.headers['x-setor']
    ? decodeURIComponent(String(req.headers['x-setor']))
    : null;

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
