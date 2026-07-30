import React, { useState } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function ProdutorComponent({ banco }) {
  const [ofertas, setOfertas] = useState({});
  const [nomeProdutor, setNomeProdutor] = useState('Sítio Sol Nascente (Família Oliveira)');
  const [alimentoSelecionado, setAlimentoSelecionado] = useState('tomate');
  const [qtdEntrega, setQtdEntrega] = useState('');
  const [dataLote, setDataLote] = useState(() => new Date().toISOString().split('T')[0]);

  const totalEntregueKg = banco.estoqueCentral.reduce((soma, item) => soma + item.qtdKg, 0);
  const demandasAtivas = banco.demandasUrgentesProdutos.filter(d => d.status === 'ABERTO');

  const handleAtualizarOferta = (idDemanda, val) => {
    setOfertas(prev => ({ ...prev, [idDemanda]: val }));
  };

  const handleAtenderDemanda = (idDemanda) => {
    const val = ofertas[idDemanda];
    const qtd = parseFloat(val || 0);

    if (!qtd || qtd <= 0) {
      utilitarios.mostrarNotificacao('Informe uma quantidade válida em kg.', 'warning');
      return;
    }

    appState.atenderDemandaProduto(idDemanda, nomeProdutor, qtd);
    utilitarios.mostrarNotificacao(`Você enviou ${qtd}kg de hortifrúti! Estoque reabastecido.`, 'success');
    setOfertas(prev => ({ ...prev, [idDemanda]: '' }));
  };

  const handleEnviarColheita = (e) => {
    e.preventDefault();
    const qtd = parseFloat(qtdEntrega) || 0;

    if (qtd <= 0) {
      utilitarios.mostrarNotificacao('Informe uma quantidade válida para a entrega.', 'warning');
      return;
    }

    const item = banco.estoqueCentral.find(s => s.id === alimentoSelecionado);
    if (item) {
      item.qtdKg += qtd;
      item.fornecedor = nomeProdutor;
      item.dataLote = dataLote;
      appState.salvar();
      utilitarios.mostrarNotificacao(`Entrega de ${qtd}kg de ${item.nome} registrada!`, 'success');
      setQtdEntrega('');
    }
  };

  return (
    <div>
      {/* Banner Produtor */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.2rem', margin: 0 }}>Portal dos Produtores Rurais</h2>
            <div style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginTop: '2px' }}>
              Agricultura Familiar & Cooperativas
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>Total Fornecido</div>
            <div style={{ fontFamily: 'var(--fonte-titulo)', fontSize: '1.2rem', fontWeight: 800, color: 'var(--cor-destaque)' }}>
              {totalEntregueKg} kg
            </div>
          </div>
        </div>
      </div>

      {/* Demanda Urgente */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--cor-destaque)' }}>
            <i className="fa-solid fa-bell-exclamation"></i> Pedidos da Prefeitura ({demandasAtivas.length} Abertos)
          </h3>
        </div>

        <div className="grid-2">
          {banco.demandasUrgentesProdutos.map(demanda => {
            const porcentagem = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
            const ehConcluido = demanda.status === 'CONCLUIDO';

            return (
              <div key={demanda.id} style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: 'var(--raio-p)', border: '1px solid var(--cor-borda)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <strong style={{ fontSize: '0.9rem' }}>{demanda.nomeAlimento}</strong>
                  <span className={`badge ${ehConcluido ? 'badge-success' : 'badge-warning'}`}>
                    {ehConcluido ? 'Atendido' : 'Urgente'}
                  </span>
                </div>

                <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)', marginBottom: '8px' }}>
                  {demanda.motivo}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                  <span>Progresso:</span>
                  <strong>{demanda.kgAtendidos} / {demanda.kgSolicitados} kg ({porcentagem}%)</strong>
                </div>

                {!ehConcluido ? (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <input
                      type="number"
                      min="1"
                      className="form-control"
                      placeholder="Qtd em kg"
                      value={ofertas[demanda.id] || ''}
                      onChange={(e) => handleAtualizarOferta(demanda.id, e.target.value)}
                    />
                    <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap' }} onClick={() => handleAtenderDemanda(demanda.id)}>
                      Enviar
                    </button>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--cor-primaria)', marginTop: '6px' }}>
                    <i className="fa-solid fa-check"></i> Atendido
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2">
        {/* Nova Entrega */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-plus-circle"></i> Registrar Entrega</h3>
          </div>

          <form onSubmit={handleEnviarColheita}>
            <div className="form-group" style={{ marginBottom: '10px' }}>
              <label className="form-label">Produtor / Cooperativa</label>
              <input
                type="text"
                className="form-control"
                value={nomeProdutor}
                onChange={(e) => setNomeProdutor(e.target.value)}
                required
              />
            </div>

            <div className="grid-2" style={{ marginBottom: '10px' }}>
              <div className="form-group">
                <label className="form-label">Alimento</label>
                <select
                  className="form-control"
                  value={alimentoSelecionado}
                  onChange={(e) => setAlimentoSelecionado(e.target.value)}
                >
                  {banco.estoqueCentral.map(item => (
                    <option key={item.id} value={item.id}>{item.nome}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ex: 200"
                  value={qtdEntrega}
                  onChange={(e) => setQtdEntrega(e.target.value)}
                  required
                  min="1"
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Confirmar Entrada
            </button>
          </form>
        </div>

        {/* Historico */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title"><i className="fa-solid fa-list"></i> Entregas no Almoxarifado</h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantidade</th>
                  <th>Fornecedor</th>
                </tr>
              </thead>
              <tbody>
                {banco.estoqueCentral.map(item => (
                  <tr key={item.id}>
                    <td><strong>{item.nome}</strong></td>
                    <td><span className="badge badge-success">{item.qtdKg} kg</span></td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>{item.fornecedor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
