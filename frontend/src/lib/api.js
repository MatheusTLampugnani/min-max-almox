import axios from 'axios';

// Acompanha o subcaminho de publicação (ex.: /minmax/api)
export const API_BASE_URL = `${import.meta.env.BASE_URL}api`;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para injetar o header x-perfil a partir do sessionStorage
api.interceptors.request.use((config) => {
  const perfilSalvo = sessionStorage.getItem('videplast_perfil') || 'almoxarifado';
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
