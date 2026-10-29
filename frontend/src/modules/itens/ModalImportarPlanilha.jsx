import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { UploadCloud, FileSpreadsheet, CheckCircle, AlertTriangle, X, RefreshCw, Layers, ArrowRight } from 'lucide-react';
import { Modal } from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { api } from '../../lib/api.js';
import { useToast } from '../../components/ui/Toast.jsx';
import { formatarCategoria } from './categoriasSap.js';

// Normalizador de chaves para mapear nomes de colunas do SAP
function normalizarTexto(txt) {
  return String(txt || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

function normalizarCompacto(txt) {
  return normalizarTexto(txt).replace(/[^a-z0-9]/g, '');
}

function converterNumeroPtBr(valor) {
  if (valor === null || valor === undefined || valor === '') return 0;
  if (typeof valor === 'number') return valor;

  let str = String(valor).trim();
  if (!str) return 0;

  // Formato brasileiro completo: 974.120,00 -> 974120.00
  if (str.includes('.') && str.includes(',')) {
    str = str.replace(/\./g, '').replace(',', '.');
  } else if (str.includes(',')) {
    // 2255,40 -> 2255.40
    str = str.replace(',', '.');
  } else if (str.includes('.')) {
    // Pode ser milhar do SAP (ex: '150.000', '-6.470') ou decimal ('0.125')
    const partes = str.split('.');
    if (partes.length > 2) {
      str = str.replace(/\./g, '');
    } else if (partes.length === 2) {
      const parteInt = partes[0].replace('-', '');
      const parteDec = partes[1];
      // Se tiver 3 dígitos e a parte inteira não for 0 (ex: 150.000 ou -6.470), é milhar
      if (parteDec.length === 3 && parteInt !== '0') {
        str = partes[0] + partes[1];
      }
    }
  }

  const num = Number(str);
  return isNaN(num) ? 0 : num;
}

function formatarDataPlanilha(val) {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number' && val > 20000) {
    // Serial date do Excel
    const utcDays = Math.floor(val - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    const dia = String(d.getUTCDate()).padStart(2, '0');
    const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
    const ano = d.getUTCFullYear();
    return `${dia}/${mes}/${ano}`;
  }
  const str = String(val).trim();
  if (!str || str === '00.00.0000' || str === '0') return null;
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(str)) {
    return str.replace(/\./g, '/');
  }
  return str;
}

export function ModalImportarPlanilha({ isOpen, onClose, onImportadoComSucesso }) {
  const { mostrarToast } = useToast();
  const fileInputRef = useRef(null);

  const [arquivo, setArquivo] = useState(null);
  const [workbookRef, setWorkbookRef] = useState(null);
  const [abasDisponiveis, setAbasDisponiveis] = useState([]);
  const [abaSelecionada, setAbaSelecionada] = useState('');
  const [itensPreview, setItensPreview] = useState([]);
  const [totalItensPlanilha, setTotalItensPlanilha] = useState(0);
  const [processandoLeitura, setProcessandoLeitura] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [resultadoImportacao, setResultadoImportacao] = useState(null);
  const [erro, setErro] = useState(null);
  const [diagnostico, setDiagnostico] = useState(null);

  const resetarEstado = () => {
    setArquivo(null);
    setWorkbookRef(null);
    setAbasDisponiveis([]);
    setAbaSelecionada('');
    setItensPreview([]);
    setTotalItensPlanilha(0);
    setProcessandoLeitura(false);
    setEnviando(false);
    setResultadoImportacao(null);
    setErro(null);
    setDiagnostico(null);
  };

  const handleClose = () => {
    resetarEstado();
    onClose();
  };

  // Parser inteligente de uma aba da planilha
  const extrairItensDaAba = (wb, nomeAba) => {
    const worksheet = wb.Sheets[nomeAba];
    if (!worksheet) {
      throw new Error(`Aba "${nomeAba}" não foi encontrada no arquivo.`);
    }

    const matrizLinhas = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
    if (!matrizLinhas || matrizLinhas.length === 0) {
      throw new Error(`A aba "${nomeAba}" está vazia.`);
    }

    // Dicionário opcional da aba MB52 para enriquecer unidade e categoria oficial do SAP
    const mapaMB52 = new Map();
    if (wb.Sheets['MB52']) {
      try {
        const linhasMB52 = XLSX.utils.sheet_to_json(wb.Sheets['MB52'], { header: 1, defval: '' });
        for (let r = 1; r < linhasMB52.length; r++) {
          const l = linhasMB52[r];
          const cod = String(l[1] || '').trim();
          if (cod) {
            mapaMB52.set(cod, {
              grupo: String(l[0] || '').trim(),
              unidade: String(l[5] || '').trim(),
              deposito: String(l[4] || '').trim()
            });
          }
        }
      } catch (err) {
        console.warn('[IMPORTACAO] Aviso ao ler MB52:', err);
      }
    }

    // Dicionário da aba MC.9 para capturar a Data de Último Consumo (Coluna K = índice 10)
    const mapaMC9 = new Map();
    const nomeAbaMC9 = wb.SheetNames?.find((n) => n.trim().toUpperCase() === 'MC.9');
    if (nomeAbaMC9 && wb.Sheets[nomeAbaMC9]) {
      try {
        const linhasMC9 = XLSX.utils.sheet_to_json(wb.Sheets[nomeAbaMC9], { header: 1, defval: '' });
        for (let r = 1; r < linhasMC9.length; r++) {
          const l = linhasMC9[r];
          const cod = String(l[0] || '').trim();
          const ultConsumoFormatado = formatarDataPlanilha(l[10]);
          if (cod && ultConsumoFormatado) {
            mapaMC9.set(cod, ultConsumoFormatado);
          }
        }
      } catch (err) {
        console.warn('[IMPORTACAO] Aviso ao ler MC.9:', err);
      }
    }

    // Helper functions com regex resiliente
    const isCodCol = (str) => {
      const n = normalizarCompacto(str);
      return /cod|sap|material|item|produto|sku|referencia|partnum/i.test(n);
    };

    const isDescCol = (str) => {
      const n = normalizarCompacto(str);
      return /desc|texto|denom|nome|especif/i.test(n);
    };

    const isOutroCabecalho = (str) => {
      const n = normalizarCompacto(str);
      return /estoque|minimo|maximo|mrp|consumo|distorc|saldo/i.test(n);
    };

    // 1. Localizar a linha que contém o cabeçalho (varre até as primeiras 100 linhas)
    let linhaCabecalhoIdx = -1;
    for (let r = 0; r < Math.min(100, matrizLinhas.length); r++) {
      const linha = matrizLinhas[r];
      if (!linha || !Array.isArray(linha)) continue;

      const temCod = linha.some((c) => isCodCol(c));
      const temDescOuOutro = linha.some((c) => isDescCol(c) || isOutroCabecalho(c));

      if (temCod && temDescOuOutro) {
        linhaCabecalhoIdx = r;
        break;
      }
    }

    // Heurística de Fallback se não encontrou cabeçalho textual claro
    let fallbackIdxCodigo = -1;
    let fallbackIdxDescricao = -1;
    let fallbackDataRow = -1;

    if (linhaCabecalhoIdx === -1) {
      for (let r = 0; r < Math.min(50, matrizLinhas.length); r++) {
        const linha = matrizLinhas[r];
        if (!linha || !Array.isArray(linha)) continue;

        for (let c = 0; c < linha.length - 1; c++) {
          const valC = String(linha[c] || '').trim();
          const valNext = String(linha[c + 1] || '').trim();
          const isNumCode = /^\d{5,10}$/.test(valC);
          const isTextDesc = valNext.length >= 4 && /[a-zA-Z]/.test(valNext);

          if (isNumCode && isTextDesc) {
            fallbackIdxCodigo = c;
            fallbackIdxDescricao = c + 1;
            fallbackDataRow = r;
            break;
          }
        }
        if (fallbackIdxCodigo !== -1) break;
      }

      if (fallbackIdxCodigo !== -1) {
        linhaCabecalhoIdx = Math.max(0, fallbackDataRow - 1);
      }
    }

    if (linhaCabecalhoIdx === -1 && fallbackIdxCodigo === -1) {
      throw new Error(
        'Não foi possível encontrar a linha de cabeçalho da planilha. Verifique se o arquivo possui colunas com código e descrição de materiais.'
      );
    }

    const linhaCabecalho = linhaCabecalhoIdx >= 0 ? matrizLinhas[linhaCabecalhoIdx] : [];
    const linhaSuper = linhaCabecalhoIdx > 0 ? matrizLinhas[linhaCabecalhoIdx - 1] : [];

    // Mapeamento dos índices exatos de cada coluna
    let idxCodigo = fallbackIdxCodigo;
    let idxDescricao = fallbackIdxDescricao;
    let idxConsumo12M = -1;
    let idxConsumoMedio = -1;
    let idxMinAtual = -1;
    let idxMaxAtual = -1;
    let idxSaldo = -1;
    let idxMrpMin = -1;
    let idxMrpMax = -1;
    let idxDistorcao = -1;
    let idxUnidade = -1;
    let idxCategoria = -1;
    let idxEndereco = -1;

    if (linhaCabecalho.length > 0) {
      let superTituloCorrente = '';
      for (let col = 0; col < linhaCabecalho.length; col++) {
        const sub = normalizarCompacto(linhaCabecalho[col]);
        const sup = normalizarCompacto(linhaSuper[col] || '');
        if (sup) {
          superTituloCorrente = sup;
        }
        const comb = `${superTituloCorrente}_${sub}`;

        // Código SAP
        if (idxCodigo === -1 && isCodCol(sub)) {
          idxCodigo = col;
          continue;
        }

        // Descrição
        if (idxDescricao === -1 && isDescCol(sub)) {
          idxDescricao = col;
          continue;
        }

        // Consumo Médio (ex: Consumo Médio - 12 meses)
        if (idxConsumoMedio === -1 && /consumomedio/i.test(sub)) {
          idxConsumoMedio = col;
          continue;
        }

        // Consumo 12 Meses (ex: Consumo 12 Meses)
        if (idxConsumo12M === -1 && /consumo12|consumoano|consumoanual/i.test(sub)) {
          idxConsumo12M = col;
          continue;
        }

        // Distorção
        if (idxDistorcao === -1 && /distorc/i.test(sub)) {
          idxDistorcao = col;
          continue;
        }

        // Estoque Atual / Saldo (ex: Estoque Atual)
        if (idxSaldo === -1 && /estoqueatual|saldo|utilizacaolivre|livreutiliz/i.test(sub)) {
          idxSaldo = col;
          continue;
        }

        // Sugestão MRP Mínimo e Máximo (sob cabeçalho SUGESTÃO MRP)
        if (comb.includes('mrp') || comb.includes('sugestao')) {
          if (idxMrpMin === -1 && /min/i.test(sub)) {
            idxMrpMin = col;
            continue;
          }
          if (idxMrpMax === -1 && /max/i.test(sub)) {
            idxMrpMax = col;
            continue;
          }
        }

        // Estoque Mínimo e Máximo Atuais (não devem ser afetados por Avaliação Diego ou MRP)
        if (!comb.includes('diego') && !comb.includes('suj') && !comb.includes('mrp') && !comb.includes('sugestao')) {
          if (idxMinAtual === -1 && /min/i.test(sub)) {
            idxMinAtual = col;
            continue;
          }
          if (idxMaxAtual === -1 && /max/i.test(sub)) {
            idxMaxAtual = col;
            continue;
          }
        }

        // Unidade
        if (idxUnidade === -1 && (/^(un|und|unidade|umb|medida)$/i.test(sub) || /unidade|umb/i.test(sub))) {
          idxUnidade = col;
          continue;
        }

        // Categoria / Estrutura
        if (idxCategoria === -1 && /estrutura|categoria|grupo|familia|tipo/i.test(sub)) {
          idxCategoria = col;
          continue;
        }

        // Endereço (na aba MRP fica na coluna D = índice 3)
        if (idxEndereco === -1 && /endereco|posicao|localizacao|rua|deposito/i.test(sub)) {
          idxEndereco = col;
          continue;
        }
      }
    }

    // Na aba MRP, garante que o endereço seja lido da coluna D (índice 3)
    if (nomeAba.trim().toUpperCase() === 'MRP') {
      idxEndereco = 3;
    }

    // Se código foi achado mas descrição não, tenta a coluna imediatamente à direita do código
    if (idxCodigo !== -1 && idxDescricao === -1 && idxCodigo + 1 < matrizLinhas[0]?.length) {
      idxDescricao = idxCodigo + 1;
    }

    if (idxCodigo === -1) {
      throw new Error('Coluna de Código do SAP não foi identificada na planilha.');
    }

    // 2. Extrair dados das linhas
    const inicioDadosIdx = fallbackDataRow !== -1 && fallbackDataRow > linhaCabecalhoIdx ? fallbackDataRow : linhaCabecalhoIdx + 1;
    const itensMapeados = [];

    for (let r = inicioDadosIdx; r < matrizLinhas.length; r++) {
      const linha = matrizLinhas[r];
      if (!linha || linha.length === 0) continue;

      const codCru = String(linha[idxCodigo] || '').trim();
      if (!codCru) continue;

      const codNormalizado = normalizarCompacto(codCru);
      // Pula eventuais repetições de cabeçalho
      if (codNormalizado.includes('codigo') || codNormalizado.includes('material') || codNormalizado.includes('sap')) {
        continue;
      }

      const nome = idxDescricao !== -1 && linha[idxDescricao] ? String(linha[idxDescricao]).trim() : `Material ${codCru}`;
      const consumo12Meses = idxConsumo12M !== -1 ? converterNumeroPtBr(linha[idxConsumo12M]) : 0;
      const consumoMedioPlanilha = idxConsumoMedio !== -1 ? converterNumeroPtBr(linha[idxConsumoMedio]) : (consumo12Meses > 0 ? Math.round((consumo12Meses / 12) * 100) / 100 : 0);

      const min = idxMinAtual !== -1 ? converterNumeroPtBr(linha[idxMinAtual]) : 0;
      let max = idxMaxAtual !== -1 ? converterNumeroPtBr(linha[idxMaxAtual]) : 0;

      // Se o estoque máximo vier zerado ou menor que o mínimo, ajusta uma margem padrão
      if (min > 0 && max <= min) {
        max = Math.round(min * 2);
      }

      const sugestaoMrpMin = idxMrpMin !== -1 ? converterNumeroPtBr(linha[idxMrpMin]) : null;
      const sugestaoMrpMax = idxMrpMax !== -1 ? converterNumeroPtBr(linha[idxMrpMax]) : null;

      // Distorção: coluna da planilha calculada pelas funções do Excel, ou cálculo automático (MRP Max - Atual Max)
      let distorcao = null;
      if (idxDistorcao !== -1 && linha[idxDistorcao] !== '' && linha[idxDistorcao] !== undefined) {
        distorcao = converterNumeroPtBr(linha[idxDistorcao]);
      } else if (sugestaoMrpMax !== null && max !== null) {
        distorcao = Math.round((sugestaoMrpMax - max) * 100) / 100;
      }

      const saldo = idxSaldo !== -1 ? converterNumeroPtBr(linha[idxSaldo]) : 0;

      const infoMB52 = mapaMB52.get(codCru) || {};
      const unidade = (idxUnidade !== -1 && linha[idxUnidade] ? String(linha[idxUnidade]).trim() : null) || infoMB52.unidade || 'un';
      const catBruta = (idxCategoria !== -1 && linha[idxCategoria] ? String(linha[idxCategoria]).trim() : null) || infoMB52.grupo || 'Geral';
      const categoria = formatarCategoria(catBruta);
      const enderecoCelula = idxEndereco !== -1 && linha[idxEndereco] !== undefined && linha[idxEndereco] !== null
        ? String(linha[idxEndereco]).trim()
        : '';
      const endereco = enderecoCelula || 'Sem endereço';
      const ultimoConsumo = mapaMC9.get(codCru) || null;

      itensMapeados.push({
        codigo: codCru,
        nome,
        categoria,
        unidade,
        saldo,
        min,
        max,
        sugestaoMrpMin,
        sugestaoMrpMax,
        consumoMedioPlanilha,
        consumo12Meses,
        endereco,
        ultimoConsumo,
        distorcao
      });
    }

    if (itensMapeados.length === 0) {
      throw new Error(`Nenhum material válido foi encontrado na aba "${nomeAba}".`);
    }

    return {
      itens: itensMapeados,
      totalLinhas: matrizLinhas.length,
      amostraLinhas: matrizLinhas.slice(0, 4)
    };
  };

  const processarArquivoExcel = async (file) => {
    if (!file) return;

    const extensao = file.name.split('.').pop().toLowerCase();
    if (!['xlsx', 'xls', 'csv'].includes(extensao)) {
      setErro('Por favor, selecione um arquivo de planilha válido (.xlsx, .xls ou .csv).');
      return;
    }

    setProcessandoLeitura(true);
    setErro(null);
    setDiagnostico(null);
    setArquivo(file);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      setWorkbookRef(workbook);

      const abas = workbook.SheetNames || [];
      setAbasDisponiveis(abas);

      if (abas.length === 0) {
        throw new Error('O arquivo não contém nenhuma aba legível.');
      }

      // Auto-seleciona a aba mais provável (com mais linhas e colunas de dados)
      let melhorAba = abas[0];
      let melhorPontuacao = -1;

      for (const nomeAba of abas) {
        const ws = workbook.Sheets[nomeAba];
        if (!ws) continue;
        const linhas = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
        if (!linhas || linhas.length === 0) continue;

        let pontuacao = 0;
        for (let r = 0; r < Math.min(60, linhas.length); r++) {
          const l = linhas[r];
          if (!Array.isArray(l)) continue;
          for (const cel of l) {
            const c = normalizarCompacto(cel);
            if (/cod|sap|material|item|produto|sku/i.test(c)) pontuacao += 15;
            if (/desc|texto|denom|nome|especif/i.test(c)) pontuacao += 15;
            if (/estoque|minimo|maximo|mrp|distorc|consumo|saldo/i.test(c)) pontuacao += 10;
          }
        }
        const linhasNaoVazias = linhas.filter((l) => l && l.some((c) => c !== '' && c !== null)).length;
        pontuacao += Math.min(100, linhasNaoVazias);

        if (pontuacao > melhorPontuacao) {
          melhorPontuacao = pontuacao;
          melhorAba = nomeAba;
        }
      }

      setAbaSelecionada(melhorAba);

      // Extrai os dados da aba selecionada
      const resultado = extrairItensDaAba(workbook, melhorAba);
      setTotalItensPlanilha(resultado.itens.length);
      setItensPreview(resultado.itens);
    } catch (err) {
      console.error('[ERRO LEITURA PLANILHA]', err);
      setErro(err.message || 'Erro ao processar o arquivo da planilha.');

      // Gera diagnóstico para auxiliar o usuário
      if (workbookRef || file) {
        try {
          const abasDetectadas = workbookRef?.SheetNames || [];
          const abaAtual = abaSelecionada || abasDetectadas[0] || 'Desconhecida';
          const ws = workbookRef?.Sheets[abaAtual];
          const linhas = ws ? XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' }) : [];

          setDiagnostico({
            abas: abasDetectadas,
            abaSelecionada: abaAtual,
            totalLinhas: linhas.length,
            amostraLinhas: linhas.slice(0, 4)
          });
        } catch {
          // ignora erro no diagnostico
        }
      }
    } finally {
      setProcessandoLeitura(false);
    }
  };

  const handleTrocarAba = (novaAba) => {
    if (!workbookRef || !novaAba) return;
    setAbaSelecionada(novaAba);
    setProcessandoLeitura(true);
    setErro(null);

    try {
      const resultado = extrairItensDaAba(workbookRef, novaAba);
      setTotalItensPlanilha(resultado.itens.length);
      setItensPreview(resultado.itens);
    } catch (err) {
      setErro(err.message);
      setItensPreview([]);
      setTotalItensPlanilha(0);
    } finally {
      setProcessandoLeitura(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processarArquivoExcel(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processarArquivoExcel(e.target.files[0]);
    }
  };

  const handleEnviarParaBanco = async () => {
    if (!itensPreview || itensPreview.length === 0) return;

    setEnviando(true);
    setErro(null);

    try {
      const resposta = await api.post('/itens/importar', {
        itens: itensPreview,
        nomeArquivo: arquivo ? arquivo.name : 'planilha_sap.xlsx'
      });

      const resultado = resposta.data.data;
      setResultadoImportacao(resultado);
      mostrarToast(
        `Importação concluída! ${resultado.novos} novos materiais e ${resultado.atualizados} atualizados.`,
        'success'
      );
    } catch (err) {
      console.error('[ERRO IMPORTACAO BACKEND]', err);
      const msg = err.response?.data?.erro || err.message || 'Falha ao sincronizar planilha no banco.';
      setErro(msg);
      mostrarToast(msg, 'error');
    } finally {
      setEnviando(false);
    }
  };

  const handleConcluir = () => {
    handleClose();
    if (onImportadoComSucesso) {
      onImportadoComSucesso();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Importação de Planilha do SAP" size="xl">
      <div className="space-y-5">
        {/* Etapa de Sucesso Concluída */}
        {resultadoImportacao ? (
          <div className="text-center py-6 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-800">
                Sincronização Concluída com Sucesso!
              </h3>
              <p className="text-sm text-slate-500">
                A tabela temporária foi processada e limpa. O histórico de auditoria foi gravado para acompanhamento da diretoria.
              </p>
            </div>

            {/* Cards de Resumo */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-3">
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
                <span className="text-xs font-bold text-emerald-700 uppercase">Novos Materiais</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">
                  +{resultadoImportacao.novos}
                </div>
                <span className="text-[11px] text-emerald-600">Adicionados ao catálogo</span>
              </div>

              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
                <span className="text-xs font-bold text-blue-700 uppercase">Atualizados</span>
                <div className="text-2xl font-black text-blue-800 mt-1">
                  {resultadoImportacao.atualizados}
                </div>
                <span className="text-[11px] text-blue-600">Saldo/MRP sobrescritos</span>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
                <span className="text-xs font-bold text-slate-600 uppercase">Inalterados</span>
                <div className="text-2xl font-black text-slate-800 mt-1">
                  {resultadoImportacao.inalterados}
                </div>
                <span className="text-[11px] text-slate-500">Mantidos no banco</span>
              </div>
            </div>

            <div className="pt-4">
              <Button variant="primary" onClick={handleConcluir} className="px-8 font-bold">
                Concluir e Atualizar Listagem
              </Button>
            </div>
          </div>
        ) : (
          <>
            {/* Orientações Rápidas */}
            <div className="bg-amber-50/70 border border-amber-200/80 p-3.5 rounded-xl text-xs text-amber-900 flex items-start gap-3">
              <Layers className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <strong>Regra de Sincronização Incremental:</strong>
                <p className="text-amber-800 leading-relaxed">
                  Os dados são carregados primeiro em uma tabela temporária. Itens já existentes no banco terão saldos e parâmetros atualizados com registro histórico de variação. Itens novos serão cadastrados. Itens no banco ausentes na planilha permanecerão intactos.
                </p>
              </div>
            </div>

            {/* Erro caso ocorra com Diagnóstico Técnico amigável */}
            {erro && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-xl text-xs text-red-700 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <div className="space-y-1">
                    <span className="font-bold text-red-800">{erro}</span>
                    <p className="text-[11px] text-red-600 leading-relaxed">
                      Certifique-se de que o arquivo exportado do SAP possui as colunas de Código do Material e Descrição.
                    </p>
                  </div>
                </div>

                {diagnostico && (
                  <div className="pt-2 border-t border-red-200/60 text-[11px] text-red-800 space-y-1">
                    <div className="font-semibold text-red-900">Diagnóstico do Arquivo Lido:</div>
                    <div>• <strong>Abas encontradas:</strong> {diagnostico.abas?.join(', ') || 'Nenhuma'}</div>
                    <div>• <strong>Aba analisada:</strong> {diagnostico.abaSelecionada} ({diagnostico.totalLinhas} linhas)</div>
                    {diagnostico.amostraLinhas?.length > 0 && (
                      <details className="mt-1">
                        <summary className="cursor-pointer font-bold text-red-700 hover:underline">
                          Visualizar primeiras linhas lidas do arquivo
                        </summary>
                        <div className="mt-1 bg-white p-2 rounded border border-red-200 font-mono text-[10px] overflow-x-auto max-h-28 text-slate-700 space-y-0.5">
                          {diagnostico.amostraLinhas.map((lin, idx) => (
                            <div key={idx} className="whitespace-nowrap">
                              <span className="text-slate-400 select-none mr-2">Linha {idx + 1}:</span>
                              {JSON.stringify(lin)}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Área de Drag & Drop */}
            {!arquivo && (
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-videplast-brand hover:bg-red-50/20 transition-all rounded-2xl p-8 text-center cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="w-14 h-14 bg-slate-100 group-hover:bg-red-100 text-slate-500 group-hover:text-videplast-brand rounded-2xl flex items-center justify-center mx-auto mb-3 transition-colors">
                  <UploadCloud className="w-7 h-7" />
                </div>

                <h4 className="font-bold text-slate-800 text-base mb-1">
                  Arraste a planilha do SAP aqui ou clique para selecionar
                </h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Formatos suportados: <strong>.xlsx</strong>, <strong>.xls</strong> ou <strong>.csv</strong> exportados diretamente do módulo de estoque do SAP
                </p>
              </div>
            )}

            {/* Spinner de leitura inicial */}
            {processandoLeitura && (
              <div className="py-8 text-center space-y-2">
                <RefreshCw className="w-6 h-6 animate-spin text-videplast-brand mx-auto" />
                <p className="text-xs font-bold text-slate-600">Lendo e mapeando colunas da planilha...</p>
              </div>
            )}

            {/* Pré-visualização dos dados mapeados */}
            {arquivo && !processandoLeitura && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 border border-slate-200/80 p-3 rounded-xl">
                  <div className="flex items-center gap-2.5">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">{arquivo.name}</div>
                      <div className="text-[11px] text-slate-500">
                        <strong className="text-emerald-700">{totalItensPlanilha}</strong> materiais válidos mapeados
                        {abaSelecionada && <span className="ml-1 text-slate-400">• Aba: {abaSelecionada}</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Seletor de abas se houver mais de uma */}
                    {abasDisponiveis.length > 1 && (
                      <div className="flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="text-[11px] font-semibold text-slate-500">Aba:</span>
                        <select
                          value={abaSelecionada}
                          onChange={(e) => handleTrocarAba(e.target.value)}
                          disabled={enviando}
                          className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-videplast-brand"
                        >
                          {abasDisponiveis.map((nome) => (
                            <option key={nome} value={nome}>{nome}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetarEstado}
                      className="text-slate-500 hover:text-red-600"
                      disabled={enviando}
                    >
                      <X className="w-3.5 h-3.5" />
                      Trocar arquivo
                    </Button>
                  </div>
                </div>

                {/* Tabela de Amostra das primeiras 5 linhas */}
                <div>
                  <div className="text-xs font-bold text-slate-700 mb-2 flex items-center justify-between">
                    <span>Pré-visualização das Primeiras Linhas:</span>
                    <span className="text-[11px] text-slate-400 font-normal">
                      Mostrando 5 de {totalItensPlanilha} itens
                    </span>
                  </div>

                  <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-56">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Código</th>
                            <th className="px-3 py-2">Descrição</th>
                            <th className="px-3 py-2">Endereço</th>
                            <th className="px-3 py-2">Últ. Consumo</th>
                            <th className="px-3 py-2 text-right">Consumo 12M</th>
                            <th className="px-3 py-2 text-right">Mín Atual</th>
                            <th className="px-3 py-2 text-right">Máx Atual</th>
                            <th className="px-3 py-2 text-right text-purple-700 bg-purple-50">MRP Mín</th>
                            <th className="px-3 py-2 text-right text-purple-700 bg-purple-50">MRP Máx</th>
                            <th className="px-3 py-2 text-right font-black">Distorção</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {itensPreview.slice(0, 5).map((item, idx) => {
                            const dist = Number(item.distorcao) || 0;
                            const distColor = dist > 0 ? 'text-amber-600 font-bold' : dist < 0 ? 'text-blue-600 font-bold' : 'text-slate-400';
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="px-3 py-2 font-mono font-bold text-slate-800">
                                  {item.codigo}
                                </td>
                                <td className="px-3 py-2 font-medium text-slate-800 max-w-[180px] truncate" title={item.nome}>
                                  {item.nome}
                                </td>
                                <td className="px-3 py-2 text-slate-700 font-mono">
                                  {item.endereco || '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-600 font-mono">
                                  {item.ultimoConsumo || '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-600 font-mono">
                                  {item.consumo12Meses ? item.consumo12Meses.toLocaleString('pt-BR') : '-'}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-600 font-mono">
                                  {item.min.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-3 py-2 text-right text-slate-600 font-mono">
                                  {item.max.toLocaleString('pt-BR')}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-purple-800 bg-purple-50/40 font-bold">
                                  {item.sugestaoMrpMin !== null ? item.sugestaoMrpMin.toLocaleString('pt-BR') : '-'}
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-purple-800 bg-purple-50/40 font-bold">
                                  {item.sugestaoMrpMax !== null ? item.sugestaoMrpMax.toLocaleString('pt-BR') : '-'}
                                </td>
                                <td className={`px-3 py-2 text-right font-mono ${distColor}`}>
                                  {dist > 0 ? `+${dist.toLocaleString('pt-BR')}` : dist.toLocaleString('pt-BR')}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <Button variant="ghost" onClick={handleClose} disabled={enviando}>
                    Cancelar
                  </Button>

                  <Button
                    variant="primary"
                    onClick={handleEnviarParaBanco}
                    loading={enviando}
                    className="font-bold flex items-center gap-2"
                  >
                    <span>Importar e Sincronizar ({totalItensPlanilha} itens)</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
