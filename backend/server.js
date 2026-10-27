import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

function validarVariaveisAmbiente() {
  const dataSource = (process.env.DATA_SOURCE || 'supabase').toLowerCase();
  const port = process.env.PORT || 3001;

  console.log('----------------------------------------------------');
  console.log(' VIDEPLAST - SISTEMA DE ESTOQUE MÍNIMO E MÁXIMO');
  console.log('----------------------------------------------------');
  console.log(` Modos ativos: DATA_SOURCE = "${dataSource}" | PORT = ${port}`);

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.SUPABASE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '\n[ERRO DE CONFIGURAÇÃO] SUPABASE_URL ou chaves do Supabase não foram informadas no .env!\n'
    );
    process.exit(1);
  }
  console.log(' Conexão com Supabase configurada com sucesso.');
  console.log('----------------------------------------------------\n');
}

validarVariaveisAmbiente();

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor Backend Videplast rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Itens: http://localhost:${PORT}/api/itens`);
});
