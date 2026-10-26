import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  FileText,
  BarChart3,
  History,
  ArrowLeft,
  Scale
} from 'lucide-react';
import { useAuth } from '../../modules/auth/useAuth.jsx';
import { api } from '../../lib/api.js';

export function Navegacao({ totalSolicitacoesPendentes, modo = 'home' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    podeSolicitar,
    podeVerDashboard,
    podeVerHistorico,
    podeVerAnalise
  } = useAuth();


  const [contadorReal, setContadorReal] = React.useState(totalSolicitacoesPendentes ?? 0);

  React.useEffect(() => {
    if (totalSolicitacoesPendentes !== undefined) {
      setContadorReal(totalSolicitacoesPendentes);
      return;
    }

    let ativo = true;
    api
      .get('/solicitacoes/pendentes/contador')
      .then((res) => {
        if (ativo) setContadorReal(res.data.totalPendentes || 0);
      })
      .catch(() => {});

    return () => {
      ativo = false;
    };
  }, [totalSolicitacoesPendentes]);

  // Definição dos botões de navegação com as variações estéticas do print da Videplast
  const botoes = [
    {
      id: 'solicitacoes',
      label: 'Solicitações',
      path: '/solicitacoes',
      icone: FileText,
      visivel: podeSolicitar,
      contador: contadorReal,
      // Variação: Vermelho sólido com gradiente sutil
      classeHome:
        'bg-gradient-to-r from-[#DC3545] to-[#C82333] text-white hover:from-[#C82333] hover:to-[#BD2130] border border-red-700/20 shadow-sm shadow-red-500/20'
    },
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: '/dashboard',
      icone: BarChart3,
      visivel: podeVerDashboard,
      // Variação: Vermelho vazado
      classeHome:
        'bg-white text-videplast-primary border-2 border-videplast-primary hover:bg-red-50/70 hover:border-videplast-primary-hover shadow-sm'
    },
    {
      id: 'historico',
      label: 'Histórico',
      path: '/historico',
      icone: History,
      visivel: podeVerHistorico,
      // Variação: Cinza vazado
      classeHome:
        'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 hover:border-slate-400 shadow-sm'
    },
    {
      id: 'analise',
      label: 'Análise de Distorção',
      path: '/analise',
      icone: Scale,
      visivel: podeVerAnalise,
      // Variação: Roxo/Índigo elegante destacado
      classeHome:
        'bg-white text-purple-700 border border-purple-200 hover:bg-purple-50/70 hover:border-purple-300 shadow-sm'
    }
  ];


  const botoesVisiveis = botoes.filter((b) => b.visivel);

  if (botoesVisiveis.length === 0 && modo === 'home') {
    return null;
  }

  // Versão Home: Fileira de largura igual ou grade no celular
  if (modo === 'home') {
    return (
      <nav
        aria-label="Navegação rápida de módulos corporativos"
        className="w-full max-w-4xl mx-auto my-6"
      >
        <div className="grid grid-cols-2 sm:grid-cols-3 md:flex md:items-stretch gap-2.5 sm:gap-3">
          {botoesVisiveis.map((btn) => {
            const Icon = btn.icone;
            return (
              <Link
                key={btn.id}
                to={btn.path}
                className={`
                  flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-lg text-xs sm:text-sm
                  font-medium transition-all duration-200 min-h-[48px] select-none text-center relative
                  hover:-translate-y-0.5 active:translate-y-0
                  ${btn.classeHome}
                `}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{btn.label}</span>
                {btn.contador > 0 && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-white text-videplast-primary shadow-sm border border-red-200 shrink-0">
                    {btn.contador}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    );
  }

  // Versão Compacta no topo das outras páginas com botão "Voltar"
  return (
    <div className="w-full bg-white border-b border-slate-200 mb-6 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 overflow-x-auto">
        <button
          type="button"
          onClick={() => navigate('/')}
          className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-700 hover:text-videplast-primary hover:bg-red-50 border border-slate-200 transition-all min-h-[38px] shrink-0 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar<span className="hidden sm:inline"> à Consulta</span></span>
        </button>

        <div className="flex items-center gap-2 shrink-0">
          {botoesVisiveis.map((btn) => {
            const Icon = btn.icone;
            const ativo = location.pathname === btn.path;
            return (
              <Link
                key={btn.id}
                to={btn.path}
                className={`
                  inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium min-h-[38px] transition-all
                  ${
                    ativo
                      ? 'bg-videplast-primary text-white shadow-sm shadow-red-500/20'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{btn.label}</span>
                {btn.contador > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-red-100 text-red-700">
                    {btn.contador}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
