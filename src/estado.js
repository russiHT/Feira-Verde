/* FeiraVerde Digital - Gerenciamento de Estado & Dados Iniciais em React */
import { useState, useEffect } from 'react';

const bancoInicial = {
  // Taxas de Conversão (Razão Direta: Recicláveis -> Kg de Alimento)
  taxasConversao: [
    { id: 'plastico', nome: 'Plástico PET / Rígido', kgPorKgAlimento: 4.0, icone: 'fa-bottle-water', unidade: 'kg' },
    { id: 'papelao', nome: 'Papel & Papelão', kgPorKgAlimento: 5.0, icone: 'fa-box-archive', unidade: 'kg' },
    { id: 'vidro', nome: 'Vidro (Garrafas / Potes)', kgPorKgAlimento: 8.0, icone: 'fa-wine-bottle', unidade: 'kg' },
    { id: 'metal', nome: 'Metal & Latinhas', kgPorKgAlimento: 3.0, icone: 'fa-can-food', unidade: 'kg' },
    { id: 'oleo', nome: 'Óleo de Cozinha Usado', kgPorKgAlimento: 0.5, icone: 'fa-oil-can', unidade: 'L' },
    { id: 'pneu', nome: 'Pneus Inservíveis', kgPorKgAlimento: 0.33, icone: 'fa-car-side', unidade: 'un' }
  ],

  // Estoque Central & Alocações nos Caminhões (PEPS)
  estoqueCentral: [
    { id: 'tomate', nome: 'Tomate Orgânico', categoria: 'Legumes', qtdKg: 1200, precoPorKg: 4.50, dataLote: '2026-07-26', diasVencimento: 5, fornecedor: 'Cooperativa FrutaSul' },
    { id: 'batata', nome: 'Batata Inglesa', categoria: 'Tubérculos', qtdKg: 2500, precoPorKg: 3.20, dataLote: '2026-07-24', diasVencimento: 14, fornecedor: 'Sítio Sol Nascente' },
    { id: 'cenoura', nome: 'Cenoura Fresca', categoria: 'Legumes', qtdKg: 1800, precoPorKg: 3.80, dataLote: '2026-07-25', diasVencimento: 8, fornecedor: 'Horta Comunitária Verde' },
    { id: 'maca', nome: 'Maçã Gala', categoria: 'Frutas', qtdKg: 1500, precoPorKg: 5.00, dataLote: '2026-07-22', diasVencimento: 10, fornecedor: 'Pomar Campos Gerais' },
    { id: 'alface', nome: 'Alface Crespa (Maço)', categoria: 'Verduras', qtdKg: 800, precoPorKg: 2.50, dataLote: '2026-07-27', diasVencimento: 3, fornecedor: 'Produtor João da Vila' },
    { id: 'ovos', nome: 'Ovos Caipira (Dúzia)', categoria: 'Proteínas', qtdKg: 600, precoPorKg: 9.00, dataLote: '2026-07-26', diasVencimento: 12, fornecedor: 'Granja Esperança' }
  ],

  // Caminhões Ativos & Rotas
  caminhoes: [
    {
      id: 'CAM-01',
      motorista: 'Carlos Eduardo',
      bairro: 'Cará-Cará (Vila Maria)',
      localizacao: 'Rua das Palmeiras, nº 140 (Em frente à Escola)',
      status: 'EM_ANDAMENTO',
      horarioAgendado: '14:00 - 17:00',
      reciclaveisColetadosKg: 420.5,
      estoqueAlimentosKg: { tomate: 120, batata: 200, cenoura: 150, maca: 100, alface: 80, ovos: 40 }
    },
    {
      id: 'CAM-02',
      motorista: 'Marcos Vinícius',
      bairro: 'Uvaranas (Vila Mariana)',
      localizacao: 'Praça da Igreja Matriz de Uvaranas',
      status: 'EM_ANDAMENTO',
      horarioAgendado: '14:30 - 17:30',
      reciclaveisColetadosKg: 310.0,
      estoqueAlimentosKg: { tomate: 90, batata: 150, cenoura: 110, maca: 80, alface: 50, ovos: 30 }
    },
    {
      id: 'CAM-03',
      motorista: 'Roberto Alves',
      bairro: 'Nova Rússia (Sabará)',
      localizacao: 'Av. Dom Pedro II (Próximo à Unidade de Saúde)',
      status: 'AGENDADO',
      horarioAgendado: '08:30 - 11:30 (Amanhã)',
      reciclaveisColetadosKg: 0.0,
      estoqueAlimentosKg: { tomate: 150, batata: 250, cenoura: 180, maca: 120, alface: 100, ovos: 50 }
    },
    {
      id: 'CAM-04',
      motorista: 'Fernando Lima',
      bairro: 'Oficinas (Vila Cipa)',
      localizacao: 'Rua Aldo Vergani (Centro Comunitário)',
      status: 'ATRASADO_CHUVA',
      horarioAgendado: '15:00 - 18:00',
      reciclaveisColetadosKg: 115.0,
      estoqueAlimentosKg: { tomate: 80, batata: 120, cenoura: 90, maca: 60, alface: 40, ovos: 20 }
    }
  ],

  // Munícipes Cadastrados (Integrado Gov.br)
  cidadaos: [
    {
      cpf: '123.456.789-00',
      nome: 'Maria Aparecida da Silva',
      bairro: 'Cará-Cará',
      autenticadoGov: true,
      saldoAlimentoKg: 18.5,
      totalRecicladoKg: 85.0,
      idQrCode: 'FV-CIT-12345'
    },
    {
      cpf: '987.654.321-11',
      nome: 'José Benedito de Oliveira',
      bairro: 'Uvaranas',
      autenticadoGov: true,
      saldoAlimentoKg: 9.0,
      totalRecicladoKg: 42.0,
      idQrCode: 'FV-CIT-98765'
    },
    {
      cpf: '456.789.123-22',
      nome: 'Ana Paula Souza Santos',
      bairro: 'Nova Rússia',
      autenticadoGov: true,
      saldoAlimentoKg: 31.0,
      totalRecicladoKg: 140.0,
      idQrCode: 'FV-CIT-45678'
    }
  ],

  // Notificações de Urgência
  alertasUrgentes: [
    {
      id: 1,
      titulo: 'Alerta de Chuva Forte - Rota Oficinas (CAM-04)',
      bairro: 'Oficinas (Vila Cipa)',
      mensagem: 'Atenção moradores! O caminhão 04 teve o atendimento pausado temporariamente devido ao temporal. Retomada prevista para as 16:30.',
      dataHora: '2026-07-28 14:10',
      tipo: 'warning'
    }
  ],

  // Demandas Urgentes de Suprimento de Hortifrúti
  demandasUrgentesProdutos: [
    {
      id: 101,
      idAlimento: 'tomate',
      nomeAlimento: 'Tomate Orgânico',
      kgSolicitados: 500,
      kgAtendidos: 180,
      status: 'ABERTO',
      prazo: 'Hoje até as 17:00',
      motivo: 'Alto consumo nas rotas Cará-Cará e Uvaranas. Estoque central baixo!'
    },
    {
      id: 102,
      idAlimento: 'alface',
      nomeAlimento: 'Alface Crespa (Maço)',
      kgSolicitados: 300,
      kgAtendidos: 300,
      status: 'CONCLUIDO',
      prazo: 'Concluído',
      motivo: 'Abastecimento para rotas da tarde.'
    }
  ],

  // Histórico de Transações de Troca
  transacoes: [
    {
      id: 'TRX-8901',
      dataHora: '2026-07-28 14:15',
      cpfCidadao: '123.456.789-00',
      nomeCidadao: 'Maria Aparecida da Silva',
      bairro: 'Cará-Cará',
      idCaminhao: 'CAM-01',
      reciclaveis: { plastico: 12.0, papelao: 10.0, oleo: 2.0 },
      kgAlimentoGerado: 9.0,
      alimentosRetirados: { tomate: 2.0, batata: 4.0, ovos: 1.0 },
      kgAlimentoGasto: 7.0
    },
    {
      id: 'TRX-8902',
      dataHora: '2026-07-28 14:22',
      cpfCidadao: '987.654.321-11',
      nomeCidadao: 'José Benedito de Oliveira',
      bairro: 'Uvaranas',
      idCaminhao: 'CAM-02',
      reciclaveis: { vidro: 16.0, metal: 6.0 },
      kgAlimentoGerado: 4.0,
      alimentosRetirados: { cenoura: 2.0, maca: 2.0 },
      kgAlimentoGasto: 4.0
    }
  ]
};

class EstadoApp {
  constructor() {
    const dadosSalvos = localStorage.getItem('FEIRA_VERDE_DB');
    if (dadosSalvos) {
      try {
        this.banco = JSON.parse(dadosSalvos);
      } catch (e) {
        this.banco = JSON.parse(JSON.stringify(bancoInicial));
      }
    } else {
      this.banco = JSON.parse(JSON.stringify(bancoInicial));
      this.salvar();
    }
    this.perfilAtual = 'admin';
    this.cpfCidadaoAtivo = '123.456.789-00';
    this.ouvintes = [];
  }

  salvar() {
    localStorage.setItem('FEIRA_VERDE_DB', JSON.stringify(this.banco));
    this.notificar();
  }

  inscrever(ouvinte) {
    this.ouvintes.push(ouvinte);
    return () => {
      this.ouvintes = this.ouvintes.filter(fn => fn !== ouvinte);
    };
  }

  notificar() {
    this.ouvintes.forEach(fn => fn(this.banco));
  }

  resetar() {
    this.banco = JSON.parse(JSON.stringify(bancoInicial));
    this.salvar();
  }

  obterCidadao(cpf) {
    return this.banco.cidadaos.find(c => c.cpf === cpf) || this.banco.cidadaos[0];
  }

  obterCaminhao(id) {
    return this.banco.caminhoes.find(t => t.id === id);
  }

  adicionarTransacao(tx) {
    this.banco.transacoes.unshift(tx);
    
    const cidadao = this.obterCidadao(tx.cpfCidadao);
    if (cidadao) {
      const diferencaLiquida = tx.kgAlimentoGerado - tx.kgAlimentoGasto;
      cidadao.saldoAlimentoKg = Math.max(0, cidadao.saldoAlimentoKg + diferencaLiquida);
      
      let totalKgNaTx = 0;
      Object.values(tx.reciclaveis).forEach(v => totalKgNaTx += v);
      cidadao.totalRecicladoKg += totalKgNaTx;
    }

    const caminhao = this.obterCaminhao(tx.idCaminhao);
    if (caminhao) {
      let totalKgNaTx = 0;
      Object.values(tx.reciclaveis).forEach(v => totalKgNaTx += v);
      caminhao.reciclaveisColetadosKg += totalKgNaTx;

      Object.entries(tx.alimentosRetirados).forEach(([idAlimento, qtd]) => {
        if (caminhao.estoqueAlimentosKg[idAlimento] !== undefined) {
          caminhao.estoqueAlimentosKg[idAlimento] = Math.max(0, caminhao.estoqueAlimentosKg[idAlimento] - qtd);
        }
      });
    }

    this.salvar();
  }

  dispararAlerta(bairro, titulo, mensagem, tipo = 'warning') {
    const novoAlerta = {
      id: Date.now(),
      titulo,
      bairro,
      mensagem,
      dataHora: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      tipo
    };
    this.banco.alertasUrgentes.unshift(novoAlerta);
    this.salvar();
    return novoAlerta;
  }

  adicionarDemandaUrgenteProduto(idAlimento, kgSolicitados, motivo) {
    const itemAlimento = this.banco.estoqueCentral.find(s => s.id === idAlimento);
    const demanda = {
      id: Date.now(),
      idAlimento,
      nomeAlimento: itemAlimento ? itemAlimento.nome : idAlimento,
      kgSolicitados: parseFloat(kgSolicitados),
      kgAtendidos: 0,
      status: 'ABERTO',
      prazo: 'Hoje até as 17:30',
      motivo
    };
    this.banco.demandasUrgentesProdutos.unshift(demanda);
    this.salvar();
    return demanda;
  }

  atenderDemandaProduto(idDemanda, nomeProdutor, qtdKg) {
    const demanda = this.banco.demandasUrgentesProdutos.find(d => d.id === idDemanda);
    if (demanda) {
      const qtd = parseFloat(qtdKg);
      demanda.kgAtendidos += qtd;
      if (demanda.kgAtendidos >= demanda.kgSolicitados) {
        demanda.status = 'CONCLUIDO';
      }

      const itemEstoque = this.banco.estoqueCentral.find(s => s.id === demanda.idAlimento);
      if (itemEstoque) {
        itemEstoque.qtdKg += qtd;
        itemEstoque.fornecedor = nomeProdutor;
        itemEstoque.dataLote = new Date().toISOString().split('T')[0];
      }

      this.salvar();
    }
  }

  atualizarStatusRota(idCaminhao, novoStatus) {
    const caminhao = this.obterCaminhao(idCaminhao);
    if (caminhao) {
      caminhao.status = novoStatus;
      this.salvar();
    }
  }

  atualizarTaxaConversao(id, novoKgPorKgAlimento) {
    const taxa = this.banco.taxasConversao.find(r => r.id === id);
    if (taxa) {
      taxa.kgPorKgAlimento = parseFloat(novoKgPorKgAlimento);
      this.salvar();
    }
  }
}

export const appState = new EstadoApp();

export function useAppState() {
  const [banco, setBanco] = useState(appState.banco);

  useEffect(() => {
    const desinscrever = appState.inscrever((novoBanco) => {
      setBanco({ ...novoBanco });
    });
    return desinscrever;
  }, []);

  return banco;
}
