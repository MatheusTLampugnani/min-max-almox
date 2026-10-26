import React, { createContext, useContext, useState, useEffect } from 'react';

export const PERFIS = {
  SUPERVISOR: 'supervisor',
  ALMOXARIFADO: 'almoxarifado'
};

export const ROTULOS_PERFIS = {
  [PERFIS.SUPERVISOR]: 'Supervisor',
  [PERFIS.ALMOXARIFADO]: 'Almoxarifado'
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [perfil, setPerfilState] = useState(() => {
    const salvo = sessionStorage.getItem('videplast_perfil');
    if (salvo === PERFIS.SUPERVISOR || salvo === PERFIS.ALMOXARIFADO) {
      return salvo;
    }
    return PERFIS.ALMOXARIFADO;
  });

  const setPerfil = (novoPerfil) => {
    sessionStorage.setItem('videplast_perfil', novoPerfil);
    setPerfilState(novoPerfil);
  };

  // Matriz de permissões por perfil (Supervisor e Almoxarifado)
  const permissoes = {
    // Supervisor: consulta, detalhe + criar e acompanhar solicitações
    isSupervisor: perfil === PERFIS.SUPERVISOR,
    // Almoxarifado: acesso total (gestão, aprovação, parâmetros, importação)
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
        perfil,
        setPerfil,
        rotuloPerfil: ROTULOS_PERFIS[perfil] || 'Usuário',
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
