import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getSupabase } from '../../lib/supabase.js';
import { formatarCategoria } from './categoriasSap.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CAMINHO_JSON_PLANILHA = path.resolve(__dirname, '../../data_planilha_mrp.json');

function subtrairDias(dias) {
  const d = new Date();
  d.setDate(d.getDate() - dias);
  return d.toISOString();
}

function carregarItensDaPlanilha() {
  try {
    if (fs.existsSync(CAMINHO_JSON_PLANILHA)) {
      const conteudo = fs.readFileSync(CAMINHO_JSON_PLANILHA, 'utf-8');
      const dados = JSON.parse(conteudo);

      return dados.map((item) => {
        let min = Number(item.min) || 0;
        let max = Number(item.max) || 0;
        if (min >= max) {
          max = min === 0 ? 10 : Math.round(min * 2);
        }

        const sugMin =
          item.sugestaoMrpMin !== null && item.sugestaoMrpMin !== undefined
            ? Math.round(Number(item.sugestaoMrpMin))
            : null;
        const sugMax =
          item.sugestaoMrpMax !== null && item.sugestaoMrpMax !== undefined
            ? Math.round(Number(item.sugestaoMrpMax))
            : null;

        return {
          id: item.codigo || item.id,
          codigo: String(item.codigo),
          nome: item.nome,
          categoria: item.categoria || 'Geral',
          unidade: item.unidade || 'un',
          min,
          max,
          saldo: Number(item.saldo) || 0,
          sugestaoMrpMin: sugMin,
          sugestaoMrpMax: sugMax,
          consumoMedioPlanilha: Number(item.consumoMedioPlanilha) || 0,
          consumo12Meses: Number(item.consumo12Meses) || 0,
          endereco: item.endereco || 'A-01-01',
          ativo: item.ativo !== false
        };
      });
    }
  } catch (err) {
    console.error('[REPOSITORY] Erro ao carregar data_planilha_mrp.json:', err.message);
  }
  return [];
}

let itensMemoria = carregarItensDaPlanilha();
let movimentacoesAvulsas = [];

function mapLinhaBanco(row) {
  if (!row) return null;
  return {
    id: row.codigo,
    codigo: row.codigo,
    nome: row.nome,
    categoria: row.categoria || 'Geral',
    unidade: row.unidade || 'un',
    saldo: Number(row.saldo) || 0,
    min: Number(row.min) || 0,
    max: Number(row.max) || 0,
    sugestaoMrpMin: row.sugestao_mrp_min !== null ? Number(row.sugestao_mrp_min) : null,
    sugestaoMrpMax: row.sugestao_mrp_max !== null ? Number(row.sugestao_mrp_max) : null,
    consumoMedioPlanilha: Number(row.consumo_medio) || 0,
    consumo12Meses: Number(row.consumo_12_meses) || 0,
    endereco: row.endereco || 'A-01-01',
    ativo: row.ativo !== false,
    ultimaImportacaoEm: row.ultima_importacao_em,
    criadoEm: row.criado_em,
    atualizadoEm: row.atualizado_em
  };
}

export const itensRepository = {
  async listar() {
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('materiais')
          .select('*')
          .eq('ativo', true)
          .order('nome', { ascending: true })
          .limit(5000);

        if (!error && Array.isArray(data)) {
          return data.map(mapLinhaBanco);
        }
      } catch (err) {
        console.warn('[SUPABASE] Falha ao listar de materiais, usando fallback em memória:', err.message);
      }
    }
    return itensMemoria.map((it) => ({ ...it }));

  },

  async buscarPorId(id) {
    return this.buscarPorCodigo(id);
  },

  async buscarPorCodigo(codigo) {
    const codNormalizado = String(codigo).trim();
    const supabase = getSupabase();
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('materiais')
          .select('*')
          .eq('codigo', codNormalizado)
          .maybeSingle();

        if (!error && data) {
          return mapLinhaBanco(data);
        }
      } catch (err) {
        console.warn('[SUPABASE] Erro ao buscar por código:', err.message);
      }
    }

    const item = itensMemoria.find(
      (it) => String(it.codigo).toLowerCase().trim() === codNormalizado.toLowerCase()
    );
    return item ? { ...item } : null;
  },

  async criar(dados) {
    const codNormalizado = String(dados.codigo).trim();
    const supabase = getSupabase();
    if (supabase) {
      const payloadBanco = {
        codigo: codNormalizado,
        nome: dados.nome,
        categoria: dados.categoria || 'Geral',
        unidade: dados.unidade || 'un',
        saldo: Number(dados.saldo) || 0,
        min: Number(dados.min) || 0,
        max: Number(dados.max) || 0,
        sugestao_mrp_min: dados.sugestaoMrpMin ?? null,
        sugestao_mrp_max: dados.sugestaoMrpMax ?? null,
        consumo_medio: Number(dados.consumoMedioPlanilha) || 0,
        consumo_12_meses: Number(dados.consumo12Meses) || 0,
        endereco: dados.endereco || 'A-01-01',
        ativo: dados.ativo ?? true
      };

      const { data, error } = await supabase
        .from('materiais')
        .insert(payloadBanco)
        .select()
        .single();

      if (error) {
        console.error('[SUPABASE] Erro ao criar material:', error.message);
        throw new Error(`Erro ao criar material no Supabase: ${error.message}`);
      }
      return mapLinhaBanco(data);
    }

    const novoItem = {
      id: codNormalizado,
      ...dados,
      codigo: codNormalizado,
      ativo: dados.ativo ?? true
    };
    itensMemoria.unshift(novoItem);
    return { ...novoItem };
  },

  async atualizar(id, dados) {
    const codNormalizado = String(id).trim();
    const supabase = getSupabase();
    if (supabase) {
      const payloadBanco = {};
      if (dados.nome !== undefined) payloadBanco.nome = dados.nome;
      if (dados.categoria !== undefined) payloadBanco.categoria = dados.categoria;
      if (dados.unidade !== undefined) payloadBanco.unidade = dados.unidade;
      if (dados.saldo !== undefined) payloadBanco.saldo = Number(dados.saldo);
      if (dados.min !== undefined) payloadBanco.min = Number(dados.min);
      if (dados.max !== undefined) payloadBanco.max = Number(dados.max);
      if (dados.endereco !== undefined) payloadBanco.endereco = dados.endereco;
      if (dados.ativo !== undefined) payloadBanco.ativo = dados.ativo;
      payloadBanco.atualizado_em = new Date().toISOString();

      const { data, error } = await supabase
        .from('materiais')
        .update(payloadBanco)
        .eq('codigo', codNormalizado)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao atualizar material no Supabase: ${error.message}`);
      }
      return mapLinhaBanco(data);
    }

    const index = itensMemoria.findIndex((it) => String(it.codigo) === codNormalizado || it.id === codNormalizado);
    if (index === -1) return null;
    itensMemoria[index] = { ...itensMemoria[index], ...dados };
    return { ...itensMemoria[index] };
  },

  async atualizarMinMax(id, { min, max }) {
    const codNormalizado = String(id).trim();
    const supabase = getSupabase();
    if (supabase) {
      const { data, error } = await supabase
        .from('materiais')
        .update({
          min: Number(min),
          max: Number(max),
          atualizado_em: new Date().toISOString()
        })
        .eq('codigo', codNormalizado)
        .select()
        .maybeSingle();

      if (error) {
        throw new Error(`Erro ao atualizar min/max no Supabase: ${error.message}`);
      }
      return mapLinhaBanco(data);
    }

    const index = itensMemoria.findIndex((it) => String(it.codigo) === codNormalizado || it.id === codNormalizado);
    if (index === -1) return null;
    itensMemoria[index].min = min;
    itensMemoria[index].max = max;
    return { ...itensMemoria[index] };
  },

  async inativar(id) {
    return this.atualizar(id, { ativo: false });
  },

  /**
   * PROCESSO COMPLETO DE IMPORTAÇÃO E SINCRONIZAÇÃO DE PLANILHA DO SAP
   * 1. Registra lote de importação
   * 2. Insere dados na tabela temporária (materiais_importacao_temp)
   * 3. Executa a reconciliação (UPSERT):
   *    - Itens já existentes: atualiza dados e grava variação no historico_materiais_log
   *    - Itens novos: insere no catálogo e grava log de criação
   *    - Itens não presentes na planilha: continuam intactos no banco
   * 4. Deleta os registros da tabela temporária
   */
  async processarImportacaoPlanilha({ itens = [], usuario = 'Almoxarifado', nomeArquivo = 'planilha_sap.xlsx' }) {
    const supabase = getSupabase();

    if (!Array.isArray(itens) || itens.length === 0) {
      throw new Error('Nenhum material válido foi encontrado na planilha para importação.');
    }

    if (!supabase) {
      // Modo Mock Fallback em memória
      let novosCount = 0;
      let atualizadosCount = 0;

      for (const item of itens) {
        const codigo = String(item.codigo).trim();
        const index = itensMemoria.findIndex((it) => String(it.codigo).trim() === codigo);
        if (index >= 0) {
          itensMemoria[index] = { ...itensMemoria[index], ...item };
          atualizadosCount++;
        } else {
          itensMemoria.push({ ...item, id: codigo, ativo: true });
          novosCount++;
        }
      }

      return {
        sucesso: true,
        loteId: 'mock-lote-' + Date.now(),
        totalRecebidos: itens.length,
        novos: novosCount,
        atualizados: atualizadosCount,
        inalterados: Math.max(0, itensMemoria.length - itens.length)
      };
    }

    // 1. Criar Lote de Importação
    let loteId = null;
    try {
      const { data: loteCriado, error: erroLote } = await supabase
        .from('lotes_importacao')
        .insert({
          nome_arquivo: nomeArquivo,
          usuario_nome: usuario,
          total_linhas: itens.length,
          status: 'processando'
        })
        .select()
        .single();

      if (!erroLote && loteCriado) {
        loteId = loteCriado.id;
      }
    } catch (err) {
      console.warn('[IMPORTACAO] Aviso ao registrar em lotes_importacao:', err.message);
    }

    // 2. Preencher a tabela temporária (materiais_importacao_temp)
    const linhasTemp = itens.map((it) => ({
      lote_id: loteId,
      codigo: String(it.codigo).trim(),
      nome: it.nome || 'Material sem descrição',
      categoria: it.categoria || 'Geral',
      unidade: it.unidade || 'un',
      saldo: Number(it.saldo) || 0,
      min: Number(it.min) || 0,
      max: Number(it.max) || 0,
      sugestao_mrp_min: it.sugestaoMrpMin !== null && it.sugestaoMrpMin !== undefined ? Number(it.sugestaoMrpMin) : null,
      sugestao_mrp_max: it.sugestaoMrpMax !== null && it.sugestaoMrpMax !== undefined ? Number(it.sugestaoMrpMax) : null,
      consumo_medio: Number(it.consumoMedioPlanilha ?? it.consumoMedio) || 0,
      consumo_12_meses: Number(it.consumo12Meses) || 0,
      endereco: it.endereco || 'A-01-01'
    }));

    // Inserção em lotes de 200 na staging
    const BATCH_SIZE = 200;
    for (let i = 0; i < linhasTemp.length; i += BATCH_SIZE) {
      const chunk = linhasTemp.slice(i, i + BATCH_SIZE);
      const { error: erroTemp } = await supabase.from('materiais_importacao_temp').insert(chunk);
      if (erroTemp) {
        console.warn(`[IMPORTACAO] Aviso na inserção temp (chunk ${i}):`, erroTemp.message);
      }
    }

    // 3. Buscar materiais atuais no banco para comparar e calcular variações
    const { data: materiaisExistentes, error: erroBusca } = await supabase
      .from('materiais')
      .select('codigo, nome, saldo, min, max, categoria, unidade, endereco');

    if (erroBusca) {
      throw new Error(`Falha ao consultar materiais existentes: ${erroBusca.message}`);
    }

    const mapaExistentes = new Map();
    for (const mat of materiaisExistentes || []) {
      mapaExistentes.set(String(mat.codigo).trim(), mat);
    }

    const agora = new Date().toISOString();
    const materiaisParaInserir = [];
    const materiaisParaAtualizar = [];
    const logsHistorico = [];

    let novosCount = 0;
    let atualizadosCount = 0;

    for (const item of linhasTemp) {
      const codigo = item.codigo;
      const existente = mapaExistentes.get(codigo);

      // Regra de validação min < max
      let minVal = item.min;
      let maxVal = item.max;
      if (minVal >= maxVal) {
        maxVal = minVal === 0 ? 10 : Math.round(minVal * 2);
      }

      // Calcula consumo médio mensal a partir do consumo anual se necessário
      const consumo12M = Number(item.consumo_12_meses) || 0;
      const consumoMedio = Number(item.consumo_medio) > 0 ? Number(item.consumo_medio) : (consumo12M > 0 ? Math.round((consumo12M / 12) * 100) / 100 : 0);

      if (existente) {
        // Item EXISTENTE -> Sobrescreve parâmetros do MRP mantendo saldo caso a planilha não tenha trazido saldo
        const saldoAnterior = Number(existente.saldo) || 0;
        const saldoNovo = item.saldo !== undefined && item.saldo !== null && Number(item.saldo) !== 0
          ? Number(item.saldo)
          : saldoAnterior;
        const variacao = saldoNovo - saldoAnterior;

        const categoriaFinal = formatarCategoria(
          item.categoria && item.categoria !== 'Geral'
            ? item.categoria
            : (existente.categoria || 'Geral')
        );

        const unidadeFinal = item.unidade && item.unidade !== 'un'
          ? item.unidade
          : (existente.unidade || 'un');

        materiaisParaAtualizar.push({
          codigo: item.codigo,
          nome: item.nome || existente.nome,
          categoria: categoriaFinal,
          unidade: unidadeFinal,
          saldo: saldoNovo,
          min: minVal,
          max: maxVal,
          sugestao_mrp_min: item.sugestao_mrp_min,
          sugestao_mrp_max: item.sugestao_mrp_max,
          consumo_medio: consumoMedio,
          consumo_12_meses: consumo12M,
          endereco: item.endereco && item.endereco !== 'A-01-01' ? item.endereco : (existente.endereco || 'A-01-01'),
          ativo: true,
          ultima_importacao_em: agora,
          atualizado_em: agora
        });

        // Grava no histórico permanente para análise da diretoria
        logsHistorico.push({
          codigo_material: item.codigo,
          nome_material: item.nome || existente.nome,
          tipo_evento: 'importacao_sap',
          saldo_anterior: saldoAnterior,
          saldo_novo: saldoNovo,
          variacao_saldo: variacao,
          min_anterior: Number(existente.min) || 0,
          novo_min: minVal,
          max_anterior: Number(existente.max) || 0,
          novo_max: maxVal,
          consumo_medio_momento: consumoMedio,
          consumo_12_meses_momento: consumo12M,
          usuario_responsavel: usuario,
          lote_id: loteId,
          criado_em: agora
        });

        atualizadosCount++;
      } else {
        // Item NOVO -> Insere no catálogo
        const saldoNovo = Number(item.saldo) || 0;

        materiaisParaInserir.push({
          codigo: item.codigo,
          nome: item.nome,
          categoria: formatarCategoria(item.categoria),
          unidade: item.unidade || 'un',
          saldo: saldoNovo,
          min: minVal,
          max: maxVal,
          sugestao_mrp_min: item.sugestao_mrp_min,
          sugestao_mrp_max: item.sugestao_mrp_max,
          consumo_medio: consumoMedio,
          consumo_12_meses: consumo12M,
          endereco: item.endereco || 'A-01-01',
          ativo: true,
          criado_em: agora,
          atualizado_em: agora,
          ultima_importacao_em: agora
        });

        logsHistorico.push({
          codigo_material: item.codigo,
          nome_material: item.nome,
          tipo_evento: 'novo_material_sap',
          saldo_anterior: 0,
          saldo_novo: saldoNovo,
          variacao_saldo: saldoNovo,
          min_anterior: 0,
          novo_min: minVal,
          max_anterior: 0,
          novo_max: maxVal,
          consumo_medio_momento: consumoMedio,
          consumo_12_meses_momento: consumo12M,
          usuario_responsavel: usuario,
          lote_id: loteId,
          criado_em: agora
        });

        novosCount++;
      }
    }

    // 4. Executar Upsert em Materiais (deduplicado para evitar ON CONFLICT no mesmo batch)
    const mapaUpsert = new Map();
    for (const mat of [...materiaisParaInserir, ...materiaisParaAtualizar]) {
      mapaUpsert.set(mat.codigo, mat);
    }
    const todosMateriaisParaUpsert = Array.from(mapaUpsert.values());

    for (let i = 0; i < todosMateriaisParaUpsert.length; i += BATCH_SIZE) {
      const chunk = todosMateriaisParaUpsert.slice(i, i + BATCH_SIZE);
      const { error: erroUpsert } = await supabase
        .from('materiais')
        .upsert(chunk, { onConflict: 'codigo' });

      if (erroUpsert) {
        console.error(`[IMPORTACAO] Erro no upsert de materiais (chunk ${i}):`, erroUpsert.message);
      }
    }

    // 5. Inserir Logs de Histórico de Longo Prazo
    for (let i = 0; i < logsHistorico.length; i += BATCH_SIZE) {
      const chunk = logsHistorico.slice(i, i + BATCH_SIZE);
      const { error: erroLog } = await supabase.from('historico_materiais_log').insert(chunk);
      if (erroLog) {
        console.error(`[IMPORTACAO] Erro ao gravar historico_materiais_log (chunk ${i}):`, erroLog.message);
      }
    }

    // 6. Limpar dados da tabela temporária (materiais_importacao_temp)
    if (loteId) {
      await supabase.from('materiais_importacao_temp').delete().eq('lote_id', loteId);
    } else {
      await supabase.from('materiais_importacao_temp').delete().neq('codigo', '___dummy___');
    }

    // 7. Atualizar status do lote
    if (loteId) {
      await supabase
        .from('lotes_importacao')
        .update({
          itens_novos: novosCount,
          itens_atualizados: atualizadosCount,
          status: 'concluido'
        })
        .eq('id', loteId);
    }

    const inalterados = Math.max(0, (materiaisExistentes?.length || 0) - atualizadosCount);

    return {
      sucesso: true,
      loteId,
      totalRecebidos: itens.length,
      novos: novosCount,
      atualizados: atualizadosCount,
      inalterados
    };
  },

  async listarSaidasPorItem(itemId) {
    const item = await this.buscarPorCodigo(itemId);
    const avulsas = movimentacoesAvulsas.filter(
      (m) => m.itemId === itemId && m.tipo === 'saida'
    );

    if (!item) return avulsas;

    const mediaMensal = Number(item.consumoMedioPlanilha) || 10;
    const saídasProjetadas = [];
    const setores = ['extrusao', 'corte-solda', 'impressao', 'manutencao', 'expedicao'];

    for (let i = 1; i <= 12; i++) {
      const diasAtras = i * 15;
      const fator = 0.85 + ((i * 7) % 30) / 100;
      const qtd = Math.max(1, Math.round((mediaMensal / 2) * fator));
      saídasProjetadas.push({
        id: `mov-auto-${item.codigo}-${i}`,
        itemId: item.codigo,
        tipo: 'saida',
        quantidade: qtd,
        setorId: setores[(i + Number(String(item.codigo).slice(-2) || 0)) % setores.length],
        data: subtrairDias(diasAtras),
        usuario: 'almoxarifado',
        observacao: 'Consumo registrado para ordem de produção'
      });
    }

    return [...avulsas, ...saídasProjetadas].sort(
      (a, b) => new Date(b.data) - new Date(a.data)
    );
  },

  async listarTodasSaidas() {
    return movimentacoesAvulsas.filter((m) => m.tipo === 'saida');
  },

  async registrarMovimentacao(mov) {
    const novaMov = {
      id: `mov-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...mov
    };
    movimentacoesAvulsas.push(novaMov);
    return { ...novaMov };
  }
};
