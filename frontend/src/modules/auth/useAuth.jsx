import React, { createContext, useContext, useState } from 'react';
import { api, STORAGE_KEY_USUARIO } from '../../lib/api.js';

export const PERFIS = {
  SUPERVISOR: 'supervisor',
  ALMOXARIFADO: 'almoxarifado'
};

export const ROTULOS_PERFIS = {
  [PERFIS.SUPERVISOR]: 'Supervisor',
  [PERFIS.ALMOXARIFADO]: 'Almoxarifado'
};

const AuthContext = createContext(null);

function carregarUsuarioSalvo() {
  try {
    const salvo = sessionStorage.getItem(STORAGE_KEY_USUARIO);
    if (!salvo) return null;
    const parsed = JSON.parse(salvo);
    if (parsed && parsed.cracha && parsed.nomeCompleto && parsed.perfil) {
      return parsed;
    }
  } catch {
    // ignora sessão inválida
  }
  return null;
}

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(() => carregarUsuarioSalvo());

  const loginPorCracha = async (crachaInput) => {
    const crachaLimpo = String(crachaInput || '').trim();
    const res = await api.post('/auth/login', { cracha: crachaLimpo });
    const dadosUsuario = res.data.data;

    sessionStorage.setItem(STORAGE_KEY_USUARIO, JSON.stringify(dadosUsuario));
    sessionStorage.setItem('videplast_perfil', dadosUsuario.perfil);
    setUsuario(dadosUsuario);
    return dadosUsuario;
  };

  const logout = () => {
    sessionStorage.removeItem(STORAGE_KEY_USUARIO);
    sessionStorage.removeItem('videplast_perfil');
    setUsuario(null);
  };

  const perfil = usuario?.perfil || PERFIS.SUPERVISOR;
  const autenticado = Boolean(usuario);

  // Matriz de permissões por perfil (Supervisor e Almoxarifado)
  const permissoes = {
    isSupervisor: perfil === PERFIS.SUPERVISOR,
    isAlmoxarifado: perfil === PERFIS.ALMOXARIFADO,

    podeConsultar: true,
    podeSolicitar: true,
    podeAprovar: perfil === PERFIS.ALMOXARIFADO,
    podeVerDashboard: perfil === PERFIS.ALMOXARIFADO,
    podeVerHistorico: perfil === PERFIS.ALMOXARIFADO,
    podeVerAnalise: true
  };

  return (
    <AuthContext.Provider
      value={{
        usuario,
        autenticado,
        cracha: usuario?.cracha || '',
        nomeCompleto: usuario?.nomeCompleto || '',
        setor: usuario?.setor || '',
        perfil,
        rotuloPerfil: ROTULOS_PERFIS[perfil] || 'Supervisor',
        loginPorCracha,
        logout,
        ...permissoes
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
}
