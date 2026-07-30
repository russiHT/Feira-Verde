import React, { useMemo, useState } from 'react';
import { appState, estoqueCentralPorProduto, TIPO_MOVIMENTO } from '../estado';
import { utilitarios } from '../utilitarios';

export function ProdutorComponent({ banco }) {
  const [ofertas, setOfertas] = useState({});
  const [nomeProdutor, setNomeProdutor] = useState('Sítio Sol Nascente (Família Oliveira)');
  const [entrega, setEntrega] = useState(() => ({
    idProduto: banco.produtos[0]?.id || '',
    qtdKg: '',
    precoPorKg: '',
    dataLote: new Date().toISOString().slice(0, 10)
  }));

  const estoque = useMemo(() => estoqueCentralPorProduto(banco), [banco]);
  const totalCentralKg = estoque.reduce((s, e) => s + e.qtdKg, 0);
  const demandasAbertas = banco.demandasUrgentesProdutos.filter((d) => d.status === 'ABERTO');

  // Histórico real de entradas — cada uma é um lote, com fornecedor e validade.
  const entradas = useMemo(
    () =>
      banco.movimentos
        .filter((m) => m.tipo === TIPO_MOVIMENTO.ENTRADA)
        .slice(0, 12)
        .map((m) => ({
          ...m,
          lote: banco.lotes.find((l) => l.id === m.idLote),
          produto: banco.produtos.find((p) => p.id === m.idProduto)
        })),
    [banco]
  );

  const handleAtenderDemanda = (idDemanda) => {
    const qtd = parseFloat(ofertas[idDemanda]);
    const r = appState.atenderDemanda({ idDemanda, fornecedor: nomeProdutor, qtdKg: qtd });

    if (!r.ok) {
      utilitarios.mostrarNotificacao(r.erro, 'warning');
      return;
    }

    utilitarios.mostrarNotificacao(`${qtd} kg enviados. Lote ${r.lote.id} criado.`, 'success');
    setOfertas((prev) => ({ ...prev, [idDemanda]: '' }));
  };

  const handleEnviarColheita = (e) => {
    e.preventDefault();
    const r = appState.registrarEntrada({
      idProduto: entrega.idProduto,
      qtdKg: parseFloat(entrega.qtdKg),
      fornecedor: nomeProdutor,
      dataLote: entrega.dataLote,
      precoPorKg: parseFloat(entrega.precoPorKg) || 0,
      referencia: 'Entrega espontânea'
    });

    if (!r.ok) {
      utilitarios.mostrarNotificacao(r.erro, 'warning');
      return;
    }

    utilitarios.mostrarNotificacao(
      `Entrega registrada. Lote ${r.lote.id} vence em ${r.lote.dataValidade}.`,
      'success'
    );
    setEntrega((prev) => ({ ...prev, qtdKg: '', precoPorKg: '' }));
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
            <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
              Estoque atual no almoxarifado
            </div>
            <div
              style={{
                fontFamily: 'var(--fonte-titulo)',
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--cor-destaque)'
              }}
            >
              {totalCentralKg.toFixed(0)} kg
            </div>
          </div>
        </div>
      </div>

      {/* Demandas */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div className="card-header">
          <h3 className="card-title" style={{ color: 'var(--cor-destaque)' }}>
            <i className="fa-solid fa-bell"></i> Pedidos da Prefeitura ({demandasAbertas.length} abertos)
          </h3>
        </div>

        {banco.demandasUrgentesProdutos.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', margin: 0 }}>
            Nenhum pedido no momento.
          </p>
        ) : (
          <div className="grid-2">
            {banco.demandasUrgentesProdutos.map((demanda) => {
              const pct = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
              const concluido = demanda.status === 'CONCLUIDO';

              return (
                <div
                  key={demanda.id}
                  style={{
                    background: 'var(--cor-superficie-suave)',
                    padding: '12px',
                    borderRadius: 'var(--raio-p)',
                    border: '1px solid var(--cor-borda)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '0.9rem' }}>{demanda.nomeProduto}</strong>
                    <span className={`badge ${concluido ? 'badge-success' : 'badge-warning'}`}>
                      {concluido ? 'Atendido' : 'Urgente'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)', marginBottom: '8px' }}>
                    {demanda.motivo}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '6px' }}>
                    <span>Progresso:</span>
                    <strong>
                      {demanda.kgAtendidos} / {demanda.kgSolicitados} kg ({pct}%)
                    </strong>
                  </div>

                  <div className="progress-bar-bg" style={{ marginBottom: '10px' }}>
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${pct}%`,
                        background: concluido ? 'var(--cor-primaria)' : 'var(--cor-destaque)'
                      }}
                    ></div>
                  </div>

                  {concluido ? (
                    <div style={{ textAlign: 'center', fontSize: '0.8rem', color: 'var(--cor-primaria)', marginTop: '6px' }}>
                      <i className="fa-solid fa-check"></i> Atendido
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                      <input
                        type="number"
                        min="1"
                        step="0.5"
                        className="form-control"
                        placeholder="Qtd em kg"
                        value={ofertas[demanda.id] || ''}
                        onChange={(e) => setOfertas((p) => ({ ...p, [demanda.id]: e.target.value }))}
                      />
                      <button
                        className="btn btn-primary btn-sm"
                        style={{ whiteSpace: 'nowrap' }}
                        onClick={() => handleAtenderDemanda(demanda.id)}
                      >
                        Enviar
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Nova entrega */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-plus-circle"></i> Registrar Entrega
            </h3>
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
                  value={entrega.idProduto}
                  onChange={(e) => setEntrega((p) => ({ ...p, idProduto: e.target.value }))}
                >
                  {banco.produtos.map((produto) => (
                    <option key={produto.id} value={produto.id}>
                      {produto.nome} ({produto.validadeDias}d de validade)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Quantidade (kg)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="ex: 200"
                  value={entrega.qtdKg}
                  onChange={(e) => setEntrega((p) => ({ ...p, qtdKg: e.target.value }))}
                  required
                  min="1"
                  step="0.5"
                />
              </div>
            </div>

            <div className="grid-2" style={{ marginBottom: '10px' }}>
              <div className="form-group">
                <label className="form-label">Data da colheita / lote</label>
                <input
                  type="date"
                  className="form-control"
                  value={entrega.dataLote}
                  onChange={(e) => setEntrega((p) => ({ ...p, dataLote: e.target.value }))}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Preço por kg (R$)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="opcional"
                  step="0.01"
                  min="0"
                  value={entrega.precoPorKg}
                  onChange={(e) => setEntrega((p) => ({ ...p, precoPorKg: e.target.value }))}
                />
              </div>
            </div>

            <button type="submit" className="btn btn-primary btn-block">
              Confirmar Entrada
            </button>
          </form>
        </div>

        {/* Histórico de lotes */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-list"></i> Últimas Entradas no Almoxarifado
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Lote</th>
                  <th>Entrada</th>
                  <th>Saldo / Validade</th>
                </tr>
              </thead>
              <tbody>
                {entradas.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ color: 'var(--cor-texto-secundario)', fontSize: '0.85rem' }}>
                      Nenhuma entrada registrada ainda.
                    </td>
                  </tr>
                )}
                {entradas.map((mov) => (
                  <tr key={mov.id}>
                    <td>
                      <strong>{mov.produto?.nome || mov.idProduto}</strong>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-secundario)' }}>
                        {mov.lote?.fornecedor || mov.origem}
                      </div>
                    </td>
                    <td>
                      <span className="badge badge-success">{mov.qtdKg} kg</span>
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-secundario)' }}>
                        {mov.lote?.dataLote}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)' }}>
                      {mov.lote ? `${mov.lote.qtdDisponivelKg} kg restantes` : '—'}
                      <div style={{ fontSize: '0.7rem' }}>vence {mov.lote?.dataValidade}</div>
                    </td>
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
