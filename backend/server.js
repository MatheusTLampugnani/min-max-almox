import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

function validarVariaveisAmbiente() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error(
      '\n[ERRO DE CONFIGURAÇÃO] SUPABASE_URL ou SUPABASE_ANON_KEY não foram informadas no .env!\n'
    );
    process.exit(1);
  }
}

validarVariaveisAmbiente();

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`Servidor Backend Videplast rodando na porta ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Itens: http://localhost:${PORT}/api/itens`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(
      `\n[ERRO] A porta ${PORT} já está em uso por outro processo do servidor. Feche o terminal anterior ou encerre o processo na porta ${PORT}.\n`
    );
    process.exit(1);
  }
  throw err;
});
