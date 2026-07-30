import React, { useState } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function AdminComponent({ banco, onAbrirStatusModal, onAbrirAlertModal }) {
  const [taxasEditaveis, setTaxasEditaveis] = useState(() => {
    const obj = {};
    banco.taxasConversao.forEach(t => {
      obj[t.id] = t.kgPorKgAlimento;
    });
    return obj;
  });

  let totalReciclavelKg = 0;
  let totalAlimentoDistribuidoKg = 0;
  banco.transacoes.forEach(t => {
    Object.values(t.reciclaveis || {}).forEach(v => totalReciclavelKg += v);
    totalAlimentoDistribuidoKg += t.kgAlimentoGasto;
  });

  const qtdCaminhoesAtivos = banco.caminhoes.filter(t => t.status === 'EM_ANDAMENTO').length;
  const totalEstoqueCentralKg = banco.estoqueCentral.reduce((acumulador, item) => acumulador + item.qtdKg, 0);

  const handleSalvarTaxa = (idTaxa) => {
    const valor = taxasEditaveis[idTaxa];
    if (valor !== undefined && !isNaN(parseFloat(valor))) {
      appState.atualizarTaxaConversao(idTaxa, valor);
      utilitarios.mostrarNotificacao(`Taxa de ${idTaxa} atualizada para ${valor}!`, 'success');
    }
  };

  return (
    <div>
      {/* Indicadores Principais */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
          <div className="kpi-icon"><i className="fa-solid fa-recycle"></i></div>
          <div className="kpi-value">{(totalReciclavelKg + 845.5).toFixed(1)} kg</div>
          <div className="kpi-label">Recicláveis Coletados</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
          <div className="kpi-icon"><i className="fa-solid fa-carrot"></i></div>
          <div className="kpi-value">{(totalAlimentoDistribuidoKg + 450).toFixed(0)} kg</div>
          <div className="kpi-label">Alimentos Entregues</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' }}>
          <div className="kpi-icon"><i className="fa-solid fa-truck"></i></div>
          <div className="kpi-value">{qtdCaminhoesAtivos} / {banco.caminhoes.length}</div>
          <div className="kpi-label">Caminhões em Rota</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#8b5cf6' }}>
          <div className="kpi-icon"><i className="fa-solid fa-shield-halved"></i></div>
          <div className="kpi-value">{banco.cidadaos.length * 480}</div>
          <div className="kpi-label">Validados via Gov.br</div>
        </div>
      </div>

      {/* Alertas de Suprimento */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '12px' }}>
          <h3 style={{ fontSize: '1rem', margin: 0 }}>
            <i className="fa-solid fa-bullhorn" style={{ color: 'var(--cor-destaque)', marginRight: '8px' }}></i>
            Demandas Urgentes aos Produtores
          </h3>
          <button
            className="btn btn-warning btn-sm"
            onClick={onAbrirAlertModal}
          >
            <i className="fa-solid fa-plus"></i> Notificar Urgência
          </button>
        </div>

        <div className="grid-2">
          {banco.demandasUrgentesProdutos.map(demanda => {
            const porcentagem = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
            return (
              <div key={demanda.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--raio-p)', border: '1px solid var(--cor-borda)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{demanda.nomeAlimento}</strong>
                  <span className={`badge ${demanda.status === 'CONCLUIDO' ? 'badge-success' : 'badge-warning'}`}>
                    {demanda.status === 'CONCLUIDO' ? 'Concluído' : 'Urgente'}
                  </span>
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)', marginBottom: '6px' }}>
                  {demanda.motivo}
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Atendido: <strong>{demanda.kgAtendidos} / {demanda.kgSolicitados} kg</strong></span>
                  <span>{porcentagem}%</span>
                </div>
                <div className="progress-bar-bg">
                  <div className="progress-bar-fill" style={{ width: `${porcentagem}%` }}></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        {/* Rotas dos Caminhões & Reagendamento por Improvisos */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-map-location-dot"></i> Rotas dos Caminhões</h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Caminhão</th>
                  <th>Ponto</th>
                  <th>Status</th>
                  <th>Improviso / Ação</th>
                </tr>
              </thead>
              <tbody>
                {banco.caminhoes.map(caminhao => (
                  <tr key={caminhao.id}>
                    <td><strong>{caminhao.id}</strong></td>
                    <td>{caminhao.bairro}</td>
                    <td>
                      <span className={`badge ${caminhao.status === 'EM_ANDAMENTO' ? 'badge-success' : caminhao.status === 'ATRASADO_CHUVA' ? 'badge-danger' : 'badge-info'}`}>
                        {caminhao.status === 'EM_ANDAMENTO' ? 'Em Rota' : caminhao.status === 'ATRASADO_CHUVA' ? 'Pausado (Chuva)' : 'Agendado'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onAbrirStatusModal(caminhao)}>
                        <i className="fa-solid fa-pen-to-square"></i> Status / Reagendar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estoque Central PEPS & Anti-Desperdício */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-boxes-packing"></i> Estoque Central (Antidesperdício PEPS)
            </h3>
            <span className="badge badge-success">{totalEstoqueCentralKg} kg</span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd.</th>
                  <th>Validade / Lote</th>
                </tr>
              </thead>
              <tbody>
                {banco.estoqueCentral.map(item => {
                  const ehCritico = item.diasVencimento <= 5;
                  return (
                    <tr key={item.id}>
                      <td>
                        <strong>{item.nome}</strong>
                        {ehCritico && (
                          <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                            <i className="fa-solid fa-triangle-exclamation"></i> Prioridade Saída
                          </span>
                        )}
                      </td>
                      <td><span className="badge badge-success">{item.qtdKg} kg</span></td>
                      <td style={{ fontSize: '0.8rem', color: ehCritico ? 'var(--cor-perigo)' : 'var(--cor-texto-secundario)' }}>
                        {item.dataLote} ({item.diasVencimento}d)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Configuração das Taxas */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 className="card-title"><i className="fa-solid fa-sliders"></i> Taxas de Conversão (Reciclável → 1kg Alimento)</h3>
        </div>

        <div className="grid-3">
          {banco.taxasConversao.map(taxa => (
            <div key={taxa.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--raio-p)', border: '1px solid var(--cor-borda)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem' }}><i className={`fa-solid ${taxa.icone}`}></i> {taxa.nome}</strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>({taxa.unidade})</span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="0.1"
                  className="form-control"
                  value={taxasEditaveis[taxa.id] !== undefined ? taxasEditaveis[taxa.id] : taxa.kgPorKgAlimento}
                  onChange={(e) => setTaxasEditaveis({ ...taxasEditaveis, [taxa.id]: e.target.value })}
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleSalvarTaxa(taxa.id)}>OK</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
