import 'dotenv/config';
import { notificarNovaSolicitacao, notificarAprovacaoParaMatriz } from '../modules/shared/email.service.js';
import { solicitacoesService } from '../modules/solicitacoes/index.js';
import { itensService } from '../modules/itens/index.js';

const solicitacoes = await solicitacoesService.listar();
if (!solicitacoes.length) {
  console.log('Nenhuma solicitação cadastrada para pré-visualização.');
  process.exit(0);
}

const solicitacao = solicitacoes[0];
const item = await itensService.obterDetalheItem(solicitacao.itemCodigo).catch(() => null);

await notificarNovaSolicitacao({ solicitacao, item });
await notificarAprovacaoParaMatriz({
  solicitacao,
  respondidoPor: solicitacao.respondidoPor || 'Almoxarifado Central / Coordenação'
});
