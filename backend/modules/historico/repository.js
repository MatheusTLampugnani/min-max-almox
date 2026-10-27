import { getSupabase } from '../../lib/supabase.js';

const historicoMemoria = [];

function mapLinhaHistorico(row) {
  const variacao = row.variacao_saldo !== null ? Number(row.variacao_saldo) : 0;
  let tituloFormatado = 'Alteração de Material';
  if (row.tipo_evento === 'importacao_sap') {
    tituloFormatado = 'Sincronização SAP (Planilha)';
  } else if (row.tipo_evento === 'novo_material_sap') {
    tituloFormatado = 'Novo Material Cadastrado (SAP)';
  } else if (row.tipo_evento === 'alteracao_min_max_direta') {
    tituloFormatado = 'Ajuste Direto Mín/Máx';
  }

  return {
    id: String(row.id),
    dataHora: row.criado_em,
    tipoAcao: row.tipo_evento,
    titulo: tituloFormatado,
    usuario: row.usuario_responsavel || 'Almoxarifado',
    perfil: 'almoxarifado',
    item: {
      id: row.codigo_material,
      codigo: row.codigo_material,
      nome: row.nome_material,
      unidade: 'un',
      categoria: 'Geral'
    },
    alteracao: {
      minAnterior: row.min_anterior !== null ? Number(row.min_anterior) : null,
      maxAnterior: row.max_anterior !== null ? Number(row.max_anterior) : null,
      novoMin: row.novo_min !== null ? Number(row.novo_min) : null,
      novoMax: row.novo_max !== null ? Number(row.novo_max) : null
    },
    saldoAnterior: row.saldo_anterior !== null ? Number(row.saldo_anterior) : null,
    saldoNovo: row.saldo_novo !== null ? Number(row.saldo_novo) : null,
    variacaoSaldo: variacao,
    consumoMedio: row.consumo_medio_momento,
    consumo12Meses: row.consumo_12_meses_momento,
    loteId: row.lote_id,
    justificativa:
      variacao !== 0
        ? `Variação de estoque: ${variacao > 0 ? '+' : ''}${variacao.toLocaleString('pt-BR')}`
        : 'Estoque mantido estável'
  };
}

export const historicoRepository = {
  async listar({ termo = '', tipoAcao = '', dataInicio = '', dataFim = '', limite = 100 } = {}) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        let query = supabase
          .from('historico_materiais_log')
          .select('*')
          .order('criado_em', { ascending: false })
          .limit(limite);

        if (tipoAcao) {
          query = query.eq('tipo_evento', tipoAcao);
        }

        if (dataInicio) {
          query = query.gte('criado_em', dataInicio);
        }

        if (dataFim) {
          query = query.lte('criado_em', dataFim);
        }

        const { data, error } = await query;
        if (!error && Array.isArray(data)) {
          let lista = data.map(mapLinhaHistorico);
          const termoNorm = termo.trim().toLowerCase();
          if (termoNorm) {
            lista = lista.filter((reg) => {
              const matchesCodigo = reg.item?.codigo?.toLowerCase().includes(termoNorm);
              const matchesNome = reg.item?.nome?.toLowerCase().includes(termoNorm);
              const matchesUsuario = reg.usuario?.toLowerCase().includes(termoNorm);
              return matchesCodigo || matchesNome || matchesUsuario;
            });
          }
          return lista;
        }
      } catch (err) {
        console.warn('[SUPABASE] Erro ao listar historico_materiais_log, usando memória:', err.message);
      }
    }


    let lista = [...historicoMemoria];
    const termoNorm = termo.trim().toLowerCase();
    if (termoNorm) {
      lista = lista.filter((reg) => {
        const matchesCodigo = reg.item?.codigo?.toLowerCase().includes(termoNorm);
        const matchesNome = reg.item?.nome?.toLowerCase().includes(termoNorm);
        const matchesUsuario = reg.usuario?.toLowerCase().includes(termoNorm);
        const matchesJust = reg.justificativa?.toLowerCase().includes(termoNorm);
        return matchesCodigo || matchesNome || matchesUsuario || matchesJust;
      });
    }

    if (tipoAcao) {
      lista = lista.filter((reg) => reg.tipoAcao === tipoAcao);
    }

    if (dataInicio) {
      const inicio = new Date(dataInicio).getTime();
      lista = lista.filter((reg) => new Date(reg.dataHora).getTime() >= inicio);
    }

    if (dataFim) {
      const fim = new Date(dataFim).getTime();
      lista = lista.filter((reg) => new Date(reg.dataHora).getTime() <= fim);
    }

    lista.sort((a, b) => new Date(b.dataHora) - new Date(a.dataHora));
    return lista.slice(0, limite);
  },

  async criar(evento) {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const payload = {
          codigo_material: evento.item?.codigo || 'SEM-COD',
          nome_material: evento.item?.nome || evento.titulo,
          tipo_evento: evento.tipoAcao,
          min_anterior: evento.alteracao?.minAnterior ?? null,
          max_anterior: evento.alteracao?.maxAnterior ?? null,
          novo_min: evento.alteracao?.novoMin ?? null,
          novo_max: evento.alteracao?.novoMax ?? null,
          usuario_responsavel: evento.usuario,
          criado_em: new Date().toISOString()
        };

        const { data, error } = await supabase
          .from('historico_materiais_log')
          .insert(payload)
          .select()
          .single();

        if (!error && data) {
          return mapLinhaHistorico(data);
        }
      } catch (err) {
        console.warn('[SUPABASE] Erro ao inserir historico_materiais_log:', err.message);
      }
    }

    const novoRegistro = {
      id: `hist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      dataHora: new Date().toISOString(),
      ...evento
    };
    historicoMemoria.unshift(novoRegistro);
    return { ...novoRegistro };
  }
};
