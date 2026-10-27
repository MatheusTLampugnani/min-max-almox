import 'dotenv/config';
import {
  notificarNovaSolicitacao,
  notificarAprovacaoParaMatriz,
  getEmailConfig
} from '../modules/shared/email.service.js';
import { solicitacoesService } from '../modules/solicitacoes/index.js';
import { itensService } from '../modules/itens/index.js';

async function rodarTesteEmail() {
  console.log('\n========================================================');
  console.log('   TESTE DE DISPARO DE E-MAIL - SISTEMA VIDEPLAST MRP   ');
  console.log('========================================================\n');

  const config = getEmailConfig();
  console.log('📋 Configurações Atuais Detectadas:');
  console.log(`- Host SMTP:       ${config.smtp.host || '(Não informado - ativará modo simulação)'}`);
  console.log(`- Porta SMTP:      ${config.smtp.port}`);
  console.log(`- Usuário SMTP:    ${config.smtp.auth.user ? config.smtp.auth.user : '(Não informado)'}`);
  console.log(`- Remetente:       ${config.from}`);
  console.log(`- Almoxarifado:    ${config.recipients.almoxarifado}`);
  console.log(`- Supervisor:      ${config.recipients.supervisor}`);
  console.log(`- Coordenador:     ${config.recipients.coordenador}`);
  console.log(`- Responsável Matriz: ${config.recipients.matriz}\n`);

  const solicitacoes = await solicitacoesService.listar();
  if (!solicitacoes.length) {
    console.log('ℹ️ Nenhuma solicitação cadastrada no momento para testar o envio de e-mail.');
    return;
  }

  const solicitacao = solicitacoes[0];
  const item = await itensService.obterDetalheItem(solicitacao.itemCodigo).catch(() => null);

  console.log('📨 1. Disparando notificação de solicitação...');
  const res1 = await notificarNovaSolicitacao({
    solicitacao,
    item
  });
  console.log('Resultado 1:', res1);

  console.log('\n📨 2. Disparando reencaminhamento para Responsável na Matriz...');
  const res2 = await notificarAprovacaoParaMatriz({
    solicitacao,
    respondidoPor: solicitacao.respondidoPor || 'Almoxarifado Central / Coordenação Filial'
  });
  console.log('Resultado 2:', res2);
}

rodarTesteEmail().catch((err) => {
  console.error('❌ Erro no teste de email:', err);
  process.exit(1);
});
