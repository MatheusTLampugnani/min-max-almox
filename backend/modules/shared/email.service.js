import nodemailer from 'nodemailer';

/**
 * Obter configuração de destinatários a partir de variáveis de ambiente
 */
export function getEmailConfig() {
  return {
    smtp: {
      host: process.env.SMTP_HOST || '',
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER || '',
        pass: process.env.SMTP_PASS || ''
      }
    },
    from: process.env.EMAIL_FROM || 'matheus.lampugnani@videplast.com.br',
    recipients: {
      almoxarifado: process.env.EMAIL_ALMOXARIFADO || 'cleidiomar.jesus@videplast.com.br',
      supervisor: process.env.EMAIL_SUPERVISOR || 'wilian.santos@videplast.com.br',
      coordenador: process.env.EMAIL_COORDENADOR || '',
      matriz: process.env.EMAIL_MATRIZ || ''
    }
  };
}

let transporterInstance = null;

function getTransporter() {
  const config = getEmailConfig();
  if (!config.smtp.host || !config.smtp.auth.user) {
    return null;
  }

  if (!transporterInstance) {
    transporterInstance = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  return transporterInstance;
}

/**
 * Envia um e-mail de forma resiliente:
 * Se SMTP estiver configurado, envia via nodemailer.
 * Caso contrário, registra em log detalhado sem quebrar o fluxo da aplicação.
 */
async function enviarEmailResiliente({ to, cc, subject, html, text }) {
  const config = getEmailConfig();
  const transporter = getTransporter();

  const destinatarios = Array.isArray(to) ? to.join(', ') : to;
  const copias = cc ? (Array.isArray(cc) ? cc.join(', ') : cc) : '';

  if (!transporter) {
    console.log('\n=============================================================');
    console.log('📧 [EMAIL SIMULADO / LOG - SMTP NÃO CONFIGURADO EM .ENV]');
    console.log(`Para: ${destinatarios}`);
    if (copias) console.log(`CC: ${copias}`);
    console.log(`Assunto: ${subject}`);
    console.log('-------------------------------------------------------------');
    console.log(text || '(Conteúdo HTML gerado)');
    console.log('=============================================================\n');

    return {
      sucesso: true,
      modo: 'simulado',
      destinatarios,
      copias,
      motivo: 'SMTP_HOST ou credenciais não preenchidas no .env (Log registrado)'
    };
  }

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to,
      cc,
      subject,
      html,
      text
    });

    console.log(`[EMAIL ENVIADO] ID: ${info.messageId} | Para: ${destinatarios}`);
    return {
      sucesso: true,
      modo: 'smtp',
      messageId: info.messageId,
      destinatarios
    };
  } catch (error) {
    console.error('[EMAIL ERRO] Falha ao enviar via SMTP:', error.message);
    // Não quebramos o fluxo da API por falha de envio de email
    return {
      sucesso: false,
      modo: 'falha_smtp',
      erro: error.message,
      destinatarios
    };
  }
}

/**
 * Disparado quando uma NOVA solicitação de alteração é criada na filial.
 * Notifica Almoxarifado, Supervisor e Coordenador.
 */
export async function notificarNovaSolicitacao({ solicitacao, item }) {
  const { recipients } = getEmailConfig();
  const destinatarios = [
    recipients.almoxarifado,
    recipients.supervisor,
    recipients.coordenador
  ].filter(Boolean);

  const subject = `[Videplast Filial] Nova Solicitação de Ajuste Mín/Máx - SAP: ${solicitacao.itemCodigo} (${solicitacao.itemNome})`;

  const difMin = solicitacao.novoMin - solicitacao.minAtual;
  const difMax = solicitacao.novoMax - solicitacao.maxAtual;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { background-color: #ffffff; border-radius: 12px; max-width: 620px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background-color: #0A2540; padding: 24px 28px; color: #ffffff; }
    .header-tag { display: inline-block; background-color: #f59e0b; color: #78350f; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #94a3b8; }
    .content { padding: 28px; }
    .info-row { display: flex; margin-bottom: 12px; font-size: 13px; }
    .badge-user { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; margin-bottom: 20px; }
    .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .table-box th { background-color: #f8fafc; text-align: left; padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; }
    .table-box td { padding: 12px 14px; border: 1px solid #e2e8f0; }
    .highlight-min { color: #0284c7; font-weight: 800; }
    .highlight-max { color: #059669; font-weight: 800; }
    .quote-box { background-color: #f8fafc; border-left: 4px solid #0066cc; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; font-size: 13px; font-style: italic; color: #334155; }
    .alert-box { background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 8px; padding: 14px; color: #92400e; font-size: 12px; line-height: 1.5; margin-top: 20px; }
    .footer { background-color: #f8fafc; padding: 16px 28px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-tag">Análise Necessária • Filial</div>
      <h1>Nova Solicitação de Mín/Máx</h1>
      <p>Uma nova solicitação foi aberta e aguarda análise do Almoxarifado e Coordenação.</p>
    </div>
    
    <div class="content">
      <div class="badge-user">
        <table style="width:100%; font-size: 13px;">
          <tr>
            <td style="color:#64748b; width:110px;">Solicitante:</td>
            <td><strong>${solicitacao.solicitante || 'Supervisor'}</strong></td>
          </tr>
          <tr>
            <td style="color:#64748b;">Setor:</td>
            <td><strong>${solicitacao.setor || 'Produção'}</strong></td>
          </tr>
          <tr>
            <td style="color:#64748b;">Data da Criação:</td>
            <td>${new Date().toLocaleString('pt-BR')}</td>
          </tr>
        </table>
      </div>

      <h3 style="font-size: 15px; margin: 16px 0 8px 0; color: #0f172a;">Detalhes do Material (SAP)</h3>
      <p style="margin: 0 0 16px 0; font-size: 14px;">
        <strong>${solicitacao.itemCodigo}</strong> - ${solicitacao.itemNome}
      </p>

      <table class="table-box">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>Atual na Filial</th>
            <th>Novo Proposto</th>
            <th>Variação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Estoque Mínimo</strong></td>
            <td>${solicitacao.minAtual} ${solicitacao.itemUnidade}</td>
            <td class="highlight-min">${solicitacao.novoMin} ${solicitacao.itemUnidade}</td>
            <td>${difMin > 0 ? `+${difMin}` : difMin} ${solicitacao.itemUnidade}</td>
          </tr>
          <tr>
            <td><strong>Estoque Máximo</strong></td>
            <td>${solicitacao.maxAtual} ${solicitacao.itemUnidade}</td>
            <td class="highlight-max">${solicitacao.novoMax} ${solicitacao.itemUnidade}</td>
            <td>${difMax > 0 ? `+${difMax}` : difMax} ${solicitacao.itemUnidade}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 16px;">
        Justificativa da Supervisão:
      </div>
      <div class="quote-box">
        "${solicitacao.justificativa}"
      </div>

      <div class="alert-box">
        <strong>Fluxo da Filial:</strong> Esta solicitação deve ser analisada pelo Almoxarifado e Coordenador.
        Assim que aprovada no sistema da filial, este pedido será <strong>automaticamente reencaminhado por e-mail para o responsável na Matriz</strong> para a devida alteração nos parâmetros do SAP.
      </div>
    </div>

    <div class="footer">
      Videplast MRP • Sistema de Gestão de Mínimos e Máximos de Estoque
    </div>
  </div>
</body>
</html>
  `;

  const text = `
[Videplast Filial] Nova Solicitação de Ajuste Mín/Máx
Material: ${solicitacao.itemCodigo} - ${solicitacao.itemNome}
Solicitante: ${solicitacao.solicitante} (${solicitacao.setor})
Estoque Mínimo: Atual: ${solicitacao.minAtual} -> Proposto: ${solicitacao.novoMin} ${solicitacao.itemUnidade}
Estoque Máximo: Atual: ${solicitacao.maxAtual} -> Proposto: ${solicitacao.novoMax} ${solicitacao.itemUnidade}
Justificativa: "${solicitacao.justificativa}"

Favor analisar no sistema de MRP da Filial.
  `;

  return enviarEmailResiliente({
    to: destinatarios,
    subject,
    html,
    text
  });
}

/**
 * Disparado quando a filial (Almoxarifado / Coordenador) APROVA a solicitação.
 * Reencaminha com destaque para o RESPONSÁVEL DA MATRIZ realizar a alteração no SAP.
 */
export async function notificarAprovacaoParaMatriz({ solicitacao, respondidoPor }) {
  const { recipients } = getEmailConfig();
  const destinatarioMatriz = recipients.matriz;
  const copias = [
    recipients.coordenador,
    recipients.almoxarifado
  ].filter(Boolean);

  const subject = `[Videplast Filial] SOLICITAÇÃO APROVADA - Efetuar Alteração no SAP - Material ${solicitacao.itemCodigo} (${solicitacao.itemNome})`;

  const difMin = solicitacao.novoMin - solicitacao.minAtual;
  const difMax = solicitacao.novoMax - solicitacao.maxAtual;

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px; color: #1e293b; }
    .card { background-color: #ffffff; border-radius: 12px; max-width: 620px; margin: 0 auto; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
    .header { background-color: #064e3b; padding: 24px 28px; color: #ffffff; }
    .header-tag { display: inline-block; background-color: #10b981; color: #ffffff; font-weight: 800; font-size: 11px; padding: 4px 10px; border-radius: 20px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }
    .header h1 { margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; }
    .header p { margin: 6px 0 0 0; font-size: 13px; color: #a7f3d0; }
    .content { padding: 28px; }
    .badge-approval { background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 8px; padding: 14px 18px; margin-bottom: 20px; }
    .table-box { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 13px; }
    .table-box th { background-color: #f8fafc; text-align: left; padding: 10px 14px; border: 1px solid #e2e8f0; font-weight: 700; color: #475569; font-size: 11px; text-transform: uppercase; }
    .table-box td { padding: 12px 14px; border: 1px solid #e2e8f0; }
    .highlight-min { color: #0284c7; font-weight: 800; font-size: 15px; }
    .highlight-max { color: #059669; font-weight: 800; font-size: 15px; }
    .quote-box { background-color: #f8fafc; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 0 8px 8px 0; margin: 18px 0; font-size: 13px; font-style: italic; color: #334155; }
    .action-box { background-color: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px; padding: 16px; color: #1e3a8a; font-size: 13px; line-height: 1.5; margin-top: 24px; }
    .footer { background-color: #f8fafc; padding: 16px 28px; font-size: 11px; color: #64748b; text-align: center; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div class="header-tag">Ação Necessária na Matriz • SAP</div>
      <h1>Solicitação Aprovada pela Filial</h1>
      <p>A alteração foi revisada e aprovada localmente. Solicitamos a efetivação no SAP.</p>
    </div>
    
    <div class="content">
      <div class="badge-approval">
        <p style="margin: 0 0 8px 0; font-weight: 700; color: #065f46; font-size: 14px;">
          ✓ Aprovado pela Filial
        </p>
        <table style="width:100%; font-size: 12.5px; color: #1e293b;">
          <tr>
            <td style="color:#64748b; width:130px;">Aprovador Filial:</td>
            <td><strong>${respondidoPor || 'Almoxarifado / Coordenação'}</strong></td>
          </tr>
          <tr>
            <td style="color:#64748b;">Setor Solicitante:</td>
            <td><strong>${solicitacao.setor}</strong> (${solicitacao.solicitante})</td>
          </tr>
          <tr>
            <td style="color:#64748b;">Data da Aprovação:</td>
            <td>${new Date().toLocaleString('pt-BR')}</td>
          </tr>
        </table>
      </div>

      <p style="font-size: 13.5px; line-height: 1.6; color: #334155;">
        Olá! A solicitação de ajuste de estoque mínimo e máximo abaixo foi <strong>analisada e aprovada</strong> pela equipe da filial. Favor efetuar a atualização dos parâmetros diretamente no <strong>SAP</strong>:
      </p>

      <table class="table-box">
        <thead>
          <tr>
            <th>Parâmetro</th>
            <th>Mín/Máx Anterior</th>
            <th>NOVO VALOR PARA O SAP</th>
            <th>Variação</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Estoque Mínimo</strong></td>
            <td>${solicitacao.minAtual} ${solicitacao.itemUnidade}</td>
            <td class="highlight-min">${solicitacao.novoMin} ${solicitacao.itemUnidade}</td>
            <td>${difMin > 0 ? `+${difMin}` : difMin} ${solicitacao.itemUnidade}</td>
          </tr>
          <tr>
            <td><strong>Estoque Máximo</strong></td>
            <td>${solicitacao.maxAtual} ${solicitacao.itemUnidade}</td>
            <td class="highlight-max">${solicitacao.novoMax} ${solicitacao.itemUnidade}</td>
            <td>${difMax > 0 ? `+${difMax}` : difMax} ${solicitacao.itemUnidade}</td>
          </tr>
        </tbody>
      </table>

      <div style="font-size: 12px; font-weight: 700; color: #475569; text-transform: uppercase; margin-top: 16px;">
        Justificativa Registrada pela Filial:
      </div>
      <div class="quote-box">
        "${solicitacao.justificativa}"
      </div>

      <div class="action-box">
        <strong style="display: block; font-size: 14px; margin-bottom: 6px;">
          ⚙️ Instruções para o Responsável na Matriz:
        </strong>
        Por gentileza, acesse a transação de materiais correspondente no SAP e atualize o Ponto de Encomenda / Estoque Mínimo para <strong>${solicitacao.novoMin} ${solicitacao.itemUnidade}</strong> e Estoque Máximo para <strong>${solicitacao.novoMax} ${solicitacao.itemUnidade}</strong>.
      </div>
    </div>

    <div class="footer">
      Videplast Filial • Notificação Automática do Sistema de Gestão de Mínimos e Máximos
    </div>
  </div>
</body>
</html>
  `;

  const text = `
Prezado Cleidiomar,

A equipe de Almoxarifado e a Coordenação da Filial analisaram e aprovaram a solicitação de reajuste de parâmetros de estoque para o item abaixo.

Solicitamos a gentileza de realizar a devida alteração nos parâmetros do cadastro de material no SAP:

• Código SAP: ${solicitacao.itemCodigo}
• Descrição: ${solicitacao.itemNome}

ESTOQUE MÍNIMO:
NOVO VALOR A CADASTRAR: ${solicitacao.novoMin} ${solicitacao.itemUnidade || 'un'}

ESTOQUE MÁXIMO:
NOVO VALOR A CADASTRAR: ${solicitacao.novoMax} ${solicitacao.itemUnidade || 'un'}

Justificativa Operacional:
"${solicitacao.justificativa}"
  `;


  return enviarEmailResiliente({
    to: destinatarioMatriz,
    cc: copias,
    subject,
    html,
    text
  });
}
