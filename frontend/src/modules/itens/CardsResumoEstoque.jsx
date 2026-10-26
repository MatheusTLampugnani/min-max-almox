import React from 'react';
import { Package, AlertTriangle, CheckCircle2, ArrowUpRight } from 'lucide-react';

export function CardsResumoEstoque({ itens = [], situacaoAtiva = '', onSelecionarSituacao }) {
  // Contadores dinâmicos calculados a partir da lista
  const totais = itens.reduce(
    (acc, item) => {
      acc.total++;
      if (item.situacao === 'abaixo') acc.abaixo++;
      else if (item.situacao === 'acima') acc.acima++;
      else acc.dentro++;
      return acc;
    },
    { total: 0, abaixo: 0, dentro: 0, acima: 0 }
  );

  const cards = [
    {
      id: '',
      titulo: 'Total Monitorado',
      quantidade: totais.total,
      icone: Package,
      corIcone: 'text-slate-600 bg-slate-100',
      bordaAtiva: 'border-slate-800 ring-2 ring-slate-800/10 bg-slate-50/50',
      tag: 'Geral'
    },
    {
      id: 'abaixo',
      titulo: 'Abaixo do Mínimo',
      quantidade: totais.abaixo,
      icone: AlertTriangle,
      corIcone: 'text-red-600 bg-red-100',
      bordaAtiva: 'border-red-600 ring-2 ring-red-600/15 bg-red-50/40',
      tag: 'Crítico',
      alerta: totais.abaixo > 0
    },
    {
      id: 'dentro',
      titulo: 'Dentro da Faixa',
      quantidade: totais.dentro,
      icone: CheckCircle2,
      corIcone: 'text-emerald-600 bg-emerald-100',
      bordaAtiva: 'border-emerald-600 ring-2 ring-emerald-600/15 bg-emerald-50/40',
      tag: 'Normal'
    },
    {
      id: 'acima',
      titulo: 'Acima do Máximo',
      quantidade: totais.acima,
      icone: ArrowUpRight,
      corIcone: 'text-amber-600 bg-amber-100',
      bordaAtiva: 'border-amber-500 ring-2 ring-amber-500/15 bg-amber-50/40',
      tag: 'Excesso'
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto my-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {cards.map((c) => {
          const Icon = c.icone;
          const isAtivo = situacaoAtiva === c.id;

          return (
            <button
              key={c.id || 'todos'}
              type="button"
              onClick={() => onSelecionarSituacao(isAtivo ? '' : c.id)}
              className={`
                flex items-center justify-between p-3 sm:p-3.5 rounded-xl border bg-white text-left transition-all duration-200
                shadow-xs hover:shadow-md hover:-translate-y-0.5 select-none
                ${
                  isAtivo
                    ? c.bordaAtiva
                    : 'border-slate-200/90 hover:border-slate-300'
                }
              `}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${c.corIcone}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {c.titulo}
                  </span>
                  <span className="text-lg sm:text-xl font-extrabold text-slate-800 leading-tight">
                    {c.quantidade}
                  </span>
                </div>
              </div>

              <span
                className={`
                  hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider
                  ${
                    c.id === 'abaixo'
                      ? 'bg-red-50 text-red-700 border border-red-200'
                      : c.id === 'acima'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : c.id === 'dentro'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }
                `}
              >
                {c.tag}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
