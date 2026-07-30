import React, { useMemo, useState } from 'react';
import {
  appState,
  estoqueCentralPorProduto,
  totaisColetaPorUnidade,
  totalAlimentoEntregueKg,
  totalPerdasKg,
  DIAS_ALERTA_VALIDADE
} from '../estado';
import { utilitarios } from '../utilitarios';

export function AdminComponent({ banco, onAbrirStatusModal, onAbrirAlertModal }) {
  const [taxasEditaveis, setTaxasEditaveis] = useState(() =>
    Object.fromEntries(banco.materiais.map((m) => [m.id, m.qtdPorKgAlimento]))
  );

  const [carregamento, setCarregamento] = useState(() => ({
    idCaminhao: banco.caminhoes[0]?.id || '',
    idProduto: banco.produtos[0]?.id || '',
    qtdKg: ''
  }));

  const estoque = useMemo(() => estoqueCentralPorProduto(banco), [banco]);
  const coleta = useMemo(() => totaisColetaPorUnidade(banco), [banco]);

  const totalCentralKg = estoque.reduce((s, e) => s + e.qtdKg, 0);
  const alimentoEntregueKg = totalAlimentoEntregueKg(banco);
  const perdasKg = totalPerdasKg(banco);
  const caminhoesEmRota = banco.caminhoes.filter((t) => t.status === 'EM_ANDAMENTO').length;
  const itensCriticos = estoque.filter((e) => e.critico && e.qtdKg > 0).length;

  const handleSalvarTaxa = (idMaterial) => {
    const r = appState.atualizarTaxaConversao(idMaterial, taxasEditaveis[idMaterial]);
    utilitarios.mostrarNotificacao(
      r.ok ? 'Taxa de conversão atualizada.' : r.erro,
      r.ok ? 'success' : 'danger'
    );
  };

  const handleCarregar = (e) => {
    e.preventDefault();
    const r = appState.carregarCaminhao({
      idCaminhao: carregamento.idCaminhao,
      idProduto: carregamento.idProduto,
      qtdKg: parseFloat(carregamento.qtdKg)
    });

    if (!r.ok) {
      utilitarios.mostrarNotificacao(r.erro, 'danger');
      return;
    }

    const lotesUsados = r.consumos.length;
    utilitarios.mostrarNotificacao(
      `Carregamento registrado (${lotesUsados} lote${lotesUsados > 1 ? 's' : ''}, saída pela validade mais próxima).`,
      'success'
    );
    setCarregamento((prev) => ({ ...prev, qtdKg: '' }));
  };

  return (
    <div>
      {/* Indicadores — todos derivados de dados reais do banco */}
      <div className="grid-4" style={{ marginBottom: '20px' }}>
        <div className="kpi-card" style={{ '--kpi-accent': '#10b981' }}>
          <div className="kpi-icon"><i className="fa-solid fa-recycle"></i></div>
          <div className="kpi-value">{(coleta.kg || 0).toFixed(1)} kg</div>
          <div className="kpi-label">
            Recicláveis Coletados
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.75 }}>
              + {(coleta.L || 0).toFixed(0)} L de óleo · {(coleta.un || 0).toFixed(0)} pneus
            </span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#f59e0b' }}>
          <div className="kpi-icon"><i className="fa-solid fa-carrot"></i></div>
          <div className="kpi-value">{alimentoEntregueKg.toFixed(1)} kg</div>
          <div className="kpi-label">
            Alimentos Entregues
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.75 }}>
              {banco.transacoes.length} trocas registradas
            </span>
          </div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': '#3b82f6' }}>
          <div className="kpi-icon"><i className="fa-solid fa-truck"></i></div>
          <div className="kpi-value">{caminhoesEmRota} / {banco.caminhoes.length}</div>
          <div className="kpi-label">Caminhões em Rota</div>
        </div>

        <div className="kpi-card" style={{ '--kpi-accent': itensCriticos ? '#ef4444' : '#8b5cf6' }}>
          <div className="kpi-icon"><i className="fa-solid fa-triangle-exclamation"></i></div>
          <div className="kpi-value">{itensCriticos}</div>
          <div className="kpi-label">
            Itens Vencendo (≤ {DIAS_ALERTA_VALIDADE}d)
            <span style={{ display: 'block', fontSize: '0.7rem', opacity: 0.75 }}>
              Perdas acumuladas: {perdasKg.toFixed(1)} kg
            </span>
          </div>
        </div>
      </div>

      {/* Alertas de Suprimento */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '12px'
          }}
        >
          <h3 style={{ fontSize: '1rem', margin: 0 }}>
            <i className="fa-solid fa-bullhorn" style={{ color: 'var(--cor-destaque)', marginRight: '8px' }}></i>
            Demandas Urgentes aos Produtores
          </h3>
          <button className="btn btn-warning btn-sm" onClick={onAbrirAlertModal}>
            <i className="fa-solid fa-plus"></i> Notificar Urgência
          </button>
        </div>

        {banco.demandasUrgentesProdutos.length === 0 ? (
          <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', margin: 0 }}>
            Nenhuma demanda aberta no momento.
          </p>
        ) : (
          <div className="grid-2">
            {banco.demandasUrgentesProdutos.map((demanda) => {
              const pct = Math.min(100, Math.round((demanda.kgAtendidos / demanda.kgSolicitados) * 100));
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
                    <span className={`badge ${demanda.status === 'CONCLUIDO' ? 'badge-success' : 'badge-warning'}`}>
                      {demanda.status === 'CONCLUIDO' ? 'Concluído' : 'Urgente'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--cor-texto-secundario)', marginBottom: '6px' }}>
                    {demanda.motivo}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                    <span>
                      Atendido: <strong>{demanda.kgAtendidos} / {demanda.kgSolicitados} kg</strong>
                    </span>
                    <span>{pct}%</span>
                  </div>
                  <div className="progress-bar-bg">
                    <div className="progress-bar-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid-2">
        {/* Rotas */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-map-location-dot"></i> Rotas dos Caminhões
            </h3>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Caminhão</th>
                  <th>Ponto</th>
                  <th>Status</th>
                  <th>Ação</th>
                </tr>
              </thead>
              <tbody>
                {banco.caminhoes.map((caminhao) => (
                  <tr key={caminhao.id}>
                    <td><strong>{caminhao.id}</strong></td>
                    <td>{caminhao.bairro}</td>
                    <td>
                      <span
                        className={`badge ${
                          caminhao.status === 'EM_ANDAMENTO'
                            ? 'badge-success'
                            : caminhao.status === 'ATRASADO_CHUVA'
                            ? 'badge-danger'
                            : 'badge-info'
                        }`}
                      >
                        {caminhao.status === 'EM_ANDAMENTO'
                          ? 'Em Rota'
                          : caminhao.status === 'ATRASADO_CHUVA'
                          ? 'Pausado (Chuva)'
                          : caminhao.status === 'CONCLUIDO'
                          ? 'Concluído'
                          : 'Agendado'}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-secondary btn-sm" onClick={() => onAbrirStatusModal(caminhao)}>
                        <i className="fa-solid fa-pen-to-square"></i> Status
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Estoque Central por lote */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title">
              <i className="fa-solid fa-boxes-packing"></i> Estoque Central (saída por validade)
            </h3>
            <span className="badge badge-success">{totalCentralKg.toFixed(0)} kg</span>
          </div>

          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Qtd.</th>
                  <th>Próximo lote a sair</th>
                </tr>
              </thead>
              <tbody>
                {estoque.map(({ produto, qtdKg, qtdLotes, loteProximaSaida, diasParaVencer, critico }) => (
                  <tr key={produto.id}>
                    <td>
                      <strong>{produto.nome}</strong>
                      {critico && qtdKg > 0 && (
                        <span className="badge badge-danger" style={{ marginLeft: '6px', fontSize: '0.65rem' }}>
                          <i className="fa-solid fa-triangle-exclamation"></i> Prioridade Saída
                        </span>
                      )}
                      <div style={{ fontSize: '0.7rem', color: 'var(--cor-texto-secundario)' }}>
                        {qtdLotes} lote{qtdLotes === 1 ? '' : 's'} em estoque
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${qtdKg > 0 ? 'badge-success' : 'badge-danger'}`}>{qtdKg} kg</span>
                    </td>
                    <td
                      style={{
                        fontSize: '0.8rem',
                        color: critico ? 'var(--cor-perigo)' : 'var(--cor-texto-secundario)'
                      }}
                    >
                      {loteProximaSaida ? (
                        <>
                          {loteProximaSaida.dataValidade}
                          <div style={{ fontSize: '0.7rem' }}>
                            {diasParaVencer < 0
                              ? `vencido há ${Math.abs(diasParaVencer)}d`
                              : `vence em ${diasParaVencer}d`}{' '}
                            · {loteProximaSaida.fornecedor}
                          </div>
                        </>
                      ) : (
                        'sem estoque'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Carregamento: a operação que liga o almoxarifado aos caminhões */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-dolly"></i> Carregar Caminhão (almoxarifado → rota)
          </h3>
        </div>

        <form onSubmit={handleCarregar} className="grid-4" style={{ alignItems: 'end' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Caminhão</label>
            <select
              className="form-control"
              value={carregamento.idCaminhao}
              onChange={(e) => setCarregamento((p) => ({ ...p, idCaminhao: e.target.value }))}
            >
              {banco.caminhoes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.id} — {c.bairro}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Produto</label>
            <select
              className="form-control"
              value={carregamento.idProduto}
              onChange={(e) => setCarregamento((p) => ({ ...p, idProduto: e.target.value }))}
            >
              {estoque.map(({ produto, qtdKg }) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome} ({qtdKg} kg)
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Quantidade (kg)</label>
            <input
              type="number"
              min="1"
              step="0.5"
              className="form-control"
              placeholder="ex: 100"
              value={carregamento.qtdKg}
              onChange={(e) => setCarregamento((p) => ({ ...p, qtdKg: e.target.value }))}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary">
            <i className="fa-solid fa-truck-ramp-box"></i> Carregar
          </button>
        </form>
      </div>

      {/* Taxas de conversão */}
      <div className="card" style={{ marginTop: '20px' }}>
        <div className="card-header">
          <h3 className="card-title">
            <i className="fa-solid fa-sliders"></i> Taxas de Conversão (material → 1 kg de alimento)
          </h3>
        </div>

        <div className="grid-3">
          {banco.materiais.map((material) => (
            <div
              key={material.id}
              style={{
                background: 'var(--cor-superficie-suave)',
                padding: '12px',
                borderRadius: 'var(--raio-p)',
                border: '1px solid var(--cor-borda)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <strong style={{ fontSize: '0.9rem' }}>
                  <i className={`fa-solid ${material.icone}`}></i> {material.nome}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                  ({material.unidade})
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  className="form-control"
                  value={taxasEditaveis[material.id] ?? material.qtdPorKgAlimento}
                  onChange={(e) =>
                    setTaxasEditaveis((p) => ({ ...p, [material.id]: e.target.value }))
                  }
                />
                <button className="btn btn-primary btn-sm" onClick={() => handleSalvarTaxa(material.id)}>
                  OK
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
