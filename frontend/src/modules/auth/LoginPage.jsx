import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from './useAuth.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { useToast } from '../../components/ui/Toast.jsx';
import { CreditCard, LogIn, AlertCircle, ShieldCheck, Building2 } from 'lucide-react';

export function LoginPage() {
  const { loginPorCracha } = useAuth();
  const { addToast } = useToast();

  const [cracha, setCracha] = useState('');
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState('');
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setErro('');

    const valor = cracha.trim();
    if (!valor) {
      setErro('Digite o número do seu crachá para acessar o sistema.');
      inputRef.current?.focus();
      return;
    }

    try {
      setCarregando(true);
      const dados = await loginPorCracha(valor);
      addToast(
        `Bem-vindo(a), ${dados.nomeCompleto}! (${dados.setor})`,
        'sucesso'
      );
    } catch (err) {
      setErro(err.message || 'Não foi possível validar o crachá.');
      inputRef.current?.focus();
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-videplast-bg flex flex-col justify-center items-center px-4 py-8">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200/90 shadow-xl shadow-slate-200/60 overflow-hidden">
        {/* Topo com identidade visual Videplast */}
        <div className="bg-gradient-to-b from-slate-50 to-white px-6 pt-8 pb-6 border-b border-slate-100 text-center">
          <img
            src="/videplast-brand.png"
            alt="Logo Videplast"
            className="h-10 sm:h-11 w-auto mx-auto object-contain mb-4"
          />
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Gestão de Estoque Mín/Máx
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Identifique-se com o número do seu crachá para continuar
          </p>
        </div>

        {/* Formulário de Login por Crachá */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-7 space-y-5 text-left">
          <div>
            <label
              htmlFor="input-cracha"
              className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2"
            >
              Número do Crachá
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-slate-400 pointer-events-none">
                <CreditCard className="w-5 h-5" />
              </div>
              <input
                id="input-cracha"
                ref={inputRef}
                type="text"
                inputMode="numeric"
                autoComplete="off"
                value={cracha}
                onChange={(e) => {
                  setCracha(e.target.value);
                  if (erro) setErro('');
                }}
                placeholder="Digite ou bipe seu crachá..."
                disabled={carregando}
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-200 bg-slate-50/70 hover:bg-white focus:bg-white text-slate-900 font-bold text-base tracking-wide focus:border-videplast-primary focus:ring-4 focus:ring-red-500/10 outline-none transition-all placeholder:font-normal placeholder:text-slate-400"
              />
            </div>
          </div>

          {erro && (
            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-medium flex items-start gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{erro}</span>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={carregando}
            className="w-full justify-center py-3.5 text-sm sm:text-base font-bold rounded-xl shadow-md shadow-red-500/15"
          >
            <LogIn className="w-4 h-4" />
            <span>Acessar Sistema</span>
          </Button>
        </form>
      </div>
    </div>
  );
}

