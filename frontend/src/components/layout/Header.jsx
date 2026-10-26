import React from 'react';
import { User, ChevronDown } from 'lucide-react';
import { useAuth, PERFIS, ROTULOS_PERFIS } from '../../modules/auth/useAuth.jsx';
import { Link } from 'react-router-dom';

export function Header() {
  const { perfil, setPerfil, rotuloPerfil } = useAuth();

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-40 shadow-sm transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between relative">
        {/* Lado Esquerdo: Logotipo Oficial da Videplast */}
        <div className="flex items-center">
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

        {/* Lado Direito: Chip de Usuário / Seletor de Perfil Elegante */}
        <div className="flex items-center justify-end">
          <div className="relative group inline-flex items-center bg-white hover:bg-slate-50/80 border border-slate-200 hover:border-slate-300 rounded-full pl-2 pr-3 py-1.5 shadow-sm transition-all duration-150">
            {/* Avatar com indicador de status online */}
            <div className="relative mr-2.5">
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-red-600 to-red-500 text-white flex items-center justify-center shadow-sm">
                <User className="w-4 h-4" />
              </div>
              <span
                className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border-2 border-white rounded-full"
                title="Sessão ativa"
              />
            </div>

            {/* Texto e seletor provisório */}
            <div className="flex flex-col text-left mr-2">
              <span className="text-[10px] text-slate-400 font-medium leading-none">
                Olá, {rotuloPerfil}
              </span>
              <label htmlFor="seletor-perfil-header" className="sr-only">
                Seletor de perfil de acesso
              </label>
              <select
                id="seletor-perfil-header"
                value={perfil}
                onChange={(e) => setPerfil(e.target.value)}
                className="text-xs font-bold text-slate-800 bg-transparent border-0 p-0 pr-4 focus:ring-0 cursor-pointer appearance-none outline-none hover:text-videplast-brand transition-colors"
              >
                <option value={PERFIS.SUPERVISOR}>{ROTULOS_PERFIS[PERFIS.SUPERVISOR]}</option>
                <option value={PERFIS.ALMOXARIFADO}>{ROTULOS_PERFIS[PERFIS.ALMOXARIFADO]}</option>
              </select>
            </div>

            <ChevronDown className="w-3.5 h-3.5 text-slate-400 pointer-events-none -ml-3 transition-transform group-hover:translate-y-0.5" />
          </div>
        </div>
      </div>
    </header>
  );
}
