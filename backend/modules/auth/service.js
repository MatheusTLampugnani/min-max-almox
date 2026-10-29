import { getSupabase } from '../../lib/supabase.js';
import { PERFIS } from './roles.js';
import { NotFoundError, ValidationError } from '../shared/index.js';

export function resolverPerfilPorSetor(setor) {
  const setorLimpo = String(setor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (
    setorLimpo === 'almox' ||
    setorLimpo === 'almoxarifado' ||
    setorLimpo.includes('almox')
  ) {
    return PERFIS.ALMOXARIFADO;
  }

  return PERFIS.SUPERVISOR;
}

export const authService = {
  async autenticarPorCracha(crachaInput) {
    const cracha = String(crachaInput || '').trim();
    if (!cracha) {
      throw new ValidationError('Informe o número do crachá para entrar.');
    }

    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('crachas')
      .select('*')
      .eq('id', cracha)
      .single();

    if (error || !data) {
      throw new NotFoundError('Crachá não encontrado no sistema!');
    }

    const nomeCompleto = String(data.nome_completo || '').trim() || `Colaborador #${data.id}`;
    const setor = String(data.setor || '').trim() || 'Geral';
    const perfil = resolverPerfilPorSetor(setor);

    return {
      id: String(data.id),
      cracha: String(data.id),
      nomeCompleto,
      setor,
      perfil
    };
  }
};
