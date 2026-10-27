/**
 * Utilitário para geração de e-mails corporativos via Outlook (Desktop, Web e Clipboard)
 * Compatível com Office 365, Outlook Web e Outlook App para Windows.
 * Redireciona o usuário diretamente para o rascunho preenchido para apenas revisar e enviar.
 */

const STORAGE_KEY_DESTINATARIOS = 'videplast_destinatarios_email';
const STORAGE_KEY_PREFERENCIA_ENVIO = 'videplast_modo_email_preferido'; // 'web' | 'desktop'

export function obterDestinatariosSalvos() {
  try {
    const salvo = localStorage.getItem(STORAGE_KEY_DESTINATARIOS);
    if (salvo) {
      return JSON.parse(salvo);
    }
  } catch (err) {
    console.warn('Erro ao carregar destinatários do localStorage:', err);
  }

  return {
    almoxarifado: 'matheus.lampugnani@videplast.com.br',
    supervisor: 'matheus.lampugnani@videplast.com.br',
    coordenador: 'cleidiomar.jesus@videplast.com.br',
    matriz: 'cleidiomar.jesus@videplast.com.br'
  };
}

export function salvarDestinatarios(destinatarios) {
  try {
    localStorage.setItem(STORAGE_KEY_DESTINATARIOS, JSON.stringify(destinatarios));
  } catch (err) {
    console.warn('Erro ao salvar destinatários no localStorage:', err);
  }
}

export function obterModoEnvioPreferido() {
  try {
    return localStorage.getItem(STORAGE_KEY_PREFERENCIA_ENVIO) || 'web';
  } catch {
    return 'web';
  }
}

export function salvarModoEnvioPreferido(modo) {
  try {
    localStorage.setItem(STORAGE_KEY_PREFERENCIA_ENVIO, modo);
  } catch {}
}

/**
 * 1. Template para NOVA SOLICITAÇÃO (Abertura pela Supervisão / Almoxarifado)
 * Redireciona para notificar Almoxarifado, Supervisor e Coordenador
 */
export function gerarEmailNovaSolicitacao({ solicitacao, item, customDestinatarios }) {
  const dests = customDestinatarios || obterDestinatariosSalvos();
  const to = [dests.almoxarifado, dests.supervisor, dests.coordenador].filter(Boolean).join(';');

  const difMin = solicitacao.novoMin - solicitacao.minAtual;
  const difMax = solicitacao.novoMax - solicitacao.maxAtual;
  const sinalMin = difMin > 0 ? `+${difMin}` : `${difMin}`;
  const sinalMax = difMax > 0 ? `+${difMax}` : `${difMax}`;
  const unidade = solicitacao.itemUnidade || item?.unidade || 'un';

  const subject = `[Videplast Filial] Nova Solicitação de Ajuste de Mín/Máx - Material SAP ${solicitacao.itemCodigo}`;

  const body = `Prezados,

Informamos que foi registrada no sistema uma nova solicitação de alteração de parâmetros de Estoque Mínimo e Máximo na Filial, necessitando de análise e validação da equipe:

----------------------------------------------------------------------
1. DADOS DO MATERIAL (SAP)
----------------------------------------------------------------------
• Código SAP: ${solicitacao.itemCodigo}
• Descrição: ${solicitacao.itemNome}
• Unidade de Medida: ${unidade}
• Setor Solicitante: ${solicitacao.setor || 'Geral'}
• Solicitante: ${solicitacao.solicitante || 'Supervisor'}
• Data/Hora da Abertura: ${new Date().toLocaleString('pt-BR')}

----------------------------------------------------------------------
2. PARÂMETROS PROPOSTOS
----------------------------------------------------------------------
• Estoque Mínimo:
  - Atual no SAP: ${solicitacao.minAtual} ${unidade}
  - Proposto:     ${solicitacao.novoMin} ${unidade} (${sinalMin} ${unidade})

• Estoque Máximo:
  - Atual no SAP: ${solicitacao.maxAtual} ${unidade}
  - Proposto:     ${solicitacao.novoMax} ${unidade} (${sinalMax} ${unidade})

----------------------------------------------------------------------
3. JUSTIFICATIVA OPERACIONAL
----------------------------------------------------------------------
"${solicitacao.justificativa}"

----------------------------------------------------------------------
4. PRÓXIMOS PASSOS
----------------------------------------------------------------------
A solicitação encontra-se disponível no Sistema de MRP para deliberação do Almoxarifado e Coordenação. 

Após a aprovação local da Filial, a ficha técnica será automaticamente reencaminhada à Matriz (Cleidiomar) para efetivação no SAP.

Atenciosamente,
Sistema de Gestão de Mínimos e Máximos (MRP)
Videplast Filial`;

  return { to, cc: '', subject, body };
}

/**
 * 2. Template para SOLICITAÇÃO APROVADA (Reencaminhamento à Matriz)
 * Redireciona com dados completos para o responsável na Matriz (Cleidiomar)
 */
export function gerarEmailAprovacaoMatriz({ solicitacao, respondidoPor = 'Matheus Lampugnani (Almoxarifado Filial)', customDestinatarios }) {
  const dests = customDestinatarios || obterDestinatariosSalvos();
  const to = dests.matriz || 'cleidiomar.jesus@videplast.com.br';
  const cc = [dests.coordenador, dests.almoxarifado].filter(Boolean).join(';');

  const difMin = solicitacao.novoMin - solicitacao.minAtual;
  const difMax = solicitacao.novoMax - solicitacao.maxAtual;
  const sinalMin = difMin > 0 ? `+${difMin}` : `${difMin}`;
  const sinalMax = difMax > 0 ? `+${difMax}` : `${difMax}`;
  const unidade = solicitacao.itemUnidade || 'un';

  const subject = `[Videplast Filial] Solicitação Aprovada - Atualizar Parâmetros no SAP - Material ${solicitacao.itemCodigo}`;

  const body = `Prezado Cleidiomar,

A equipe de Almoxarifado e a Coordenação da Filial analisaram e aprovaram a solicitação de reajuste de parâmetros de estoque para o item abaixo.

Solicitamos a gentileza de realizar a devida alteração nos parâmetros do cadastro de material no SAP:

• Código SAP: ${solicitacao.itemCodigo}
• Descrição: ${solicitacao.itemNome}

ESTOQUE MÍNIMO:
NOVO VALOR A CADASTRAR: ${solicitacao.novoMin} ${unidade}

ESTOQUE MÁXIMO:
NOVO VALOR A CADASTRAR: ${solicitacao.novoMax} ${unidade}

Justificativa Operacional:
"${solicitacao.justificativa}"`;

  return { to, cc, subject, body };
}


/**
 * 3. Template para CONCLUSÃO NO SAP (Matriz concluiu a alteração)
 * Redireciona para notificar o Solicitante, Supervisor e Almoxarifado
 */
export function gerarEmailConclusaoSAP({ solicitacao, finalizadoPor = 'Matheus Lampugnani (Almoxarifado Filial)', customDestinatarios }) {
  const dests = customDestinatarios || obterDestinatariosSalvos();
  const to = [dests.supervisor, dests.almoxarifado, dests.coordenador].filter(Boolean).join(';');

  const unidade = solicitacao.itemUnidade || 'un';

  const subject = `[Videplast Filial] Concluído no SAP - Material ${solicitacao.itemCodigo} Atualizado com Sucesso`;

  const body = `Prezados,

Informamos que a alteração dos parâmetros de Estoque Mínimo e Máximo solicitada para o material abaixo foi CONCLUÍDA NO SAP com sucesso pelo responsável da Matriz:

----------------------------------------------------------------------
DADOS DO MATERIAL ATUALIZADO:
----------------------------------------------------------------------
• Código SAP: ${solicitacao.itemCodigo}
• Descrição: ${solicitacao.itemNome}
• Novo Estoque Mínimo (SAP): ${solicitacao.novoMin} ${unidade}
• Novo Estoque Máximo (SAP): ${solicitacao.novoMax} ${unidade}

• Setor Demandante: ${solicitacao.setor} (${solicitacao.solicitante})
• Conclusão Confirmada em: ${new Date().toLocaleString('pt-BR')} por ${finalizadoPor}
----------------------------------------------------------------------

Os parâmetros já se encontram atualizados no sistema de MRP da Filial e em plena vigência no SAP.

Atenciosamente,
Almoxarifado Central - Videplast Filial`;

  return { to, cc: '', subject, body };
}

/**
 * 4. Template para RECUSA DE SOLICITAÇÃO
 * Redireciona para notificar o Solicitante e Coordenação sobre a recusa
 */
export function gerarEmailRecusa({ solicitacao, motivoRecusa, respondidoPor = 'Matheus Lampugnani (Almoxarifado Filial)', customDestinatarios }) {
  const dests = customDestinatarios || obterDestinatariosSalvos();
  const to = [dests.supervisor, dests.coordenador].filter(Boolean).join(';');

  const subject = `[Videplast Filial] Retorno de Solicitação - Material SAP ${solicitacao.itemCodigo}`;

  const body = `Prezado(a) ${solicitacao.solicitante},

Informamos que a solicitação de alteração dos parâmetros de Mínimo e Máximo para o material ${solicitacao.itemCodigo} (${solicitacao.itemNome}) foi avaliada pela equipe de Almoxarifado e Coordenação da Filial e NÃO FOI APROVADA no momento.

----------------------------------------------------------------------
MOTIVO DA RECUSA:
"${motivoRecusa || 'Não aprovado conforme análise dos critérios de armazenagem/estoque.'}"
----------------------------------------------------------------------

DADOS DA SOLICITAÇÃO ANALISADA:
• Setor: ${solicitacao.setor}
• Mínimo Proposto: ${solicitacao.novoMin} ${solicitacao.itemUnidade || 'un'}
• Máximo Proposto: ${solicitacao.novoMax} ${solicitacao.itemUnidade || 'un'}
• Avaliado por: ${respondidoPor} em ${new Date().toLocaleString('pt-BR')}

Caso haja novas informações operacionais ou necessidades adicionais, favor alinhar diretamente com a equipe do Almoxarifado antes de submeter uma nova solicitação.

Atenciosamente,
Almoxarifado Central - Videplast Filial`;

  return { to, cc: '', subject, body };
}


/**
 * Gera o link para o Outlook Web (Office 365)
 */
export function obterLinkOutlookWeb({ to, cc = '', subject, body }) {
  const params = [];
  if (to) params.push(`to=${encodeURIComponent(to)}`);
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  return `https://outlook.office.com/mail/deeplink/compose?${params.join('&')}`;
}

/**
 * Gera o link mailto para o Outlook Desktop
 */
export function obterLinkMailto({ to, cc = '', subject, body }) {
  const params = [];
  if (cc) params.push(`cc=${encodeURIComponent(cc)}`);
  if (subject) params.push(`subject=${encodeURIComponent(subject)}`);
  if (body) params.push(`body=${encodeURIComponent(body)}`);

  return `mailto:${to}?${params.join('&')}`;
}

export function abrirOutlookWeb(emailDados) {
  const webUrl = obterLinkOutlookWeb(emailDados);
  window.open(webUrl, '_blank', 'noopener,noreferrer');
}

export function abrirOutlookDesktop(emailDados) {
  const url = obterLinkMailto(emailDados);
  window.location.href = url;
}

export function abrirOutlook(emailDados) {
  redirecionarParaEmail(emailDados);
}

/**
 * Redireciona o usuário diretamente para o rascunho de e-mail pronto
 * Tenta abrir o Outlook Web (Office 365) em nova aba (mais confiável) ou dispara o desktop se preferido.
 */
export function redirecionarParaEmail(emailDados, modo = 'web') {
  if (modo === 'desktop') {
    abrirOutlookDesktop(emailDados);
    return;
  }

  const webUrl = obterLinkOutlookWeb(emailDados);
  const popup = window.open(webUrl, '_blank', 'noopener,noreferrer');
  // Se o navegador bloqueou o popup da nova aba, tenta via mailto como fallback
  if (!popup || popup.closed || typeof popup.closed === 'undefined') {
    abrirOutlookDesktop(emailDados);
  }
}

