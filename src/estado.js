/**
 * FeiraVerde Digital — camada de domínio e persistência.
 *
 * Este módulo não importa React. A ponte com a UI está em `useAppState.js`.
 *
 * Princípios adotados nesta versão do modelo:
 *  1. LOTE é entidade de primeira classe. Estoque não é um número mutável:
 *     é a soma dos saldos dos lotes. Isso é o que torna o PEPS possível.
 *  2. UNIDADES são explícitas por material (kg, L, un). Nunca somamos
 *     litros de óleo com quilos de plástico num único total.
 *  3. Toda alteração de saldo gera um MOVIMENTO imutável. O saldo é
 *     consequência do histórico, não o contrário — é o que permite auditar
 *     um programa público.
 *  4. Nenhum componente altera `banco` diretamente. Só os métodos daqui.
 */

export const VERSAO_SCHEMA = 2;
const CHAVE_STORAGE = 'FEIRA_VERDE_DB';

// Um lote com validade nesta janela (ou menor) entra em prioridade de saída.
export const DIAS_ALERTA_VALIDADE = 4;

export const TIPO_MOVIMENTO = {
  ENTRADA: 'ENTRADA',           // produtor -> almoxarifado central
  CARREGAMENTO: 'CARREGAMENTO', // almoxarifado central -> caminhão
  TROCA: 'TROCA',               // caminhão -> munícipe
  RETORNO: 'RETORNO',           // caminhão -> almoxarifado central
  PERDA: 'PERDA'                // baixa por vencimento/avaria
};

// ---------------------------------------------------------------------------
// Utilitários numéricos e de data
// ---------------------------------------------------------------------------

/** Arredonda para 3 casas — evita o lixo de ponto flutuante em somas de peso. */
const arred = (v) => Math.round((parseFloat(v) || 0) * 1000) / 1000;

const hojeISO = () => new Date().toISOString().slice(0, 10);

const deslocarDias = (dias, base = new Date()) => {
  const d = new Date(base);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
};

/** Dias restantes até uma data ISO. Negativo = já vencido. */
export function diasAteVencer(dataISO) {
  if (!dataISO) return Infinity;
  const alvo = new Date(`${dataISO}T00:00:00`);
  const hoje = new Date(`${hojeISO()}T00:00:00`);
  return Math.round((alvo - hoje) / 86400000);
}

let sequencia = 0;
function gerarId(prefixo) {
  sequencia += 1;
  return `${prefixo}-${Date.now().toString(36)}${sequencia.toString(36)}`.toUpperCase();
}

const agoraLegivel = () =>
  new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

// ---------------------------------------------------------------------------
// Catálogos
// ---------------------------------------------------------------------------

/**
 * `qtdPorKgAlimento` = quanto da UNIDADE do material equivale a 1 kg de
 * alimento. Ex.: 4 kg de plástico = 1 kg de alimento; 1 pneu (un) = 3 kg.
 */
const MATERIAIS = [
  { id: 'plastico', nome: 'Plástico PET / Rígido', unidade: 'kg', qtdPorKgAlimento: 4.0, icone: 'fa-bottle-water' },
  { id: 'papelao', nome: 'Papel & Papelão', unidade: 'kg', qtdPorKgAlimento: 5.0, icone: 'fa-box-archive' },
  { id: 'vidro', nome: 'Vidro (Garrafas / Potes)', unidade: 'kg', qtdPorKgAlimento: 8.0, icone: 'fa-wine-bottle' },
  { id: 'metal', nome: 'Metal & Latinhas', unidade: 'kg', qtdPorKgAlimento: 3.0, icone: 'fa-can-food' },
  { id: 'oleo', nome: 'Óleo de Cozinha Usado', unidade: 'L', qtdPorKgAlimento: 0.5, icone: 'fa-oil-can' },
  { id: 'pneu', nome: 'Pneus Inservíveis', unidade: 'un', qtdPorKgAlimento: 0.33, icone: 'fa-car-side' }
];

const PRODUTOS = [
  { id: 'tomate', nome: 'Tomate Orgânico', categoria: 'Legumes', validadeDias: 5 },
  { id: 'batata', nome: 'Batata Inglesa', categoria: 'Tubérculos', validadeDias: 14 },
  { id: 'cenoura', nome: 'Cenoura Fresca', categoria: 'Legumes', validadeDias: 8 },
  { id: 'maca', nome: 'Maçã Gala', categoria: 'Frutas', validadeDias: 10 },
  { id: 'alface', nome: 'Alface Crespa (Maço)', categoria: 'Verduras', validadeDias: 3 },
  { id: 'ovos', nome: 'Ovos Caipira (Dúzia)', categoria: 'Proteínas', validadeDias: 12 }
];

// ---------------------------------------------------------------------------
// Operações puras sobre lotes (usadas tanto pelo seed quanto pela store)
// ---------------------------------------------------------------------------

/**
 * Ordem de saída: vence primeiro, sai primeiro (FEFO). É a leitura correta
 * de "PEPS antidesperdício" para perecíveis — ordenar por data de entrada
 * deixaria lote novo de alface na frente de lote velho de batata.
 */
function ordenarPorSaida(a, b) {
  return (
    a.dataValidade.localeCompare(b.dataValidade) ||
    a.dataLote.localeCompare(b.dataLote) ||
    a.id.localeCompare(b.id)
  );
}

function lotesDisponiveis(banco, idProduto) {
  return banco.lotes
    .filter((l) => l.idProduto === idProduto && l.qtdDisponivelKg > 0)
    .sort(ordenarPorSaida);
}

function saldoCentral(banco, idProduto) {
  return arred(
    banco.lotes
      .filter((l) => l.idProduto === idProduto)
      .reduce((s, l) => s + l.qtdDisponivelKg, 0)
  );
}

/** Retira `qtdKg` do almoxarifado seguindo FEFO. Não muta nada se faltar saldo. */
function baixarDoCentral(banco, idProduto, qtdKg) {
  const alvo = arred(qtdKg);
  if (alvo <= 0) return { ok: false, erro: 'Quantidade inválida.', consumos: [] };

  const disponivel = saldoCentral(banco, idProduto);
  if (disponivel < alvo) {
    return {
      ok: false,
      erro: `Estoque central insuficiente (disponível: ${disponivel} kg).`,
      consumos: []
    };
  }

  const consumos = [];
  let restante = alvo;
  for (const lote of lotesDisponiveis(banco, idProduto)) {
    if (restante <= 0) break;
    const usado = arred(Math.min(lote.qtdDisponivelKg, restante));
    lote.qtdDisponivelKg = arred(lote.qtdDisponivelKg - usado);
    restante = arred(restante - usado);
    consumos.push({ idLote: lote.id, qtdKg: usado });
  }
  return { ok: true, consumos };
}

/** Retira `qtdKg` da carga de um caminhão, também em FEFO. */
function baixarDaCarga(banco, caminhao, idProduto, qtdKg) {
  const alvo = arred(qtdKg);
  if (alvo <= 0) return { ok: false, erro: 'Quantidade inválida.', consumos: [] };

  const validadePorLote = Object.fromEntries(banco.lotes.map((l) => [l.id, l]));
  const itens = caminhao.carga
    .filter((c) => c.idProduto === idProduto && c.qtdKg > 0)
    .sort((a, b) => {
      const la = validadePorLote[a.idLote];
      const lb = validadePorLote[b.idLote];
      if (!la || !lb) return 0;
      return ordenarPorSaida(la, lb);
    });

  const disponivel = arred(itens.reduce((s, c) => s + c.qtdKg, 0));
  if (disponivel < alvo) {
    return {
      ok: false,
      erro: `Carga do caminhão insuficiente (disponível: ${disponivel} kg).`,
      consumos: []
    };
  }

  const consumos = [];
  let restante = alvo;
  for (const item of itens) {
    if (restante <= 0) break;
    const usado = arred(Math.min(item.qtdKg, restante));
    item.qtdKg = arred(item.qtdKg - usado);
    restante = arred(restante - usado);
    consumos.push({ idLote: item.idLote, qtdKg: usado });
  }
  caminhao.carga = caminhao.carga.filter((c) => c.qtdKg > 0);
  return { ok: true, consumos };
}

function adicionarNaCarga(caminhao, idProduto, consumos) {
  consumos.forEach(({ idLote, qtdKg }) => {
    const existente = caminhao.carga.find((c) => c.idLote === idLote);
    if (existente) existente.qtdKg = arred(existente.qtdKg + qtdKg);
    else caminhao.carga.push({ idLote, idProduto, qtdKg: arred(qtdKg) });
  });
}

// ---------------------------------------------------------------------------
// Seed
// ---------------------------------------------------------------------------

function criarBancoInicial() {
  const banco = {
    versaoSchema: VERSAO_SCHEMA,
    materiais: JSON.parse(JSON.stringify(MATERIAIS)),
    produtos: JSON.parse(JSON.stringify(PRODUTOS)),
    lotes: [],
    movimentos: [],
    caminhoes: [],
    cidadaos: [],
    alertasUrgentes: [],
    demandasUrgentesProdutos: [],
    transacoes: []
  };

  // Lotes iniciais — datas relativas a hoje para que a demonstração continue
  // fazendo sentido em qualquer dia em que o sistema for aberto.
  const semente = [
    { idProduto: 'tomate', qtdKg: 1200, precoPorKg: 4.5, entradaHa: 4, fornecedor: 'Cooperativa FrutaSul' },
    { idProduto: 'batata', qtdKg: 2500, precoPorKg: 3.2, entradaHa: 6, fornecedor: 'Sítio Sol Nascente' },
    { idProduto: 'cenoura', qtdKg: 1800, precoPorKg: 3.8, entradaHa: 5, fornecedor: 'Horta Comunitária Verde' },
    { idProduto: 'maca', qtdKg: 1500, precoPorKg: 5.0, entradaHa: 8, fornecedor: 'Pomar Campos Gerais' },
    { idProduto: 'alface', qtdKg: 800, precoPorKg: 2.5, entradaHa: 1, fornecedor: 'Produtor João da Vila' },
    { idProduto: 'ovos', qtdKg: 600, precoPorKg: 9.0, entradaHa: 4, fornecedor: 'Granja Esperança' },
    // Segundo lote de tomate, mais novo: serve para demonstrar o FEFO em ação.
    { idProduto: 'tomate', qtdKg: 400, precoPorKg: 4.7, entradaHa: 0, fornecedor: 'Sítio Boa Vista' }
  ];

  semente.forEach((s) => {
    const produto = PRODUTOS.find((p) => p.id === s.idProduto);
    const dataLote = deslocarDias(-s.entradaHa);
    banco.lotes.push({
      id: gerarId('LT'),
      idProduto: s.idProduto,
      qtdInicialKg: s.qtdKg,
      qtdDisponivelKg: s.qtdKg,
      precoPorKg: s.precoPorKg,
      fornecedor: s.fornecedor,
      dataLote,
      dataValidade: deslocarDias(produto.validadeDias, new Date(`${dataLote}T00:00:00`))
    });
  });

  banco.caminhoes = [
    {
      id: 'CAM-01', motorista: 'Carlos Eduardo', bairro: 'Cará-Cará (Vila Maria)',
      localizacao: 'Rua das Palmeiras, nº 140 (Em frente à Escola)',
      status: 'EM_ANDAMENTO', horarioAgendado: '14:00 - 17:00',
      coletaPorMaterial: { plastico: 180, papelao: 140, vidro: 60, metal: 34, oleo: 22, pneu: 6 },
      carga: []
    },
    {
      id: 'CAM-02', motorista: 'Marcos Vinícius', bairro: 'Uvaranas (Vila Mariana)',
      localizacao: 'Praça da Igreja Matriz de Uvaranas',
      status: 'EM_ANDAMENTO', horarioAgendado: '14:30 - 17:30',
      coletaPorMaterial: { plastico: 120, papelao: 95, vidro: 70, metal: 25, oleo: 15, pneu: 3 },
      carga: []
    },
    {
      id: 'CAM-03', motorista: 'Roberto Alves', bairro: 'Nova Rússia (Sabará)',
      localizacao: 'Av. Dom Pedro II (Próximo à Unidade de Saúde)',
      status: 'AGENDADO', horarioAgendado: '08:30 - 11:30 (Amanhã)',
      coletaPorMaterial: {},
      carga: []
    },
    {
      id: 'CAM-04', motorista: 'Fernando Lima', bairro: 'Oficinas (Vila Cipa)',
      localizacao: 'Rua Aldo Vergani (Centro Comunitário)',
      status: 'ATRASADO_CHUVA', horarioAgendado: '15:00 - 18:00',
      coletaPorMaterial: { plastico: 48, papelao: 40, vidro: 18, metal: 9 },
      carga: []
    }
  ];

  // Carga inicial dos caminhões: passa pelo mesmo caminho de qualquer
  // carregamento real, então já debita o almoxarifado e gera movimentos.
  const cargasIniciais = {
    'CAM-01': { tomate: 120, batata: 200, cenoura: 150, maca: 100, alface: 80, ovos: 40 },
    'CAM-02': { tomate: 90, batata: 150, cenoura: 110, maca: 80, alface: 50, ovos: 30 },
    'CAM-03': { tomate: 150, batata: 250, cenoura: 180, maca: 120, alface: 100, ovos: 50 },
    'CAM-04': { tomate: 80, batata: 120, cenoura: 90, maca: 60, alface: 40, ovos: 20 }
  };

  Object.entries(cargasIniciais).forEach(([idCaminhao, itens]) => {
    const caminhao = banco.caminhoes.find((c) => c.id === idCaminhao);
    Object.entries(itens).forEach(([idProduto, qtdKg]) => {
      const r = baixarDoCentral(banco, idProduto, qtdKg);
      if (!r.ok) return;
      adicionarNaCarga(caminhao, idProduto, r.consumos);
      r.consumos.forEach((c) => {
        banco.movimentos.push({
          id: gerarId('MOV'),
          dataHora: agoraLegivel(),
          tipo: TIPO_MOVIMENTO.CARREGAMENTO,
          idLote: c.idLote,
          idProduto,
          qtdKg: c.qtdKg,
          origem: 'ALMOXARIFADO',
          destino: idCaminhao,
          referencia: 'Carga inicial do dia'
        });
      });
    });
  });

  banco.cidadaos = [
    {
      cpf: '123.456.789-00', nome: 'Maria Aparecida da Silva', bairro: 'Cará-Cará',
      autenticadoGov: true, saldoAlimentoKg: 18.5, idQrCode: 'FV-CIT-12345',
      totalEntreguePorMaterial: { plastico: 40, papelao: 30, oleo: 8, vidro: 12 }
    },
    {
      cpf: '987.654.321-11', nome: 'José Benedito de Oliveira', bairro: 'Uvaranas',
      autenticadoGov: true, saldoAlimentoKg: 9.0, idQrCode: 'FV-CIT-98765',
      totalEntreguePorMaterial: { vidro: 28, metal: 14 }
    },
    {
      cpf: '456.789.123-22', nome: 'Ana Paula Souza Santos', bairro: 'Nova Rússia',
      autenticadoGov: true, saldoAlimentoKg: 31.0, idQrCode: 'FV-CIT-45678',
      totalEntreguePorMaterial: { plastico: 62, papelao: 55, metal: 18, pneu: 4 }
    }
  ];

  banco.alertasUrgentes = [
    {
      id: gerarId('ALT'),
      titulo: 'Alerta de Chuva Forte - Rota Oficinas (CAM-04)',
      bairro: 'Oficinas (Vila Cipa)',
      mensagem: 'Atenção moradores! O caminhão 04 teve o atendimento pausado temporariamente devido ao temporal. Retomada prevista para as 16:30.',
      dataHora: agoraLegivel(),
      tipo: 'warning'
    }
  ];

  banco.demandasUrgentesProdutos = [
    {
      id: gerarId('DEM'), idProduto: 'tomate', nomeProduto: 'Tomate Orgânico',
      kgSolicitados: 500, kgAtendidos: 180, status: 'ABERTO',
      prazo: 'Hoje até as 17:00',
      motivo: 'Alto consumo nas rotas Cará-Cará e Uvaranas. Estoque central baixo!'
    },
    {
      id: gerarId('DEM'), idProduto: 'alface', nomeProduto: 'Alface Crespa (Maço)',
      kgSolicitados: 300, kgAtendidos: 300, status: 'CONCLUIDO',
      prazo: 'Concluído', motivo: 'Abastecimento para rotas da tarde.'
    }
  ];

  // Transações históricas: representam trocas já ocorridas — os saldos acima
  // já refletem o efeito delas, por isso não são reprocessadas aqui.
  banco.transacoes = [
    {
      id: 'TRX-8901', dataHora: `${deslocarDias(-1)} 14:15`,
      cpfCidadao: '123.456.789-00', nomeCidadao: 'Maria Aparecida da Silva',
      bairro: 'Cará-Cará', idCaminhao: 'CAM-01',
      reciclaveis: { plastico: 12.0, papelao: 10.0, oleo: 2.0 },
      kgAlimentoGerado: 9.0,
      alimentosRetirados: { tomate: 2.0, batata: 4.0, ovos: 1.0 },
      kgAlimentoGasto: 7.0
    },
    {
      id: 'TRX-8902', dataHora: `${deslocarDias(-1)} 14:22`,
      cpfCidadao: '987.654.321-11', nomeCidadao: 'José Benedito de Oliveira',
      bairro: 'Uvaranas', idCaminhao: 'CAM-02',
      reciclaveis: { vidro: 16.0, metal: 6.0 },
      kgAlimentoGerado: 4.0,
      alimentosRetirados: { cenoura: 2.0, maca: 2.0 },
      kgAlimentoGasto: 4.0
    }
  ];

  return banco;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

class EstadoApp {
  constructor() {
    this.banco = this.carregar();
    this.ouvintes = [];
  }

  carregar() {
    try {
      const bruto = localStorage.getItem(CHAVE_STORAGE);
      if (bruto) {
        const dados = JSON.parse(bruto);
        // Sem migração automática: schema antigo é descartado em vez de
        // produzir estado meio-convertido e silenciosamente errado.
        if (dados && dados.versaoSchema === VERSAO_SCHEMA) return dados;
      }
    } catch {
      /* dado corrompido — recomeça do seed */
    }
    const novo = criarBancoInicial();
    this.persistir(novo);
    return novo;
  }

  persistir(banco = this.banco) {
    try {
      localStorage.setItem(CHAVE_STORAGE, JSON.stringify(banco));
    } catch {
      /* quota excedida ou modo privativo — segue em memória */
    }
  }

  salvar() {
    this.persistir();
    this.notificar();
  }

  inscrever(ouvinte) {
    this.ouvintes.push(ouvinte);
    return () => {
      this.ouvintes = this.ouvintes.filter((fn) => fn !== ouvinte);
    };
  }

  notificar() {
    this.ouvintes.forEach((fn) => fn(this.banco));
  }

  resetar() {
    this.banco = criarBancoInicial();
    this.salvar();
  }

  // --- consultas ---

  obterCidadao(cpf) {
    return this.banco.cidadaos.find((c) => c.cpf === cpf) || null;
  }

  obterCaminhao(id) {
    return this.banco.caminhoes.find((t) => t.id === id) || null;
  }

  obterProduto(id) {
    return this.banco.produtos.find((p) => p.id === id) || null;
  }

  // --- movimentações ---

  registrarMovimento(dados) {
    this.banco.movimentos.unshift({
      id: gerarId('MOV'),
      dataHora: agoraLegivel(),
      ...dados
    });
  }

  /** Entrada de mercadoria: cria um lote novo, nunca sobrescreve um existente. */
  registrarEntrada({ idProduto, qtdKg, fornecedor, dataLote, precoPorKg = 0, referencia = '' }) {
    const produto = this.obterProduto(idProduto);
    const qtd = arred(qtdKg);
    if (!produto) return { ok: false, erro: 'Produto não cadastrado.' };
    if (qtd <= 0) return { ok: false, erro: 'Informe uma quantidade maior que zero.' };

    const entrada = dataLote || hojeISO();
    const lote = {
      id: gerarId('LT'),
      idProduto,
      qtdInicialKg: qtd,
      qtdDisponivelKg: qtd,
      precoPorKg: parseFloat(precoPorKg) || 0,
      fornecedor: fornecedor || 'Não informado',
      dataLote: entrada,
      dataValidade: deslocarDias(produto.validadeDias, new Date(`${entrada}T00:00:00`))
    };
    this.banco.lotes.push(lote);

    this.registrarMovimento({
      tipo: TIPO_MOVIMENTO.ENTRADA,
      idLote: lote.id,
      idProduto,
      qtdKg: qtd,
      origem: fornecedor || 'PRODUTOR',
      destino: 'ALMOXARIFADO',
      referencia
    });

    this.salvar();
    return { ok: true, lote };
  }

  /** Almoxarifado -> caminhão, consumindo lotes em FEFO. */
  carregarCaminhao({ idCaminhao, idProduto, qtdKg }) {
    const caminhao = this.obterCaminhao(idCaminhao);
    if (!caminhao) return { ok: false, erro: 'Caminhão não encontrado.' };

    const r = baixarDoCentral(this.banco, idProduto, qtdKg);
    if (!r.ok) return r;

    adicionarNaCarga(caminhao, idProduto, r.consumos);
    r.consumos.forEach((c) =>
      this.registrarMovimento({
        tipo: TIPO_MOVIMENTO.CARREGAMENTO,
        idLote: c.idLote,
        idProduto,
        qtdKg: c.qtdKg,
        origem: 'ALMOXARIFADO',
        destino: idCaminhao
      })
    );

    this.salvar();
    return { ok: true, consumos: r.consumos };
  }

  /**
   * Troca completa: valida saldo do munícipe e carga do caminhão antes de
   * escrever qualquer coisa. Ou tudo acontece, ou nada acontece.
   */
  registrarTroca({ cpfCidadao, idCaminhao, reciclaveis, alimentosRetirados }) {
    const cidadao = this.obterCidadao(cpfCidadao);
    const caminhao = this.obterCaminhao(idCaminhao);
    if (!cidadao) return { ok: false, erro: 'Munícipe não encontrado.' };
    if (!caminhao) return { ok: false, erro: 'Caminhão não encontrado.' };

    const entradas = Object.fromEntries(
      Object.entries(reciclaveis || {}).filter(([, v]) => arred(v) > 0).map(([k, v]) => [k, arred(v)])
    );
    const saidas = Object.fromEntries(
      Object.entries(alimentosRetirados || {}).filter(([, v]) => arred(v) > 0).map(([k, v]) => [k, arred(v)])
    );

    if (!Object.keys(entradas).length && !Object.keys(saidas).length) {
      return { ok: false, erro: 'Registre ao menos um reciclável ou uma retirada.' };
    }

    const kgAlimentoGerado = creditoDeReciclaveis(this.banco, entradas);
    const kgAlimentoGasto = arred(Object.values(saidas).reduce((s, v) => s + v, 0));
    const saldoFinal = arred(cidadao.saldoAlimentoKg + kgAlimentoGerado - kgAlimentoGasto);

    if (saldoFinal < 0) {
      return { ok: false, erro: 'Saldo insuficiente para a retirada solicitada.' };
    }

    // Simula a transação antes de aplicar: valida a carga inteira primeiro.
    const copiaCarga = JSON.parse(JSON.stringify(caminhao.carga));
    const baixas = [];
    for (const [idProduto, qtd] of Object.entries(saidas)) {
      const r = baixarDaCarga(this.banco, caminhao, idProduto, qtd);
      if (!r.ok) {
        caminhao.carga = copiaCarga; // rollback
        const nome = this.obterProduto(idProduto)?.nome || idProduto;
        return { ok: false, erro: `${nome}: ${r.erro}` };
      }
      baixas.push({ idProduto, consumos: r.consumos });
    }

    const tx = {
      id: gerarId('TRX'),
      dataHora: agoraLegivel(),
      cpfCidadao: cidadao.cpf,
      nomeCidadao: cidadao.nome,
      bairro: cidadao.bairro,
      idCaminhao: caminhao.id,
      reciclaveis: entradas,
      kgAlimentoGerado,
      alimentosRetirados: saidas,
      kgAlimentoGasto
    };

    this.banco.transacoes.unshift(tx);
    cidadao.saldoAlimentoKg = saldoFinal;

    Object.entries(entradas).forEach(([idMaterial, qtd]) => {
      cidadao.totalEntreguePorMaterial[idMaterial] =
        arred((cidadao.totalEntreguePorMaterial[idMaterial] || 0) + qtd);
      caminhao.coletaPorMaterial[idMaterial] =
        arred((caminhao.coletaPorMaterial[idMaterial] || 0) + qtd);
    });

    baixas.forEach(({ idProduto, consumos }) =>
      consumos.forEach((c) =>
        this.registrarMovimento({
          tipo: TIPO_MOVIMENTO.TROCA,
          idLote: c.idLote,
          idProduto,
          qtdKg: c.qtdKg,
          origem: caminhao.id,
          destino: `MUNICIPE ${cidadao.idQrCode}`,
          referencia: tx.id
        })
      )
    );

    this.salvar();
    return { ok: true, transacao: tx };
  }

  /** Baixa de lote por vencimento ou avaria — perda tem que ser visível. */
  registrarPerda({ idLote, qtdKg, motivo }) {
    const lote = this.banco.lotes.find((l) => l.id === idLote);
    const qtd = arred(qtdKg);
    if (!lote) return { ok: false, erro: 'Lote não encontrado.' };
    if (qtd <= 0 || qtd > lote.qtdDisponivelKg) {
      return { ok: false, erro: `Quantidade inválida (disponível: ${lote.qtdDisponivelKg} kg).` };
    }

    lote.qtdDisponivelKg = arred(lote.qtdDisponivelKg - qtd);
    this.registrarMovimento({
      tipo: TIPO_MOVIMENTO.PERDA,
      idLote,
      idProduto: lote.idProduto,
      qtdKg: qtd,
      origem: 'ALMOXARIFADO',
      destino: 'BAIXA',
      referencia: motivo || 'Não informado'
    });

    this.salvar();
    return { ok: true };
  }

  // --- rotas, alertas e demandas ---

  atualizarStatusRota(idCaminhao, novoStatus) {
    const caminhao = this.obterCaminhao(idCaminhao);
    if (!caminhao) return { ok: false, erro: 'Caminhão não encontrado.' };
    caminhao.status = novoStatus;
    this.salvar();
    return { ok: true };
  }

  dispararAlerta({ bairro, titulo, mensagem, tipo = 'warning' }) {
    const alerta = { id: gerarId('ALT'), titulo, bairro, mensagem, dataHora: agoraLegivel(), tipo };
    this.banco.alertasUrgentes.unshift(alerta);
    this.salvar();
    return { ok: true, alerta };
  }

  adicionarDemandaUrgente({ idProduto, kgSolicitados, motivo, prazo = 'Hoje até as 17:30' }) {
    const produto = this.obterProduto(idProduto);
    const qtd = arred(kgSolicitados);
    if (!produto) return { ok: false, erro: 'Produto não cadastrado.' };
    if (qtd <= 0) return { ok: false, erro: 'Informe uma quantidade maior que zero.' };

    const demanda = {
      id: gerarId('DEM'),
      idProduto,
      nomeProduto: produto.nome,
      kgSolicitados: qtd,
      kgAtendidos: 0,
      status: 'ABERTO',
      prazo,
      motivo
    };
    this.banco.demandasUrgentesProdutos.unshift(demanda);
    this.salvar();
    return { ok: true, demanda };
  }

  /** Produtor atende uma demanda: gera lote novo e avança o progresso. */
  atenderDemanda({ idDemanda, fornecedor, qtdKg }) {
    const demanda = this.banco.demandasUrgentesProdutos.find((d) => d.id === idDemanda);
    if (!demanda) return { ok: false, erro: 'Demanda não encontrada.' };

    const r = this.registrarEntrada({
      idProduto: demanda.idProduto,
      qtdKg,
      fornecedor,
      dataLote: hojeISO(),
      referencia: `Atendimento da demanda ${demanda.id}`
    });
    if (!r.ok) return r;

    demanda.kgAtendidos = arred(demanda.kgAtendidos + arred(qtdKg));
    if (demanda.kgAtendidos >= demanda.kgSolicitados) {
      demanda.status = 'CONCLUIDO';
      demanda.prazo = 'Concluído';
    }

    this.salvar();
    return { ok: true, lote: r.lote };
  }

  atualizarTaxaConversao(idMaterial, novaQtdPorKg) {
    const material = this.banco.materiais.find((m) => m.id === idMaterial);
    const valor = parseFloat(novaQtdPorKg);
    if (!material) return { ok: false, erro: 'Material não encontrado.' };
    if (!(valor > 0)) return { ok: false, erro: 'A taxa precisa ser maior que zero.' };
    material.qtdPorKgAlimento = valor;
    this.salvar();
    return { ok: true };
  }
}

// ---------------------------------------------------------------------------
// Seletores derivados (usados pelos componentes — nunca mutam o banco)
// ---------------------------------------------------------------------------

/** Converte um mapa {idMaterial: qtd na unidade do material} em kg de alimento. */
export function creditoDeReciclaveis(banco, quantidades) {
  let total = 0;
  Object.entries(quantidades || {}).forEach(([idMaterial, qtd]) => {
    const material = banco.materiais.find((m) => m.id === idMaterial);
    const valor = parseFloat(qtd) || 0;
    if (material && material.qtdPorKgAlimento > 0 && valor > 0) {
      total += valor / material.qtdPorKgAlimento;
    }
  });
  return arred(total);
}

/** Estoque central consolidado por produto, com o lote que sai primeiro. */
export function estoqueCentralPorProduto(banco) {
  return banco.produtos.map((produto) => {
    const lotes = banco.lotes
      .filter((l) => l.idProduto === produto.id && l.qtdDisponivelKg > 0)
      .sort(ordenarPorSaida);
    const qtdKg = arred(lotes.reduce((s, l) => s + l.qtdDisponivelKg, 0));
    const proximo = lotes[0] || null;
    const diasParaVencer = proximo ? diasAteVencer(proximo.dataValidade) : null;
    return {
      produto,
      qtdKg,
      lotes,
      qtdLotes: lotes.length,
      loteProximaSaida: proximo,
      diasParaVencer,
      critico: diasParaVencer !== null && diasParaVencer <= DIAS_ALERTA_VALIDADE
    };
  });
}

/** Carga de um caminhão consolidada por produto: {idProduto: qtdKg}. */
export function cargaPorProduto(banco, idCaminhao) {
  const caminhao = banco.caminhoes.find((c) => c.id === idCaminhao);
  const mapa = {};
  if (!caminhao) return mapa;
  caminhao.carga.forEach((item) => {
    mapa[item.idProduto] = arred((mapa[item.idProduto] || 0) + item.qtdKg);
  });
  return mapa;
}

/**
 * Totais de coleta agrupados POR UNIDADE. Devolve {kg, L, un} — somar tudo
 * num número só seria mistura de grandezas.
 */
export function totaisColetaPorUnidade(banco) {
  const totais = {};
  banco.caminhoes.forEach((caminhao) => {
    Object.entries(caminhao.coletaPorMaterial || {}).forEach(([idMaterial, qtd]) => {
      const material = banco.materiais.find((m) => m.id === idMaterial);
      if (!material) return;
      totais[material.unidade] = arred((totais[material.unidade] || 0) + qtd);
    });
  });
  return totais;
}

export function totalAlimentoEntregueKg(banco) {
  return arred(banco.transacoes.reduce((s, t) => s + (t.kgAlimentoGasto || 0), 0));
}

export function totalPerdasKg(banco) {
  return arred(
    banco.movimentos
      .filter((m) => m.tipo === TIPO_MOVIMENTO.PERDA)
      .reduce((s, m) => s + m.qtdKg, 0)
  );
}

export const appState = new EstadoApp();
