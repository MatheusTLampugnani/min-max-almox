import React, { useState } from 'react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Input } from '../../components/ui/Input.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { api } from '../../lib/api.js';
import { formatarQuantidade } from '../../lib/formatters.js';
import { FileText, AlertCircle, Send, Check } from 'lucide-react';

const SETORES_OPCOES = [
  'Extrusão',
  'Impressão',
  'Corte e Solda',
  'Manutenção',
  'Expedição'
];

export function NovaSolicitacaoModal({
  item,
  isOpen,
  onClose,
  onSucesso
}) {
  const { addToast } = useToast();

  const [novoMin, setNovoMin] = useState('');
  const [novoMax, setNovoMax] = useState('');
  const [justificativa, setJustificativa] = useState('');
  const [setor, setSetor] = useState('Extrusão');
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState('');

  // Ao abrir com um item, preenche sugestão inicial baseada no atual
  React.useEffect(() => {
    if (item && isOpen) {
      setNovoMin(item.min.toString());
      setNovoMax(item.max.toString());
      setJustificativa('');
      setErro('');
    }
  }, [item, isOpen]);

  if (!item) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    const minNum = Number(novoMin);
    const maxNum = Number(novoMax);

    if (isNaN(minNum) || isNaN(maxNum) || minNum < 0 || maxNum < 0) {
      setErro('Os valores de estoque mínimo e máximo devem ser numéricos e maiores ou iguais a zero.');
      return;
    }

    if (minNum >= maxNum) {
      setErro('A nova quantidade mínima deve ser menor que a nova quantidade máxima.');
      return;
    }

    if (!justificativa || justificativa.trim().length < 5) {
      setErro('A justificativa da alteração é obrigatória (mínimo de 5 caracteres).');
      return;
    }

    try {
      setEnviando(true);
      await api.post('/solicitacoes', {
        itemId: item.id,
        novoMin: minNum,
        novoMax: maxNum,
        justificativa: justificativa.trim(),
        solicitante: 'Supervisor',
        setor
      });

      addToast('Solicitação de alteração enviada com sucesso para o Almoxarifado!', 'sucesso');
      if (onSucesso) onSucesso();
      onClose();
    } catch (err) {
      setErro(err.message || 'Erro ao enviar solicitação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitar Alteração de Mínimo / Máximo"
      subtitle={`Material: ${item.codigo} - ${item.nome}`}
      maxWidth="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-left">
        {/* Resumo Atual */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block font-semibold uppercase text-[10px]">
              Parâmetros Atuais
            </span>
            <div className="font-bold text-slate-800 mt-0.5">
              Mín: {formatarQuantidade(item.min, item.unidade)} • Máx: {formatarQuantidade(item.max, item.unidade)}
            </div>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block font-semibold uppercase text-[10px]">
              Saldo em Estoque
            </span>
            <span className="font-bold text-slate-800">
              {formatarQuantidade(item.saldo, item.unidade)}
            </span>
          </div>
        </div>

        {/* Setor do Supervisor */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Setor Solicitante
          </label>
          <select
            value={setor}
            onChange={(e) => setSetor(e.target.value)}
            className="w-full rounded-corp border border-slate-200 bg-white text-slate-800 px-3.5 py-2.5 text-sm focus:border-videplast-primary outline-none min-h-[44px]"
          >
            {SETORES_OPCOES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Novos Valores Propostos */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label={`Novo Mínimo (${item.unidade})`}
            type="number"
            value={novoMin}
            onChange={(e) => setNovoMin(e.target.value)}
            required
          />
          <Input
            label={`Novo Máximo (${item.unidade})`}
            type="number"
            value={novoMax}
            onChange={(e) => setNovoMax(e.target.value)}
            required
          />
        </div>

        {/* Justificativa Obrigatória */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Justificativa da Alteração <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={3}
            value={justificativa}
            onChange={(e) => setJustificativa(e.target.value)}
            placeholder="Descreva o motivo da solicitação (ex: Aumento de produção previsto, alteração no ciclo de consumo, sazonalidade...)"
            className="w-full rounded-corp border border-slate-200 bg-white text-slate-800 p-3 text-sm focus:border-videplast-primary focus:ring-1 focus:ring-videplast-primary outline-none resize-none placeholder-slate-400"
            required
          />
          <span className="text-[11px] text-slate-400 mt-1 block">
            Esta justificativa será avaliada pelo time do Almoxarifado para aprovação.
          </span>
        </div>

        {erro && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        <div className="pt-2 flex justify-end gap-2.5 border-t border-slate-100">
          <Button variant="outline-secondary" size="md" onClick={onClose} disabled={enviando}>
            Cancelar
          </Button>
          <Button variant="primary" size="md" type="submit" loading={enviando}>
            <Send className="w-4 h-4" />
            Enviar Solicitação ao Almoxarifado
          </Button>
        </div>
      </form>
    </Modal>
  );
}
