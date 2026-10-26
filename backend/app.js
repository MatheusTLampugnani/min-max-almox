import express from 'express';
import cors from 'cors';
import { authMiddleware } from './modules/auth/index.js';
import { AppError } from './modules/shared/index.js';
import itensRoutes from './routes/itens.routes.js';
import setoresRoutes from './routes/setores.routes.js';
import solicitacoesRoutes from './routes/solicitacoes.routes.js';
import historicoRoutes from './routes/historico.routes.js';
import dashboardRoutes from './routes/dashboard.routes.js';
import { getSupabase } from './lib/supabase.js';
import { itensService } from './modules/itens/index.js';

const app = express();

// Middlewares essenciais
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Identificação unificada de perfil pelo header x-perfil
app.use(authMiddleware);

// Health check simples
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    sistema: 'Videplast Estoque Mín/Máx Almoxarifado',
    data: new Date().toISOString(),
    perfilRequisitante: req.perfil
  });
});

// Endpoint de diagnóstico para verificar conexão com banco e ambiente em produção
app.get('/api/diagnostico', async (req, res) => {
  const info = {
    env: {
      NODE_ENV: process.env.NODE_ENV || 'não definido',
      DATA_SOURCE: process.env.DATA_SOURCE || 'não definido',
      PORT: process.env.PORT || 'não definido',
      hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
      hasSupabaseKey: Boolean(process.env.SUPABASE_KEY),
      hasSupabaseServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
      hasSupabaseAnonKey: Boolean(process.env.SUPABASE_ANON_KEY)
    }
  };

  try {
    const supabase = getSupabase();
    if (!supabase) {
      info.supabase = { status: 'null_client', motivo: 'Chaves ou URL não configuradas' };
    } else {
      const { data, error, count } = await supabase
        .from('materiais')
        .select('*', { count: 'exact', head: true });

      info.supabase = {
        status: error ? 'error' : 'connected',
        totalMateriaisNoBanco: count,
        error: error ? { message: error.message, code: error.code, details: error.details, hint: error.hint } : null
      };
    }
  } catch (e) {
    info.supabase = { status: 'exception', error: e.message };
  }

  try {
    const itens = await itensService.consultarItens();
    info.consultaItens = { status: 'ok', totalRetornado: itens.length };
  } catch (e) {
    info.consultaItens = { status: 'error', error: e.message, stack: e.stack };
  }

  res.json(info);
});

// Registro de rotas dos módulos
app.use('/api/itens', itensRoutes);
app.use('/api/setores', setoresRoutes);
app.use('/api/solicitacoes', solicitacoesRoutes);
app.use('/api/historico', historicoRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Servir o Frontend em Produção (quando o dist existir)
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const caminhoDist = path.resolve(__dirname, '../frontend/dist');

if (fs.existsSync(caminhoDist)) {
  app.use(express.static(caminhoDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(caminhoDist, 'index.html'));
  });
}

// Tratamento de rota não encontrada (404) apenas para /api
app.use('/api', (req, res) => {
  res.status(404).json({
    erro: `Rota da API não encontrada: ${req.method} ${req.originalUrl}`
  });
});

// Tratamento centralizado de erros
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      erro: err.message,
      detalhes: err.details || null
    });
  }

  console.error('[ERRO INTERNO NÃO TRATADO]', err);
  return res.status(500).json({
    erro: 'Ocorreu um erro interno no servidor. Tente novamente mais tarde.',
    mensagem: err.message || String(err),
    detalhes: err.details || err.stack || null
  });
});

export default app;
