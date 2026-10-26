import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export function DataTable({
  colunas = [],
  dados = [],
  chaveId = 'id',
  onLinhaClick,
  ordenacaoAtual = { coluna: null, direcao: 'asc' },
  onOrdenar,
  renderCardMobile,
  className = ''
}) {
  return (
    <div className={`w-full ${className}`}>
      {/* Visualização Mobile: Cards individuais */}
      <div className="block md:hidden space-y-3">
        {dados.map((item, index) => {
          if (renderCardMobile) {
            return (
              <div
                key={item[chaveId] || index}
                onClick={() => onLinhaClick && onLinhaClick(item)}
              >
                {renderCardMobile(item)}
              </div>
            );
          }
          return null;
        })}
      </div>

      {/* Visualização Desktop/Tablet: Tabela elegante */}
      <div className="hidden md:block overflow-x-auto rounded-corp border border-videplast-border bg-white shadow-sm">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="bg-gray-50/80 border-b border-videplast-border">
              {colunas.map((col) => {
                const isSorted = ordenacaoAtual?.coluna === col.campo;
                return (
                  <th
                    key={col.campo}
                    scope="col"
                    onClick={() => col.ordenavel && onOrdenar && onOrdenar(col.campo)}
                    className={`
                      px-4 py-3 text-xs font-semibold uppercase tracking-wider text-gray-600 select-none
                      ${col.ordenavel ? 'cursor-pointer hover:bg-gray-100/70 transition-colors' : ''}
                      ${col.className || ''}
                    `}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>{col.titulo}</span>
                      {col.ordenavel && (
                        <span className="text-gray-400">
                          {isSorted ? (
                            ordenacaoAtual.direcao === 'asc' ? (
                              <ArrowUp className="w-3.5 h-3.5 text-videplast-primary" />
                            ) : (
                              <ArrowDown className="w-3.5 h-3.5 text-videplast-primary" />
                            )
                          ) : (
                            <ArrowUpDown className="w-3.5 h-3.5 opacity-50" />
                          )}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {dados.map((item, idx) => (
              <tr
                key={item[chaveId] || idx}
                onClick={() => onLinhaClick && onLinhaClick(item)}
                className={`
                  transition-colors
                  ${onLinhaClick ? 'cursor-pointer hover:bg-red-50/40' : 'hover:bg-gray-50/50'}
                  ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/20'}
                `}
              >
                {colunas.map((col) => (
                  <td
                    key={col.campo}
                    className={`px-4 py-3.5 align-middle ${col.tdClassName || ''}`}
                  >
                    {col.render ? col.render(item) : item[col.campo]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
