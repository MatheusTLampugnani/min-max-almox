import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

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

export const solicitacoesRepository = {
  async listar({ status = '' } = {}) {
    let lista = [...solicitacoesMemoria];
    if (status) {
      if (status === 'aprovada') {
        // Compatibilidade com status anterior: abrange tanto 'aprovada' quanto 'encaminhada_matriz' e 'concluida'
        lista = lista.filter((s) => s.status === 'aprovada' || s.status === 'encaminhada_matriz' || s.status === 'concluida');
      } else {
        lista = lista.filter((s) => s.status === status);
      }
    }
    return lista.sort((a, b) => new Date(b.dataCriacao) - new Date(a.dataCriacao));
  },

  async buscarPorId(id) {
    const item = solicitacoesMemoria.find((s) => s.id === id);
    return item ? { ...item } : null;
  },

  async contarPendentes() {
    return solicitacoesMemoria.filter((s) => s.status === 'pendente').length;
  },

  async criar(dados) {
    const novaSolicitacao = {
      id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      ...dados,
      status: 'pendente',
      dataCriacao: new Date().toISOString(),
      dataResposta: null,
      respondidoPor: null,
      motivoRecusa: null,
      emailNotificacaoFilial: true,
      emailNotificacaoMatriz: false
    };
    solicitacoesMemoria.unshift(novaSolicitacao);
    salvarEmDisco();
    return { ...novaSolicitacao };
  },

  async atualizarStatus(id, alteracoes = {}) {
    const index = solicitacoesMemoria.findIndex((s) => s.id === id);
    if (index === -1) return null;

    solicitacoesMemoria[index] = {
      ...solicitacoesMemoria[index],
      ...alteracoes,
      dataResposta: alteracoes.dataResposta || new Date().toISOString()
    };
    salvarEmDisco();
    return { ...solicitacoesMemoria[index] };
  }
};

