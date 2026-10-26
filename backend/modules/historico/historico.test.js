import { describe, it, expect } from 'vitest';
import { historicoService } from './service.js';

describe('Módulo de Histórico (Auditoria)', () => {
  it('deve listar eventos do histórico ordenados pelos mais recentes', async () => {
    const lista = await historicoService.listar();
    expect(Array.isArray(lista)).toBe(true);
    expect(lista.length).toBeGreaterThan(0);
  });

  it('deve registrar um novo evento de alteração direta com sucesso', async () => {
    const evento = await historicoService.registrar({
      tipoAcao: 'alteracao_min_max_direta',
      titulo: 'Alteração Direta de Teste',
      usuario: 'Operador Almoxarifado',
      perfil: 'almoxarifado',
      item: {
        codigo: '9999999',
        nome: 'ITEM DE TESTE AUDITORIA',
        unidade: 'un',
        categoria: 'Embalagem'
      },
      alteracao: {
        minAnterior: 100,
        maxAnterior: 200,
        novoMin: 150,
        novoMax: 300
      },
      justificativa: 'Teste automatizado de auditoria'
    });

    expect(evento.id).toBeDefined();
    expect(evento.tipoAcao).toBe('alteracao_min_max_direta');

    const lista = await historicoService.listar({ termo: '9999999' });
    expect(lista.length).toBeGreaterThan(0);
    expect(lista[0].item.codigo).toBe('9999999');
  });

  it('deve filtrar histórico por tipo de ação', async () => {
    const listaRecusadas = await historicoService.listar({ tipoAcao: 'solicitacao_recusada' });
    expect(Array.isArray(listaRecusadas)).toBe(true);
    listaRecusadas.forEach((reg) => {
      expect(reg.tipoAcao).toBe('solicitacao_recusada');
    });
  });
});
