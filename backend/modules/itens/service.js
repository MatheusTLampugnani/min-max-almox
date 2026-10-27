import { itensRepository } from './repository.js';
import {
  calcularSituacao,
  calcularCoberturaDias,
  calcularReposicaoSugerida
} from './regras.js';
import { NotFoundError, ValidationError } from '../shared/index.js';

export const itensService = {
  /**
   * Consulta itens com filtros por termo (código, nome, endereço), categoria e situação.
   * Calcula situação, cobertura e reposição de forma dinâmica e performática para os 1670+ materiais.
   */
  async consultarItens({ termo = '', categoria = '', situacao = '', distorcao = '' } = {}) {
    const todosItens = await itensRepository.listar();
    const itensAtivos = todosItens.filter((it) => it.ativo !== false);

    // Enriquece os itens com os cálculos de negócio usando o consumo médio real da planilha
    const itensCalculados = itensAtivos.map((item) => {
      const situacaoItem = calcularSituacao(item.saldo, item.min, item.max);
      // Consumo de 3 meses derivado da média mensal da planilha (coluna F)
      const mediaMensal = Number(item.consumoMedioPlanilha) || 0;
      const saidas3Meses = mediaMensal * 3;
      const coberturaDias = calcularCoberturaDias(item.saldo, saidas3Meses);
      const reposicaoSugerida = calcularReposicaoSugerida(
        item.saldo,
        item.min,
        item.max
      );

      // Distorção MRP: Diferença entre a sugestão do MRP e o parâmetro atual configurado
      let distorcaoCalculada = 0;
      if (item.sugestaoMrpMax !== null && item.sugestaoMrpMax !== undefined && item.max !== null && item.max !== undefined) {
        distorcaoCalculada = Math.round((Number(item.sugestaoMrpMax) - Number(item.max)) * 100) / 100;
      } else if (item.sugestaoMrpMin !== null && item.sugestaoMrpMin !== undefined && item.min !== null && item.min !== undefined) {
        distorcaoCalculada = Math.round((Number(item.sugestaoMrpMin) - Number(item.min)) * 100) / 100;
      }

      return {
        ...item,
        situacao: situacaoItem,
        coberturaDias,
        reposicaoSugerida,
        saidas3Meses,
        distorcao: distorcaoCalculada
      };
    });

    // Aplicação dos filtros
    const termoNormalizado = termo.trim().toLowerCase();

    return itensCalculados.filter((item) => {
      // Filtro por termo (código SAP, nome ou endereço físico)
      if (termoNormalizado) {
        const matchesCodigo = String(item.codigo).toLowerCase().includes(termoNormalizado);
        const matchesNome = String(item.nome).toLowerCase().includes(termoNormalizado);
        const matchesEndereco = String(item.endereco).toLowerCase().includes(termoNormalizado);
        if (!matchesCodigo && !matchesNome && !matchesEndereco) {
          return false;
        }
      }

      // Filtro por categoria
      if (categoria && item.categoria !== categoria) {
        return false;
      }

      // Filtro por situação ('abaixo', 'dentro', 'acima')
      if (situacao && item.situacao !== situacao) {
        return false;
      }

      // Filtro por distorção ('distorcidos', 'acima', 'abaixo', 'alinhado')
      if (distorcao) {
        if (['distorcidos', 'diferente_zero', 'todos_distorcidos'].includes(distorcao)) {
          if (item.distorcao === 0) return false;
        } else if (distorcao === 'acima') {
          if (item.distorcao <= 0) return false;
        } else if (distorcao === 'abaixo') {
          if (item.distorcao >= 0) return false;
        } else if (distorcao === 'alinhado' || distorcao === 'zero') {
          if (item.distorcao !== 0) return false;
        }
      }

      return true;
    });
  },

  /**
   * Análise comparativa completa de Distorções MRP com estatísticas para a gestão
   */
  async obterAnaliseDistorcao({ termo = '', categoria = '', distorcao = 'distorcidos' } = {}) {
    const todosItens = await this.consultarItens({ termo, categoria, distorcao: '' });

    // Estatísticas consolidadas
    const estatisticas = {
      total: todosItens.length,
      distorcidos: todosItens.filter((it) => it.distorcao !== 0).length,
      acimaZero: todosItens.filter((it) => it.distorcao > 0).length,
      abaixoZero: todosItens.filter((it) => it.distorcao < 0).length,
      alinhados: todosItens.filter((it) => it.distorcao === 0).length
    };

    // Itens filtrados de acordo com o parâmetro
    let itensFiltrados = todosItens;
    if (['distorcidos', 'diferente_zero'].includes(distorcao)) {
      itensFiltrados = todosItens.filter((it) => it.distorcao !== 0);
    } else if (distorcao === 'acima') {
      itensFiltrados = todosItens.filter((it) => it.distorcao > 0);
    } else if (distorcao === 'abaixo') {
      itensFiltrados = todosItens.filter((it) => it.distorcao < 0);
    } else if (distorcao === 'alinhado' || distorcao === 'zero') {
      itensFiltrados = todosItens.filter((it) => it.distorcao === 0);
    }

    // Ordenação padrão para análise: maiores distorções absolutas primeiro
    itensFiltrados.sort((a, b) => Math.abs(b.distorcao) - Math.abs(a.distorcao));

    return {
      estatisticas,
      itens: itensFiltrados
    };
  },


  /**
   * Detalhes completos de um item específico com série histórica dos últimos 6 meses
   */
  async obterDetalheItem(id) {
    const item = await itensRepository.buscarPorId(id);
    if (!item) {
      throw new NotFoundError(`Material com ID '${id}' não encontrado.`);
    }

    const saidas = await itensRepository.listarSaidasPorItem(id);
    const mediaMensal = Number(item.consumoMedioPlanilha) || 0;

    // Constrói agregação mensal dos últimos 6 meses para o gráfico Recharts
    const agora = new Date();
    const mapaMeses = new Map();

    for (let i = 5; i >= 0; i--) {
      const d = new Date(agora.getFullYear(), agora.getMonth() - i, 1);
      const chaveAnoMes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const rotuloMes = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' });
      mapaMeses.set(chaveAnoMes, { mes: rotuloMes, total: Math.round(mediaMensal) });
    }

    // Sobrescreve com saídas reais se existirem
    for (const saida of saidas) {
      const dataSaida = new Date(saida.data);
      const chave = `${dataSaida.getFullYear()}-${String(dataSaida.getMonth() + 1).padStart(2, '0')}`;
      if (mapaMeses.has(chave)) {
        const entry = mapaMeses.get(chave);
        entry.total = Math.max(entry.total, Number(saida.quantidade));
      }
    }

    const historicoUltimos6Meses = Array.from(mapaMeses.values());
    const situacao = calcularSituacao(item.saldo, item.min, item.max);
    const coberturaDias = calcularCoberturaDias(item.saldo, mediaMensal * 3);
    const reposicaoSugerida = calcularReposicaoSugerida(item.saldo, item.min, item.max);

    return {
      ...item,
      situacao,
      coberturaDias,
      reposicaoSugerida,
      mediaMensal: Math.round(mediaMensal * 10) / 10,
      historicoUltimos6Meses,
      ultimasMovimentacoes: saidas.slice(0, 10)
    };
  },

  async atualizarMinMax(id, { min, max, justificativa = '' }, { usuario = 'Almoxarifado Central', perfil = 'almoxarifado' } = {}) {
    if (min >= max) {
      throw new ValidationError('A quantidade mínima deve ser menor que a máxima.');
    }
    const item = await itensRepository.buscarPorId(id);
    if (!item) {
      throw new NotFoundError(`Material com ID '${id}' não encontrado.`);
    }

    const itemAtualizado = await itensRepository.atualizarMinMax(id, { min, max });

    // Registra auditoria da alteração direta
    try {
      const { historicoService } = await import('../historico/index.js');
      await historicoService.registrar({
        tipoAcao: 'alteracao_min_max_direta',
        titulo: 'Alteração Direta de Mín/Máx',
        usuario,
        perfil,
        item: {
          id: item.id,
          codigo: item.codigo,
          nome: item.nome,
          unidade: item.unidade,
          categoria: item.categoria
        },
        alteracao: {
          minAnterior: item.min,
          maxAnterior: item.max,
          novoMin: min,
          novoMax: max
        },
        justificativa: justificativa || 'Alteração direta efetuada via tela de consulta do Almoxarifado.'
      });
    } catch (err) {
      console.warn('[HISTORICO] Aviso ao registrar histórico de min/max:', err.message);
    }

    return itemAtualizado;
  },

  async criarItem(dados) {
    if (dados.min >= dados.max) {
      throw new ValidationError('A quantidade mínima deve ser menor que a máxima.');
    }

    const existente = await itensRepository.buscarPorCodigo(dados.codigo);
    if (existente) {
      throw new ValidationError(`Já existe um material cadastrado com o código '${dados.codigo}'.`);
    }

    return itensRepository.criar(dados);
  },

  async atualizarItem(id, dados) {
    if (dados.min >= dados.max) {
      throw new ValidationError('A quantidade mínima deve ser menor que a máxima.');
    }

    const item = await itensRepository.buscarPorId(id);
    if (!item) {
      throw new NotFoundError(`Material com ID '${id}' não encontrado.`);
    }

    return itensRepository.atualizar(id, dados);
  },

  async inativarItem(id) {
    const item = await itensRepository.buscarPorId(id);
    if (!item) {
      throw new NotFoundError(`Material com ID '${id}' não encontrado.`);
    }
    return itensRepository.inativar(id);
  },

  async importarPlanilhaSap({ itens, usuario = 'Almoxarifado', nomeArquivo = 'planilha.xlsx' }) {
    if (!Array.isArray(itens) || itens.length === 0) {
      throw new ValidationError('A planilha não contém dados válidos de materiais.');
    }
    return itensRepository.processarImportacaoPlanilha({ itens, usuario, nomeArquivo });
  },

  async listarCategorias() {
    const todosItens = await itensRepository.listar();
    const itensAtivos = todosItens.filter((it) => it.ativo !== false);
    const contagem = {};
    for (const it of itensAtivos) {
      const cat = String(it.categoria || 'Geral').trim();
      if (cat) {
        contagem[cat] = (contagem[cat] || 0) + 1;
      }
    }
    return Object.entries(contagem)
      .map(([categoria, total]) => ({ categoria, total }))
      .sort((a, b) => b.total - a.total);
  }
};

