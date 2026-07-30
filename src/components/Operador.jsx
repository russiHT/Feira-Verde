import React, { useState } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function OperadorComponent({ banco, onFinalizarTransacao }) {
  const [idCaminhaoSelecionado, setIdCaminhaoSelecionado] = useState('CAM-01');
  const [cpfCidadao, setCpfCidadao] = useState('123.456.789-00');
  const [reciclaveis, setReciclaveis] = useState({ plastico: 0, papelao: 0, vidro: 0, metal: 0, oleo: 0, pneu: 0 });
  const [alimentosRetirados, setAlimentosRetirados] = useState({ tomate: 0, batata: 0, cenoura: 0, maca: 0, alface: 0, ovos: 0 });

  const caminhaoAtual = banco.caminhoes.find(t => t.id === idCaminhaoSelecionado) || banco.caminhoes[0];
  const cidadao = banco.cidadaos.find(c => c.cpf === cpfCidadao) || banco.cidadaos[0];

  let kgAlimentoGerado = 0;
  Object.entries(reciclaveis).forEach(([id, qtd]) => {
    const taxa = banco.taxasConversao.find(r => r.id === id);
    if (taxa && taxa.kgPorKgAlimento > 0) {
      kgAlimentoGerado += (qtd / taxa.kgPorKgAlimento);
    }
  });

  let kgAlimentoGasto = 0;
  Object.values(alimentosRetirados).forEach(qtd => {
    kgAlimentoGasto += qtd;
  });

  const saldoLiquidoDisponivel = Math.max(0, (cidadao.saldoAlimentoKg + kgAlimentoGerado) - kgAlimentoGasto);

  const handleAtualizarPeso = (idTaxa, val) => {
    const num = parseFloat(val) || 0;
    setReciclaveis(prev => ({ ...prev, [idTaxa]: num }));
  };

  const handleAlterarQtdAlimento = (idAlimento, delta) => {
    const atual = alimentosRetirados[idAlimento] || 0;
    const proximoValor = Math.max(0, atual + delta);
    const disponivelNoCaminhao = caminhaoAtual.estoqueAlimentosKg[idAlimento] || 0;

    if (proximoValor > disponivelNoCaminhao) {
      utilitarios.mostrarNotificacao(`Estoque insuficiente! (Disponível: ${disponivelNoCaminhao}kg)`, 'danger');
      return;
    }

    if (delta > 0) {
      let novoTotalGasto = 0;
      Object.entries(alimentosRetirados).forEach(([id, qtd]) => {
        novoTotalGasto += (id === idAlimento ? proximoValor : qtd);
      });

      const saldoFuturo = (cidadao.saldoAlimentoKg + kgAlimentoGerado) - novoTotalGasto;

      if (saldoFuturo < 0) {
        utilitarios.mostrarNotificacao(`Saldo do munícipe atingido! Pese mais recicláveis.`, 'warning');
        return;
      }
    }

    setAlimentosRetirados(prev => ({ ...prev, [idAlimento]: proximoValor }));
  };

  const handleFinalizar = () => {
    if (kgAlimentoGerado === 0 && kgAlimentoGasto === 0) {
      utilitarios.mostrarNotificacao('Preencha os recicláveis pesados ou os alimentos retirados.', 'warning');
      return;
    }

    const tx = {
      id: `TRX-${Math.floor(1000 + Math.random() * 9000)}`,
      dataHora: new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }),
      cpfCidadao: cidadao.cpf,
      nomeCidadao: cidadao.nome,
      bairro: cidadao.bairro,
      idCaminhao: caminhaoAtual.id,
      reciclaveis: { ...reciclaveis },
      kgAlimentoGerado,
      alimentosRetirados: { ...alimentosRetirados },
      kgAlimentoGasto
    };

    appState.adicionarTransacao(tx);

    setReciclaveis({ plastico: 0, papelao: 0, vidro: 0, metal: 0, oleo: 0, pneu: 0 });
    setAlimentosRetirados({ tomate: 0, batata: 0, cenoura: 0, maca: 0, alface: 0, ovos: 0 });

    utilitarios.mostrarNotificacao(`Troca ${tx.id} concluída com sucesso!`, 'success');
    onFinalizarTransacao(tx);
  };

  return (
    <div>
      {/* Seletor de Caminhão */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid var(--cor-borda-destaque)',
        padding: '12px 20px',
        borderRadius: 'var(--raio-m)',
        marginBottom: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fa-solid fa-truck-front" style={{ fontSize: '20px', color: 'var(--cor-primaria)' }}></i>
          <div>
            <strong style={{ fontSize: '1rem' }}>Terminal Caminhão: {caminhaoAtual.id}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginLeft: '10px' }}>({caminhaoAtual.bairro})</span>
          </div>
        </div>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={idCaminhaoSelecionado}
          onChange={(e) => setIdCaminhaoSelecionado(e.target.value)}
        >
          {banco.caminhoes.map(t => (
            <option key={t.id} value={t.id}>{t.id} - {t.bairro}</option>
          ))}
        </select>
      </div>

      <div className="grid-2">
        <div>
          {/* Passo 1: Munícipe */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-user"></i> 1. Munícipe</h3>
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <select
                className="form-control"
                value={cpfCidadao}
                onChange={(e) => setCpfCidadao(e.target.value)}
              >
                {banco.cidadaos.map(c => (
                  <option key={c.cpf} value={c.cpf}>
                    {c.nome} ({c.cpf}) - Saldo: {c.saldoAlimentoKg.toFixed(1)} kg
                  </option>
                ))}
              </select>
            </div>

            <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '10px 14px', borderRadius: 'var(--raio-p)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{cidadao.nome}</span>
              <strong style={{ color: 'var(--cor-primaria)' }}>Saldo: {cidadao.saldoAlimentoKg.toFixed(1)} kg</strong>
            </div>
          </div>

          {/* Passo 2: Pesagem */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title"><i className="fa-solid fa-scale-balanced"></i> 2. Entradas (Recicláveis)</h3>
              <span className="badge badge-success">+{kgAlimentoGerado.toFixed(1)} kg Alimento</span>
            </div>

            <div className="grid-2">
              {banco.taxasConversao.map(taxa => (
                <div key={taxa.id} style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid var(--cor-borda)', padding: '10px', borderRadius: 'var(--raio-p)' }}>
                  <div style={{ fontSize: '0.8rem', marginBottom: '6px', fontWeight: 600 }}>
                    <i className={`fa-solid ${taxa.icone}`}></i> {taxa.nome}
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    value={reciclaveis[taxa.id] || ''}
                    placeholder={`0.0 ${taxa.unidade}`}
                    onChange={(e) => handleAtualizarPeso(taxa.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Passo 3: Cesta & Finalizar */}
        <div>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <div className="card-header">
                <h3 className="card-title"><i className="fa-solid fa-basket-shopping"></i> 3. Saída (Hortifrúti)</h3>
                <span className="badge badge-info">Disponível: {saldoLiquidoDisponivel.toFixed(1)} kg</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {banco.estoqueCentral.map(alimento => {
                  const estoqueNoCaminhao = caminhaoAtual.estoqueAlimentosKg[alimento.id] || 0;
                  const selecionadoAtual = alimentosRetirados[alimento.id] || 0;

                  return (
                    <div key={alimento.id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid var(--cor-borda)', padding: '10px 14px', borderRadius: 'var(--raio-p)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div>
                        <strong>{alimento.nome}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>Disponível: {estoqueNoCaminhao} kg</div>
                      </div>

                      <div className="counter-box">
                        <button className="btn-counter" onClick={() => handleAlterarQtdAlimento(alimento.id, -1)}>-</button>
                        <span style={{ fontWeight: 800, minWidth: '32px', textAlign: 'center' }}>{selecionadoAtual} kg</span>
                        <button className="btn-counter" onClick={() => handleAlterarQtdAlimento(alimento.id, 1)}>+</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Finalizar */}
            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--cor-borda-destaque)', padding: '16px', borderRadius: 'var(--raio-m)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '0.85rem' }}>
                <span>Crédito Gerado:</span>
                <strong style={{ color: 'var(--cor-primaria)' }}>+{kgAlimentoGerado.toFixed(1)} kg</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px', fontSize: '0.85rem' }}>
                <span>Hortifrúti Entregue:</span>
                <strong style={{ color: 'var(--cor-destaque)' }}>{kgAlimentoGasto.toFixed(1)} kg</strong>
              </div>

              <button
                className="btn btn-primary btn-block"
                style={{ padding: '12px' }}
                onClick={handleFinalizar}
                disabled={saldoLiquidoDisponivel < 0}
              >
                <i className="fa-solid fa-check"></i> Finalizar Troca & Recibo
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
