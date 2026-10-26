import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carrega variáveis de ambiente do backend (.env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_KEY ||
  process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ Erro: SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_KEY) não foram configuradas no arquivo backend/.env');
  console.error('Crie o arquivo backend/.env com as credenciais do seu projeto Supabase.\n');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function semearSupabase() {
  console.log('\n🚀 Iniciando migração e população de dados no Supabase...');
  console.log(`📡 Conectando ao projeto: ${supabaseUrl}\n`);

  const caminhoJson = path.resolve(__dirname, '../data_planilha_mrp.json');
  if (!fs.existsSync(caminhoJson)) {
    console.error('❌ Arquivo data_planilha_mrp.json não encontrado!');
    process.exit(1);
  }

  const dados = JSON.parse(fs.readFileSync(caminhoJson, 'utf-8'));
  console.log(`📦 Total de materiais na planilha: ${dados.length}`);

  // Mapeia e higieniza os dados para a tabela 'itens'
  const itensFormatados = dados.map((item) => {
    let min = Number(item.min) || 0;
    let max = Number(item.max) || 0;
    if (min >= max) {
      max = min === 0 ? 10 : Math.round(min * 2);
    }

    return {
      id: item.id || `sap-${item.codigo}`,
      codigo: String(item.codigo),
      nome: item.nome,
      categoria: item.categoria || 'Geral',
      unidade: item.unidade || 'un',
      saldo: Number(item.saldo) || 0,
      min: min,
      max: max,
      sugestao_mrp_min: item.sugestaoMrpMin !== null ? Math.round(Number(item.sugestaoMrpMin)) : null,
      sugestao_mrp_max: item.sugestaoMrpMax !== null ? Math.round(Number(item.sugestaoMrpMax)) : null,
      consumo_medio_planilha: Number(item.consumoMedioPlanilha) || 0,
      consumo_12_meses: Number(item.consumo12Meses) || 0,
      endereco: item.endereco || 'A-01-01',
      ativo: true
    };
  });

  // Insere em lotes (chunks) de 100 itens para não sobrecarregar
  const BATCH_SIZE = 100;
  let inseridos = 0;

  for (let i = 0; i < itensFormatados.length; i += BATCH_SIZE) {
    const lote = itensFormatados.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('itens').upsert(lote, { onConflict: 'codigo' });

    if (error) {
      console.error(`❌ Erro no lote ${i} a ${i + lote.length}:`, error.message);
    } else {
      inseridos += lote.length;
      process.stdout.write(`\r⏳ Progresso: ${inseridos}/${itensFormatados.length} materiais inseridos...`);
    }
  }

  console.log('\n\n✅ Sucesso! Todos os materiais da planilha MRP foram sincronizados no Supabase.');
}

semearSupabase().catch((err) => {
  console.error('❌ Falha na execução:', err);
});
