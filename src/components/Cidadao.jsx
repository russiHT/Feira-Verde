import React, { useMemo, useState } from 'react';
import { creditoDeReciclaveis } from '../estado';
import { utilitarios } from '../utilitarios';

export function CidadaoComponent({ banco }) {
  // Sem autenticação real ainda: o seletor deixa explícito que estamos
  // simulando o munícipe logado, em vez de esconder um CPF fixo no código.
  const [cpfAtivo, setCpfAtivo] = useState(() => banco.cidadaos[0]?.cpf || '');
  const [simulacao, setSimulacao] = useState({ plastico: 5, papelao: 5, vidro: 0, oleo: 2 });

  const cidadao = banco.cidadaos.find((c) => c.cpf === cpfAtivo) || banco.cidadaos[0] || null;

  const kgSimulado = creditoDeReciclaveis(banco, simulacao);

  const historico = useMemo(
    () => (cidadao ? banco.transacoes.filter((t) => t.cpfCidadao === cidadao.cpf).slice(0, 5) : []),
    [banco, cidadao]
  );

  if (!cidadao) {
    return (
      <div className="card">
        <p style={{ color: 'var(--cor-texto-secundario)' }}>Nenhum munícipe cadastrado.</p>
      </div>
    );
  }

  const alerta = banco.alertasUrgentes.find((a) => a.bairro.includes(cidadao.bairro)) || banco.alertasUrgentes[0];

  const handleSimular = (idMaterial, val) => {
    setSimulacao((prev) => ({
      ...prev,
      [idMaterial]: val === '' ? '' : Math.max(0, parseFloat(val) || 0)
    }));
  };

  return (
    <div>
      {alerta && (
        <div className="urgent-banner" style={{ marginBottom: '16px', padding: '12px 16px', borderRadius: 'var(--raio-m)' }}>
          <div className="urgent-banner-content">
            <span className="urgent-banner-tag">AVISO</span>
            <div>
              <strong>{alerta.titulo}</strong> — {alerta.mensagem}
            </div>
          </div>
        </div>
      )}

      {/* Perfil */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <select
              className="form-control"
              style={{ width: 'auto', fontWeight: 700, marginBottom: '4px' }}
              value={cidadao.cpf}
              onChange={(e) => setCpfAtivo(e.target.value)}
            >
              {banco.cidadaos.map((c) => (
                <option key={c.cpf} value={c.cpf}>
                  {c.nome}
                </option>
              ))}
            </select>
            <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)' }}>
              CPF: {utilitarios.mascararCpf(cidadao.cpf)} | Bairro: <strong>{cidadao.bairro}</strong>
            </div>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>Saldo Disponível</div>
            <div
              className="coin-badge"
              style={{ fontSize: '1.1rem', padding: '6px 14px' }}
            >
              <i className="fa-solid fa-basket-shopping"></i> {cidadao.saldoAlimentoKg.toFixed(1)} kg
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2">
        {/* Calculadora */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-calculator"></i> Simular troca
            </h3>
            <span className="badge badge-success">+{kgSimulado.toFixed(1)} kg Alimento</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
            {banco.materiais.map((material) => (
              <div
                key={material.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 12px',
                  background: 'var(--cor-superficie-suave)',
                  borderRadius: 'var(--raio-p)',
                  border: '1px solid var(--cor-borda)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: 'var(--raio-p)',
                      background: 'var(--cor-superficie-media)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--cor-primaria)',
                      flexShrink: 0
                    }}
                  >
                    <i className={`fa-solid ${material.icone}`}></i>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 600 }}>{material.nome}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                      {material.qtdPorKgAlimento} {material.unidade} = 1 kg de alimento
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
                    value={simulacao[material.id] ?? ''}
                    style={{ width: '90px', textAlign: 'right', fontWeight: 600 }}
                    onChange={(e) => handleSimular(material.id, e.target.value)}
                  />
                  <span style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', minWidth: '24px' }}>
                    {material.unidade}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              background: 'var(--cor-superficie-suave)',
              border: '1px solid var(--cor-borda-destaque)',
              padding: '12px',
              borderRadius: 'var(--raio-m)',
              textAlign: 'center'
            }}
          >
            <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>Estimativa de retorno:</div>
            <div
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: 'var(--cor-primaria)',
                margin: '4px 0'
              }}
            >
              ~{kgSimulado.toFixed(1)} kg de Alimentos
            </div>
          </div>
        </div>

        <div>
          {/* Itinerário */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-map-pin"></i> Pontos de atendimento
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {banco.caminhoes.map((caminhao) => {
                const doBairro = caminhao.bairro.includes(cidadao.bairro);

                return (
                  <div
                    key={caminhao.id}
                    style={{
                      background: doBairro ? '#f0fdf4' : 'var(--cor-superficie-suave)',
                      border: `1px solid ${doBairro ? 'var(--cor-borda-destaque)' : 'var(--cor-borda)'}`,
                      padding: '12px',
                      borderRadius: 'var(--raio-m)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>
                      <div>
                        <strong style={{ fontSize: '0.9rem' }}>{caminhao.bairro}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                          <i className="fa-solid fa-location-dot" style={{ color: 'var(--cor-primaria)' }}></i>{' '}
                          {caminhao.localizacao}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                          <i className="fa-regular fa-clock"></i> {caminhao.horarioAgendado}
                        </div>
                      </div>
                      <span
                        className={`badge ${
                          caminhao.status === 'EM_ANDAMENTO'
                            ? 'badge-success'
                            : caminhao.status === 'ATRASADO_CHUVA'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {caminhao.status === 'EM_ANDAMENTO'
                          ? 'No Ponto Agora'
                          : caminhao.status === 'ATRASADO_CHUVA'
                          ? 'Pausado'
                          : caminhao.status === 'CONCLUIDO'
                          ? 'Encerrado'
                          : 'Agendado'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Histórico do munícipe */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-clock-rotate-left"></i> Histórico
              </h3>
            </div>

            {historico.length === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', margin: 0 }}>
                Nenhuma troca registrada ainda.
              </p>
            ) : (
              <div className="table-responsive">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Data</th>
                      <th>Crédito</th>
                      <th>Retirada</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico.map((t) => (
                      <tr key={t.id}>
                        <td style={{ fontSize: '0.8rem' }}>{t.dataHora}</td>
                        <td>
                          <span className="badge badge-success">+{t.kgAlimentoGerado.toFixed(1)} kg</span>
                        </td>
                        <td>
                          <span className="badge badge-warning">-{t.kgAlimentoGasto.toFixed(1)} kg</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
