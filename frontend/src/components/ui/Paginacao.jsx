import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';

export function Paginacao({
  paginaAtual = 1,
  totalItens = 0,
  itensPorPagina = 25,
  onMudarPagina,
  onMudarItensPorPagina,
  opcoesItensPorPagina = [15, 25, 50, 100],
  className = ''
}) {
  const totalPaginas = Math.max(1, Math.ceil(totalItens / itensPorPagina));
  const inicio = totalItens === 0 ? 0 : (paginaAtual - 1) * itensPorPagina + 1;
  const fim = Math.min(totalItens, paginaAtual * itensPorPagina);

  // Gera lista inteligente de páginas com elipses
  function gerarNumerosPaginas() {
    const delta = 2; // páginas antes e depois da atual
    const range = [];
    const rangeComPontos = [];
    let l;

    for (let i = 1; i <= totalPaginas; i++) {
      if (
        i === 1 ||
        i === totalPaginas ||
        (i >= paginaAtual - delta && i <= paginaAtual + delta)
      ) {
        range.push(i);
      }
    }

    for (const i of range) {
      if (l) {
        if (i - l === 2) {
          rangeComPontos.push(l + 1);
        } else if (i - l !== 1) {
          rangeComPontos.push('...');
        }
      }
      rangeComPontos.push(i);
      l = i;
    }

    return rangeComPontos;
  }

  const paginas = gerarNumerosPaginas();

  if (totalItens <= 0) return null;

  return (
    <div
      className={`w-full bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-slate-600 ${className}`}
    >
      {/* Lado Esquerdo: Info e Seletor de Itens por Página */}
      <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 w-full md:w-auto">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500 font-medium">Itens por página:</span>
          <select
            value={itensPorPagina}
            onChange={(e) => {
              if (onMudarItensPorPagina) {
                onMudarItensPorPagina(Number(e.target.value));
              }
            }}
            className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 font-bold text-slate-800 outline-none focus:border-videplast-primary focus:bg-white cursor-pointer transition-colors"
          >
            {opcoesItensPorPagina.map((qtd) => (
              <option key={qtd} value={qtd}>
                {qtd}
              </option>
            ))}
          </select>
        </div>

        <span className="hidden sm:inline text-slate-300">|</span>

        <span className="font-medium text-slate-600 text-center">
          Mostrando <strong>{inicio}</strong> a <strong>{fim}</strong> de{' '}
          <strong>{totalItens.toLocaleString('pt-BR')}</strong> materiais
        </span>
      </div>

      {/* Lado Direito: Botões de Navegação de Página */}
      <div className="flex items-center gap-1 select-none">
        {/* Ir para Primeira Página */}
        <button
          type="button"
          disabled={paginaAtual <= 1}
          onClick={() => onMudarPagina(1)}
          title="Primeira página"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        {/* Anterior */}
        <button
          type="button"
          disabled={paginaAtual <= 1}
          onClick={() => onMudarPagina(paginaAtual - 1)}
          title="Página anterior"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Indicador simples para mobile */}
        <span className="inline-block sm:hidden px-3 py-1 font-bold text-slate-800">
          {paginaAtual} / {totalPaginas}
        </span>

        {/* Botões numéricos de páginas (Desktop/Tablet) */}
        <div className="hidden sm:flex items-center gap-1">
          {paginas.map((p, idx) => {
            if (p === '...') {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-slate-400 font-bold"
                >
                  ...
                </span>
              );
            }

            const isAtiva = p === paginaAtual;

            return (
              <button
                key={`page-${p}`}
                type="button"
                onClick={() => onMudarPagina(p)}
                className={`
                  min-w-[34px] min-h-[34px] px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center justify-center
                  ${
                    isAtiva
                      ? 'bg-videplast-primary text-white border border-videplast-primary shadow-xs'
                      : 'border border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }
                `}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Próxima */}
        <button
          type="button"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => onMudarPagina(paginaAtual + 1)}
          title="Próxima página"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ir para Última Página */}
        <button
          type="button"
          disabled={paginaAtual >= totalPaginas}
          onClick={() => onMudarPagina(totalPaginas)}
          title="Última página"
          className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[34px] min-w-[34px] flex items-center justify-center"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
