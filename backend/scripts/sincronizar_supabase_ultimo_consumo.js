import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas no .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function sincronizarUltimoConsumo() {
  console.log('🔍 Verificando se a coluna ultimo_consumo existe na tabela materiais...');
  const { error: erroTeste } = await supabase.from('materiais').select('ultimo_consumo').limit(1);

  if (erroTeste) {
    console.log('\n⚠️ A coluna "ultimo_consumo" ainda NÃO foi criada na tabela "materiais" do Supabase.');
    console.log('Execute o seguinte comando SQL no Editor SQL do seu painel Supabase:');
    console.log('\n------------------------------------------------------------');
    console.log('ALTER TABLE materiais ADD COLUMN IF NOT EXISTS ultimo_consumo TEXT;');
    console.log('ALTER TABLE materiais_importacao_temp ADD COLUMN IF NOT EXISTS ultimo_consumo TEXT;');
    console.log('------------------------------------------------------------\n');
    console.log('Após executar o comando acima no Supabase, rode este script novamente:');
    console.log('node backend/scripts/sincronizar_supabase_ultimo_consumo.js\n');
    return;
  }

  console.log('✅ Coluna ultimo_consumo encontrada na tabela materiais!');

  const caminhoJson = path.resolve(__dirname, '../data_ultimo_consumo.json');
  if (!fs.existsSync(caminhoJson)) {
    console.error('❌ Arquivo backend/data_ultimo_consumo.json não encontrado.');
    return;
  }

  const mapa = JSON.parse(fs.readFileSync(caminhoJson, 'utf-8'));
  const codigos = Object.keys(mapa);
  console.log(`📦 Encontradas ${codigos.length} datas de último consumo para sincronizar...`);

  const BATCH_SIZE = 100;
  let atualizados = 0;

  for (let i = 0; i < codigos.length; i += BATCH_SIZE) {
    const chunkCodigos = codigos.slice(i, i + BATCH_SIZE);
    const updates = chunkCodigos.map((cod) => ({
      codigo: cod,
      ultimo_consumo: mapa[cod]
    }));

    const { error: erroUpsert } = await supabase
      .from('materiais')
      .upsert(updates, { onConflict: 'codigo' });

    if (erroUpsert) {
      console.warn(`Aviso no lote ${i}:`, erroUpsert.message);
    } else {
      atualizados += updates.length;
      process.stdout.write(`\r⏳ Sincronizados no Supabase: ${atualizados}/${codigos.length} materiais...`);
    }
  }

  console.log('\n\n🎉 Sucesso! Todas as informações de Último Consumo agora estão gravadas no banco de dados Supabase.');
}

sincronizarUltimoConsumo().catch((err) => {
  console.error('❌ Erro inesperado:', err);
});

