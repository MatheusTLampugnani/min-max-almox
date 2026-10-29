import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from '../../lib/supabase.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ARQUIVO_SOLICITACOES = path.resolve(__dirname, '../../data_solicitacoes.json');

function carregarSolicitacoesIniciais() {
  try {
    if (fs.existsSync(ARQUIVO_SOLICITACOES)) {
      const conteudo = fs.readFileSync(ARQUIVO_SOLICITACOES, 'utf-8');
      const dados = JSON.parse(conteudo);
      if (Array.isArray(dados)) {
        return dados;
      }
    }
  } catch (err) {
    console.warn('[SOLICITACOES] Aviso ao ler data_solicitacoes.json:', err.message);
  }
  return [];
}

let solicitacoesMemoria = carregarSolicitacoesIniciais();

function salvarEmDisco() {
  try {
    fs.writeFileSync(ARQUIVO_SOLICITACOES, JSON.stringify(solicitacoesMemoria, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[SOLICITACOES] Falha ao persistir data_solicitacoes.json:', err.message);
  }
}

function mapLinhaBanco(row) {
  if (!row) return null;
  return {
    id: row.id,
    itemId: row.item_id,
    itemCodigo: row.item_codigo,
    itemNome: row.item_nome,
    itemUnidade: row.item_unidade,
    minAtual: Number(row.min_atual) || 0,
    maxAtual: Number(row.max_atual) || 0,
    novoMin: Number(row.novo_min) || 0,
    novoMax: Number(row.novo_max) || 0,
    justificativa: row.justificativa,
    solicitante: row.solicitante,
    setor: row.setor,
    status: row.status,
    motivoRecusa: row.motivo_recusa,
    respondidoPor: row.respondido_por,
    concluidoPor: row.concluido_por,
    dataCriacao: row.data_criacao,
    dataResposta: row.data_resposta,
    dataAprovacaoFilial: row.data_aprovacao_filial,
    dataConclusaoMatriz: row.data_conclusao_matriz,
    emailNotificacaoFilial: row.email_notificacao_filial !== false,
    emailNotificacaoMatriz: row.email_notificacao_matriz === true
  };
}

export const solicitacoesRepository = {
  async listar({ status = '', perfil = 'almoxarifado', cracha = '', usuario = '' } = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('solicitacoes')
          .select('*')
          .order('data_criacao', { ascending: false });

        if (status) {
          if (status === 'aprovada') {
            query = query.in('status', ['aprovada', 'encaminhada_matriz', 'concluida']);
          } else {
            query = query.eq('status', status);
          }
        }

        // Supervisor vê apenas as suas solicitações (filtrado por crachá ou nome)
        if (perfil === 'supervisor') {
          const condicoes = [];
          if (cracha) {
            condicoes.push(`solicitante.ilike.%${cracha}%`);
          }
          if (usuario) {
            const nomeLimpo = usuario.split('(')[0].trim();
            if (nomeLimpo) {
              condicoes.push(`solicitante.ilike.%${nomeLimpo}%`);
            }
          }
          if (condicoes.length > 0) {
            query = query.or(condicoes.join(','));
          }
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          return data.map(mapLinhaBanco);
        }
      } catch (err) {
        console.warn('[SUPABASE SOLICITACOES] Fallback para memória ao listar:', err.message);
      }
    }

    let lista = [...solicitacoesMemoria];
    if (status) {
      if (status === 'aprovada') {
        lista = lista.filter((s) => s.status === 'aprovada' || s.status === 'encaminhada_matriz' || s.status === 'concluida');
      } else {
        lista = lista.filter((s) => s.status === status);
      }
    }

    if (perfil === 'supervisor') {
      const crachaStr = String(cracha || '').trim().toLowerCase();
      const usuarioStr = String(usuario || '').split('(')[0].trim().toLowerCase();
      lista = lista.filter((s) => {
        const sol = String(s.solicitante || '').toLowerCase();
        return (crachaStr && sol.includes(crachaStr)) || (usuarioStr && sol.includes(usuarioStr));
      });
    }

    return lista.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  },

  async buscarPorId(id) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('solicitacoes')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        if (!error && data) {
          return mapLinhaBanco(data);
        }
      } catch (err) {
        console.warn('[SUPABASE SOLICITACOES] Fallback para memória ao buscarPorId:', err.message);
      }
    }

    const item = solicitacoesMemoria.find((s) => s.id === id);
    return item ? { ...item } : null;
  },

  async contarPendentes({ perfil = 'almoxarifado', cracha = '', usuario = '' } = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('solicitacoes')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pendente');

        if (perfil === 'supervisor') {
          const condicoes = [];
          if (cracha) condicoes.push(`solicitante.ilike.%${cracha}%`);
          if (usuario) {
            const nomeLimpo = usuario.split('(')[0].trim();
            if (nomeLimpo) condicoes.push(`solicitante.ilike.%${nomeLimpo}%`);
          }
          if (condicoes.length > 0) {
            query = query.or(condicoes.join(','));
          }
        }

        const { count, error } = await query;
        if (!error && typeof count === 'number') {
          return count;
        }
      } catch (err) {
        console.warn('[SUPABASE SOLICITACOES] Fallback para memória ao contarPendentes:', err.message);
      }
    }

    let pendentes = solicitacoesMemoria.filter((s) => s.status === 'pendente');
    if (perfil === 'supervisor') {
      const crachaStr = String(cracha || '').trim().toLowerCase();
      const usuarioStr = String(usuario || '').split('(')[0].trim().toLowerCase();
      pendentes = pendentes.filter((s) => {
        const sol = String(s.solicitante || '').toLowerCase();
        return (crachaStr && sol.includes(crachaStr)) || (usuarioStr && sol.includes(usuarioStr));
      });
    }

    return pendentes.length;
  },

  async criar(dados) {
    const agora = new Date().toISOString();
    const novaSolicitacao = {
      id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...dados,
      status: 'pendente',
      dataCriacao: agora,
      dataResposta: null,
      respondidoPor: null,
      motivoRecusa: null,
      emailNotificacaoFilial: true,
      emailNotificacaoMatriz: false
    };

    const supabase = getSupabase();
    if (supabase) {
      try {
        const payloadBanco = {
          id: novaSolicitacao.id,
          item_id: novaSolicitacao.itemId,
          item_codigo: novaSolicitacao.itemCodigo,
          item_nome: novaSolicitacao.itemNome,
          item_unidade: novaSolicitacao.itemUnidade || 'un',
          min_atual: Number(novaSolicitacao.minAtual) || 0,
          max_atual: Number(novaSolicitacao.maxAtual) || 0,
          novo_min: Number(novaSolicitacao.novoMin),
          novo_max: Number(novaSolicitacao.novoMax),
          justificativa: novaSolicitacao.justificativa,
          solicitante: novaSolicitacao.solicitante,
          setor: novaSolicitacao.setor,
          status: 'pendente',
          data_criacao: agora,
          email_notificacao_filial: true,
          email_notificacao_matriz: false
        };

        const { data, error } = await supabase
          .from('solicitacoes')
          .insert(payloadBanco)
          .select()
          .single();

        if (!error && data) {
          return mapLinhaBanco(data);
        }
        console.warn('[SUPABASE SOLICITACOES] Erro ao inserir no banco:', error?.message);
      } catch (err) {
        console.warn('[SUPABASE SOLICITACOES] Falha ao criar no banco:', err.message);
      }
    }

    solicitacoesMemoria.unshift(novaSolicitacao);
    salvarEmDisco();
    return { ...novaSolicitacao };
  },

  async atualizarStatus(id, alteracoes = {}) {
    const agora = alteracoes.dataResposta || new Date().toISOString();
    const supabase = getSupabase();

    if (supabase) {
      try {
        const payloadBanco = {};
        if (alteracoes.status !== undefined) payloadBanco.status = alteracoes.status;
        if (alteracoes.respondidoPor !== undefined) payloadBanco.respondido_por = alteracoes.respondidoPor;
        if (alteracoes.concluidoPor !== undefined) payloadBanco.concluido_por = alteracoes.concluidoPor;
        if (alteracoes.motivoRecusa !== undefined) payloadBanco.motivo_recusa = alteracoes.motivoRecusa;
        if (alteracoes.dataAprovacaoFilial !== undefined) payloadBanco.data_aprovacao_filial = alteracoes.dataAprovacaoFilial;
        if (alteracoes.dataConclusaoMatriz !== undefined) payloadBanco.data_conclusao_matriz = alteracoes.dataConclusaoMatriz;
        if (alteracoes.emailNotificacaoMatriz !== undefined) payloadBanco.email_notificacao_matriz = alteracoes.emailNotificacaoMatriz;
        payloadBanco.data_resposta = agora;

        const { data, error } = await supabase
          .from('solicitacoes')
          .update(payloadBanco)
          .eq('id', id)
          .select()
          .maybeSingle();

        if (!error && data) {
          return mapLinhaBanco(data);
        }
      } catch (err) {
        console.warn('[SUPABASE SOLICITACOES] Falha ao atualizar no banco:', err.message);
      }
    }

    const index = solicitacoesMemoria.findIndex((s) => s.id === id);
    if (index === -1) return null;

    solicitacoesMemoria[index] = {
      ...solicitacoesMemoria[index],
      ...alteracoes,
      dataResposta: agora
    };
    salvarEmDisco();
    return { ...solicitacoesMemoria[index] };
  }
};
