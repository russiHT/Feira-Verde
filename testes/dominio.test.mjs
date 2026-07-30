/**
 * Testes da camada de domínio (src/estado.js).
 *
 * Rodar com:  npm test
 *
 * Não há framework: são asserções em Node puro sobre as regras que realmente
 * importam num programa público — conservação de massa no estoque, ordem de
 * saída por validade, unidades de medida e atomicidade das trocas.
 */

import assert from 'node:assert/strict';
import test from 'node:test';

// A store usa localStorage no construtor. Em Node precisamos do stub ANTES
// do import do módulo — por isso o import é dinâmico, mais abaixo.
const memoria = new Map();
globalThis.localStorage = {
  getItem: (k) => (memoria.has(k) ? memoria.get(k) : null),
  setItem: (k, v) => memoria.set(k, v),
  removeItem: (k) => memoria.delete(k)
};

const {
  appState,
  estoqueCentralPorProduto,
  cargaPorProduto,
  creditoDeReciclaveis,
  totaisColetaPorUnidade,
  TIPO_MOVIMENTO
} = await import('../src/estado.js');

const banco = () => appState.banco;
const central = (idProduto) =>
  estoqueCentralPorProduto(banco()).find((e) => e.produto.id === idProduto);

/** Cada teste parte de um banco limpo. */
test.beforeEach(() => appState.resetar());

test('massa é conservada: entradas = estoque central + carga dos caminhões', () => {
  const entradas = banco().lotes.reduce((s, l) => s + l.qtdInicialKg, 0);
  const emEstoque = banco().lotes.reduce((s, l) => s + l.qtdDisponivelKg, 0);
  const emRota = banco().caminhoes.reduce(
    (s, c) => s + c.carga.reduce((x, i) => x + i.qtdKg, 0),
    0
  );

  assert.ok(Math.abs(entradas - (emEstoque + emRota)) < 0.001);
  assert.ok(emEstoque < entradas, 'carregar caminhão precisa debitar o almoxarifado');
});

test('saída segue a validade mais próxima (FEFO), não a ordem de cadastro', () => {
  const lotes = banco()
    .lotes.filter((l) => l.idProduto === 'tomate')
    .sort((a, b) => a.dataValidade.localeCompare(b.dataValidade));

  assert.equal(lotes.length, 2, 'o seed traz dois lotes de tomate justamente para este caso');
  assert.ok(lotes[0].qtdDisponivelKg < lotes[0].qtdInicialKg, 'lote que vence antes deve sair primeiro');
  assert.equal(lotes[1].qtdDisponivelKg, lotes[1].qtdInicialKg, 'lote mais novo permanece intacto');
});

test('crédito respeita a unidade de cada material', () => {
  // 4 kg de plástico = 1 kg de alimento; 2 L de óleo = 4 kg. Total: 5 kg.
  // Somar "4 + 2 = 6 unidades" seria mistura de grandezas.
  assert.equal(creditoDeReciclaveis(banco(), { plastico: 4, oleo: 2 }), 5);
  assert.equal(creditoDeReciclaveis(banco(), { pneu: 1 }), 3.03);
});

test('coleta é agregada por unidade, nunca num total único', () => {
  const totais = totaisColetaPorUnidade(banco());
  assert.ok(totais.kg > 0 && totais.L > 0 && totais.un > 0);
  assert.ok(Object.keys(totais).length >= 3, 'kg, L e un devem permanecer separados');
});

test('troca válida debita a carga, ajusta o saldo e deixa rastro do lote', () => {
  const cidadao = banco().cidadaos[0];
  const saldoAntes = cidadao.saldoAlimentoKg;
  const batataAntes = cargaPorProduto(banco(), 'CAM-01').batata;

  const r = appState.registrarTroca({
    cpfCidadao: cidadao.cpf,
    idCaminhao: 'CAM-01',
    reciclaveis: { plastico: 8 }, // 8 kg / 4 = 2 kg de crédito
    alimentosRetirados: { batata: 2 }
  });

  assert.ok(r.ok, r.erro);
  assert.ok(Math.abs(cidadao.saldoAlimentoKg - saldoAntes) < 0.001, 'crédito e gasto se anulam');
  assert.equal(cargaPorProduto(banco(), 'CAM-01').batata, batataAntes - 2);

  const movimentos = banco().movimentos.filter(
    (m) => m.tipo === TIPO_MOVIMENTO.TROCA && m.referencia === r.transacao.id
  );
  assert.ok(movimentos.length > 0, 'toda troca gera movimento vinculado ao lote');
  assert.ok(movimentos.every((m) => m.idLote));
});

test('troca é atômica: falha num produto não debita os anteriores', () => {
  const cidadao = banco().cidadaos[0];
  const antes = cargaPorProduto(banco(), 'CAM-01');
  const saldoAntes = cidadao.saldoAlimentoKg;
  const totalTransacoes = banco().transacoes.length;

  const r = appState.registrarTroca({
    cpfCidadao: cidadao.cpf,
    idCaminhao: 'CAM-01',
    reciclaveis: { plastico: 400 }, // crédito de sobra: 100 kg
    alimentosRetirados: { batata: 10, alface: 90 } // só há 80 kg de alface no caminhão
  });

  assert.equal(r.ok, false);
  assert.match(r.erro, /Alface/);
  assert.equal(cargaPorProduto(banco(), 'CAM-01').batata, antes.batata, 'batata revertida');
  assert.equal(cidadao.saldoAlimentoKg, saldoAntes);
  assert.equal(banco().transacoes.length, totalTransacoes);
});

test('retirada sem saldo suficiente é recusada', () => {
  const r = appState.registrarTroca({
    cpfCidadao: banco().cidadaos[1].cpf,
    idCaminhao: 'CAM-02',
    reciclaveis: {},
    alimentosRetirados: { batata: 500 }
  });
  assert.equal(r.ok, false);
});

test('entrada de produtor cria lote novo sem sobrescrever o histórico', () => {
  const lotesAntes = banco().lotes.length;
  const fornecedorAnterior = central('cenoura').loteProximaSaida.fornecedor;

  const r = appState.registrarEntrada({
    idProduto: 'cenoura',
    qtdKg: 300,
    fornecedor: 'Sítio Teste'
  });

  assert.ok(r.ok, r.erro);
  assert.equal(banco().lotes.length, lotesAntes + 1);
  assert.equal(
    central('cenoura').loteProximaSaida.fornecedor,
    fornecedorAnterior,
    'o lote antigo mantém seu fornecedor e sua validade'
  );
});

test('carregamento acima do estoque é recusado sem efeito colateral', () => {
  const disponivel = central('ovos').qtdKg;
  const r = appState.carregarCaminhao({
    idCaminhao: 'CAM-03',
    idProduto: 'ovos',
    qtdKg: disponivel + 100
  });

  assert.equal(r.ok, false);
  assert.equal(central('ovos').qtdKg, disponivel);
});

test('perda entra no ledger em vez de sumir do saldo', () => {
  const lote = banco().lotes.find((l) => l.qtdDisponivelKg > 10);
  const saldoAntes = lote.qtdDisponivelKg;

  const r = appState.registrarPerda({ idLote: lote.id, qtdKg: 10, motivo: 'Avaria' });

  assert.ok(r.ok, r.erro);
  assert.equal(lote.qtdDisponivelKg, saldoAntes - 10);
  assert.equal(banco().movimentos[0].tipo, TIPO_MOVIMENTO.PERDA);
  assert.equal(banco().movimentos[0].referencia, 'Avaria');
});

test('taxa de conversão zero é rejeitada (evitaria divisão por zero)', () => {
  assert.equal(appState.atualizarTaxaConversao('plastico', 0).ok, false);
  assert.equal(appState.atualizarTaxaConversao('plastico', 4.5).ok, true);
});

test('demanda atendida gera lote e fecha quando o total é alcançado', () => {
  const demanda = banco().demandasUrgentesProdutos.find((d) => d.status === 'ABERTO');
  const faltante = demanda.kgSolicitados - demanda.kgAtendidos;

  const r = appState.atenderDemanda({
    idDemanda: demanda.id,
    fornecedor: 'Cooperativa Teste',
    qtdKg: faltante
  });

  assert.ok(r.ok, r.erro);
  assert.equal(demanda.status, 'CONCLUIDO');
  assert.equal(r.lote.fornecedor, 'Cooperativa Teste');
});
