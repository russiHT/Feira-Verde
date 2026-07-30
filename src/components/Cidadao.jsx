import React, { useState } from 'react';
import { appState } from '../estado';

export function CidadaoComponent({ banco }) {
  const [pesosCalculadora, setPesosCalculadora] = useState({ plastico: 5, papelao: 5, vidro: 0, oleo: 2 });
  const cidadao = appState.obterCidadao(appState.cpfCidadaoAtivo);

  let simularKgAlimento = 0;
  Object.entries(pesosCalculadora).forEach(([id, val]) => {
    const numVal = parseFloat(val) || 0;
    const taxa = banco.taxasConversao.find(r => r.id === id);
    if (taxa && taxa.kgPorKgAlimento > 0) {
      simularKgAlimento += (numVal / taxa.kgPorKgAlimento);
    }
  });

  const handleAtualizarSimulacao = (idTaxa, val) => {
    setPesosCalculadora(prev => ({
      ...prev,
      [idTaxa]: val === '' ? '' : Math.max(0, parseFloat(val) || 0)
    }));
  };

  return (
    <div>
      {/* Alerta Urgente */}
      {banco.alertasUrgentes.length > 0 && (
        <div className="urgent-banner" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--raio-m)' }}>
          <div className="urgent-banner-content">
            <span className="urgent-banner-tag">AVISO</span>
            <div>
              <strong>{banco.alertasUrgentes[0].titulo}</strong> — {banco.alertasUrgentes[0].mensagem}
            </div>
          </div>
        </div>
      )}

      {/* Cartão de Perfil */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>{cidadao.nome}</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>
              CPF: ***.{cidadao.cpf.substr(4, 7)}-** | Bairro: <strong>{cidadao.bairro}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>Saldo Disponível</div>
              <div className="coin-badge" style={{ background: 'linear-gradient(135deg, #10b981, #059669)', fontSize: '1.1rem', padding: '6px 14px' }}>
                <i className="fa-solid fa-basket-shopping"></i> {cidadao.saldoAlimentoKg.toFixed(1)} kg
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Calculadora Verde */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-calculator"></i> Calculadora de Troca</h3>
            <span className="badge badge-success">+{simularKgAlimento.toFixed(1)} kg Alimento</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {banco.taxasConversao.map(taxa => (
              <div
                key={taxa.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'space-between',
                  padding: '10px 12px',
                  background: 'rgba(15, 23, 42, 0.4)',
                  borderRadius: 'var(--raio-s)',
                  border: '1px solid var(--cor-borda)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--cor-primaria)' }}>
                    <i className={`fa-solid ${taxa.icone}`}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{taxa.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                      Taxa: {taxa.kgPorKgAlimento} {taxa.unidade} = 1 kg alimento
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="number"
                    className="form-control"
                    min="0"
                    step="0.5"
                    placeholder="0"
                    value={pesosCalculadora[taxa.id] !== undefined ? pesosCalculadora[taxa.id] : ''}
                    style={{ width: '90px', textAlign: 'right', fontWeight: 600 }}
                    onChange={(e) => handleAtualizarSimulacao(taxa.id, e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', minWidth: '24px' }}>{taxa.unidade}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--cor-borda-destaque)', padding: '12px', borderRadius: 'var(--raio-m)', textAlign: 'center' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>Estimativa de retorno:</div>
            <div style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.4rem', fontWeight: 800, color: 'var(--cor-primaria)', margin: '4px 0' }}>
              ~{simularKgAlimento.toFixed(1)} kg de Alimentos
            </div>
          </div>
        </div>

        {/* Itinerário dos Caminhões */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-map-pin"></i> Horários dos Caminhões</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {banco.caminhoes.map(caminhao => {
              const ehBairroDoUsuario = caminhao.bairro.includes(cidadao.bairro);

              return (
                <div key={caminhao.id} style={{
                  background: ehBairroDoUsuario ? 'rgba(16, 185, 129, 0.12)' : 'rgba(15, 23, 42, 0.6)',
                  border: `1px solid ${ehBairroDoUsuario ? 'var(--cor-borda-destaque)' : 'var(--cor-borda)'}`,
                  padding: '12px',
                  borderRadius: 'var(--raio-m)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>{caminhao.bairro}</strong>
                      <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                        <i className="fa-solid fa-location-dot" style={{ color: 'var(--cor-primaria)' }}></i> {caminhao.localizacao}
                      </div>
                    </div>
                    <span className={`badge ${caminhao.status === 'EM_ANDAMENTO' ? 'badge-success' : 'badge-warning'}`}>
                      {caminhao.status === 'EM_ANDAMENTO' ? 'No Ponto Agora' : 'Agendado'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
