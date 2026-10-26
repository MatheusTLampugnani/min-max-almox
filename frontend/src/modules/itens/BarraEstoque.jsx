import React from 'react';
import { formatarNumero } from '../../lib/formatters.js';

export function BarraEstoque({ saldo, min, max, unidade = '', situacao }) {
  const s = Number(saldo) || 0;
  const m = Number(min) || 0;
  const M = Number(max) || 0;

  // Escala visual da barra: limite visual é 115% do máximo (ou 110% do saldo caso este supere o max)
  const limiteVisual = Math.max(M * 1.15, s * 1.08, 1);
  const pctSaldo = Math.min(100, Math.max(0, (s / limiteVisual) * 100));
  const pctMin = Math.min(100, Math.max(0, (m / limiteVisual) * 100));
  const pctMax = Math.min(100, Math.max(0, (M / limiteVisual) * 100));

  // Gradientes e sombras por situação de estoque
  let estiloGradiente = 'bg-gradient-to-r from-emerald-500 to-emerald-600 shadow-xs shadow-emerald-500/30';
  let badgeCor = 'text-emerald-700 bg-emerald-50 border-emerald-200';

  if (situacao === 'abaixo' || s < m) {
    estiloGradiente = 'bg-gradient-to-r from-rose-500 to-red-600 shadow-xs shadow-red-500/30';
    badgeCor = 'text-red-700 bg-red-50 border-red-200';
  } else if (situacao === 'acima' || s > M) {
    estiloGradiente = 'bg-gradient-to-r from-amber-400 to-amber-500 shadow-xs shadow-amber-500/30';
    badgeCor = 'text-amber-800 bg-amber-50 border-amber-300';
  }

  return (
    <div className="w-full min-w-[190px] max-w-[240px] flex flex-col gap-1.5 text-left py-1">
      {/* Valor do saldo em evidência com badge da unidade */}
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
          Saldo:
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-extrabold border ${badgeCor}`}>
            {formatarNumero(s)} {unidade}
          </span>
        </span>
        <span className="text-[10px] text-slate-400 font-medium">
          {Math.round((s / (M || 1)) * 100)}% do máx
        </span>
      </div>

      {/* Pista da barra com marcadores visuais precisos */}
      <div className="relative w-full h-3 bg-slate-100 rounded-full overflow-hidden border border-slate-200/80 shadow-inner">
        {/* Barra de preenchimento dinâmico */}
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${estiloGradiente}`}
          style={{ width: `${pctSaldo}%` }}
        />

        {/* Linha de Marcação do Mínimo */}
        {pctMin > 0 && pctMin <= 100 && (
          <div
            title={`Limite Mínimo: ${formatarNumero(m)} ${unidade}`}
            className="absolute top-0 bottom-0 w-[2.5px] bg-red-600 z-10 opacity-90 shadow-xs"
            style={{ left: `${pctMin}%` }}
          />
        )}

        {/* Linha de Marcação do Máximo */}
        {pctMax > 0 && pctMax <= 100 && (
          <div
            title={`Limite Máximo: ${formatarNumero(M)} ${unidade}`}
            className="absolute top-0 bottom-0 w-[2.5px] bg-slate-700 z-10 opacity-90 shadow-xs"
            style={{ left: `${pctMax}%` }}
          />
        )}
      </div>

      {/* Marcadores de rodapé com MÍN e MÁX */}
      <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold leading-none px-0.5">
        <span title="Estoque Mínimo Definido" className="hover:text-red-600 transition-colors">
          Mín: <strong className="text-slate-600">{formatarNumero(m)}</strong>
        </span>
        <span title="Estoque Máximo Definido" className="hover:text-slate-700 transition-colors">
          Máx: <strong className="text-slate-600">{formatarNumero(M)}</strong>
        </span>
      </div>
    </div>
  );
}
