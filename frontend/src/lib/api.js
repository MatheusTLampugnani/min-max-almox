import axios from 'axios';

<<<<<<< HEAD
export const API_BASE_URL = '/api';
export const STORAGE_KEY_USUARIO = 'videplast_usuario';
=======
// Acompanha o subcaminho de publicação (ex.: /minmax/api)
export const API_BASE_URL = `${import.meta.env.BASE_URL}api`;
>>>>>>> 77f560be5b094337d6efa65e6e543be2b1969a0a

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar os dados do colaborador logado nos headers
api.interceptors.request.use((config) => {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY_USUARIO);
    if (raw) {
      const usuario = JSON.parse(raw);
      if (usuario?.perfil) {
        config.headers['x-perfil'] = usuario.perfil;
      }
      if (usuario?.nomeCompleto) {
        const labelUsuario = usuario.cracha
          ? `${usuario.nomeCompleto} (Crachá: ${usuario.cracha})`
          : usuario.nomeCompleto;
        config.headers['x-usuario'] = encodeURIComponent(labelUsuario);
      }
      if (usuario?.cracha) {
        config.headers['x-cracha'] = String(usuario.cracha);
      }
      if (usuario?.setor) {
        config.headers['x-setor'] = encodeURIComponent(usuario.setor);
      }
      return config;
    }
  } catch {
    // ignora falha de parse
  }

  const perfilSalvo = sessionStorage.getItem('videplast_perfil') || 'supervisor';
  config.headers['x-perfil'] = perfilSalvo;
  return config;
});

// Interceptor para tratamento amigável de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const mensagem =
      error.response?.data?.erro ||
      error.response?.data?.message ||
      error.message ||
      'Erro de comunicação com o servidor';
    return Promise.reject(new Error(mensagem));
  }
);
