import React from 'react';
import { User, LogOut, Building2, CreditCard } from 'lucide-react';
import { useAuth } from '../../modules/auth/useAuth.jsx';
import { Link } from 'react-router-dom';

export function Header() {
  const {
    nomeCompleto,
    cracha,
    setor,
    rotuloPerfil,
    isAlmoxarifado,
    logout
  } = useAuth();

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3">
        {/* Lado Esquerdo: Logotipo Oficial da Videplast */}
        <div className="flex items-center shrink-0">
          <Link
            to="/"
            className="flex items-center group transition-transform hover:scale-[1.01]"
            aria-label="Videplast - Página Inicial"
          >
            <img
              src="/videplast-brand.png"
              alt="Logo Videplast"
              className="h-7 sm:h-8 md:h-9 w-auto object-contain transition-all"
            />
          </Link>
        </div>

        {/* Lado Direito: Dados Reais do Colaborador Logado + Botão Sair */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 min-w-0">
          <div className="inline-flex items-center bg-slate-50/90 border border-slate-200 rounded-full pl-2 pr-3.5 py-1.5 shadow-2xs min-w-0">
            {/* Avatar com indicador de status online */}
            <div className="relative mr-2.5 shrink-0">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-xs">
                <User className="w-4 h-4" />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"
                title="Sessão ativa"
              />
            </div>

            {/* Nome Completo, Crachá, Setor e Perfil */}
            <div className="flex flex-col text-left min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-900 truncate max-w-[140px] sm:max-w-[240px]">
                  {nomeCompleto || 'Colaborador'}
                </span>
                <span
                  className={`hidden sm:inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                    isAlmoxarifado
                      ? 'bg-red-100 text-videplast-primary border border-red-200'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {rotuloPerfil}
                </span>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 font-medium truncate">
                <span className="inline-flex items-center gap-1">
                  <CreditCard className="w-3 h-3 text-slate-400" />
                  Crachá: <strong className="text-slate-700">{cracha}</strong>
                </span>
                {setor && (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1 truncate">
                      <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                      <strong className="text-slate-700 truncate">{setor}</strong>
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={logout}
            title="Sair / Trocar Crachá"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all shadow-2xs shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
