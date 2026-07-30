import React, { useMemo, useState } from 'react';
import { appState, cargaPorProduto, creditoDeReciclaveis } from '../estado';
import { utilitarios } from '../utilitarios';

const zerado = (ids) => Object.fromEntries(ids.map((id) => [id, 0]));

export function OperadorComponent({ banco, onFinalizarTransacao }) {
  const [idCaminhaoSelecionado, setIdCaminhaoSelecionado] = useState(
    () => banco.caminhoes[0]?.id || ''
  );
  const [cpfCidadao, setCpfCidadao] = useState(() => banco.cidadaos[0]?.cpf || '');

  const [reciclaveis, setReciclaveis] = useState(() => zerado(banco.materiais.map((m) => m.id)));
  const [retiradas, setRetiradas] = useState(() => zerado(banco.produtos.map((p) => p.id)));

  const caminhaoAtual =
    banco.caminhoes.find((t) => t.id === idCaminhaoSelecionado) || banco.caminhoes[0] || null;
  const cidadao = banco.cidadaos.find((c) => c.cpf === cpfCidadao) || banco.cidadaos[0] || null;

  const carga = useMemo(
    () => (caminhaoAtual ? cargaPorProduto(banco, caminhaoAtual.id) : {}),
    [banco, caminhaoAtual]
  );

  const kgAlimentoGerado = creditoDeReciclaveis(banco, reciclaveis);
  const kgAlimentoGasto = Object.values(retiradas).reduce((s, v) => s + v, 0);

  if (!caminhaoAtual || !cidadao) {
    return (
      <div className="card">
        <p style={{ color: 'var(--cor-texto-secundario)' }}>
          É preciso ao menos um caminhão e um munícipe cadastrados para operar o PDV.
        </p>
      </div>
    );
  }

  const saldoDisponivel = Math.max(
    0,
    cidadao.saldoAlimentoKg + kgAlimentoGerado - kgAlimentoGasto
  );

  const handleAtualizarPeso = (idMaterial, val) => {
    setReciclaveis((prev) => ({ ...prev, [idMaterial]: Math.max(0, parseFloat(val) || 0) }));
  };

  const handleAlterarRetirada = (idProduto, delta) => {
    const atual = retiradas[idProduto] || 0;
    const proximo = Math.max(0, atual + delta);
    const disponivelNoCaminhao = carga[idProduto] || 0;

    if (proximo > disponivelNoCaminhao) {
      utilitarios.mostrarNotificacao(
        `Estoque do caminhão insuficiente (disponível: ${disponivelNoCaminhao} kg).`,
        'danger'
      );
      return;
    }

    if (delta > 0) {
      const totalGasto = Object.entries(retiradas).reduce(
        (s, [id, qtd]) => s + (id === idProduto ? proximo : qtd),
        0
      );
      if (cidadao.saldoAlimentoKg + kgAlimentoGerado - totalGasto < 0) {
        utilitarios.mostrarNotificacao('Saldo do munícipe atingido. Pese mais recicláveis.', 'warning');
        return;
      }
    }

    setRetiradas((prev) => ({ ...prev, [idProduto]: proximo }));
  };

  const handleFinalizar = () => {
    const resultado = appState.registrarTroca({
      cpfCidadao: cidadao.cpf,
      idCaminhao: caminhaoAtual.id,
      reciclaveis,
      alimentosRetirados: retiradas
    });

    if (!resultado.ok) {
      utilitarios.mostrarNotificacao(resultado.erro, 'danger');
      return;
    }

    setReciclaveis(zerado(banco.materiais.map((m) => m.id)));
    setRetiradas(zerado(banco.produtos.map((p) => p.id)));

    utilitarios.mostrarNotificacao(`Troca ${resultado.transacao.id} concluída!`, 'success');
    onFinalizarTransacao(resultado.transacao);
  };

  return (
    <div>
      {/* Seletor de Caminhão */}
      <div
        style={{
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <i className="fa-solid fa-truck-front" style={{ fontSize: '20px', color: 'var(--cor-primaria)' }}></i>
          <div>
            <strong style={{ fontSize: '1rem' }}>Terminal Caminhão: {caminhaoAtual.id}</strong>
            <span style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginLeft: '10px' }}>
              ({caminhaoAtual.bairro})
            </span>
          </div>
        </div>

        <select
          className="form-control"
          style={{ width: 'auto' }}
          value={caminhaoAtual.id}
          onChange={(e) => setIdCaminhaoSelecionado(e.target.value)}
        >
          {banco.caminhoes.map((t) => (
            <option key={t.id} value={t.id}>
              {t.id} - {t.bairro}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-2">
        <div>
          {/* Passo 1: Munícipe */}
          <div className="card" style={{ marginBottom: '16px' }}>
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-user"></i> 1. Munícipe
              </h3>
            </div>

            <div className="form-group" style={{ marginBottom: '10px' }}>
              <select
                className="form-control"
                value={cidadao.cpf}
                onChange={(e) => setCpfCidadao(e.target.value)}
              >
                {banco.cidadaos.map((c) => (
                  <option key={c.cpf} value={c.cpf}>
                    {c.nome} — Saldo: {c.saldoAlimentoKg.toFixed(1)} kg
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                background: 'var(--cor-superficie-suave)',
                padding: '10px 14px',
                borderRadius: 'var(--raio-p)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>{cidadao.nome}</span>
              <strong style={{ color: 'var(--cor-primaria)' }}>
                Saldo: {cidadao.saldoAlimentoKg.toFixed(1)} kg
              </strong>
            </div>
          </div>

          {/* Passo 2: Pesagem */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">
                <i className="fa-solid fa-scale-balanced"></i> 2. Entradas (Recicláveis)
              </h3>
              <span className="badge badge-success">+{kgAlimentoGerado.toFixed(1)} kg Alimento</span>
            </div>

            <div className="grid-2">
              {banco.materiais.map((material) => (
                <div
                  key={material.id}
                  style={{
                    background: 'var(--cor-superficie-suave)',
                    border: '1px solid var(--cor-borda)',
                    padding: '10px',
                    borderRadius: 'var(--raio-p)'
                  }}
                >
                  <div style={{ fontSize: '0.8rem', marginBottom: '2px', fontWeight: 600 }}>
                    <i className={`fa-solid ${material.icone}`}></i> {material.nome}
                  </div>
                  <div
                    style={{
                      fontSize: '0.7rem',
                      color: 'var(--cor-texto-secundario)',
                      marginBottom: '6px'
                    }}
                  >
                    {material.qtdPorKgAlimento} {material.unidade} = 1 kg
                  </div>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    className="form-control"
                    value={reciclaveis[material.id] || ''}
                    placeholder={`0.0 ${material.unidade}`}
                    onChange={(e) => handleAtualizarPeso(material.id, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Passo 3: Cesta & Finalizar */}
        <div>
          <div
            className="card"
            style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
          >
            <div>
              <div className="card-header">
                <h3 className="card-title">
                  <i className="fa-solid fa-basket-shopping"></i> 3. Saída (Hortifrúti)
                </h3>
                <span className="badge badge-info">Disponível: {saldoDisponivel.toFixed(1)} kg</span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {banco.produtos.map((produto) => {
                  const disponivel = carga[produto.id] || 0;
                  const selecionado = retiradas[produto.id] || 0;

                  return (
                    <div
                      key={produto.id}
                      style={{
                        background: 'var(--cor-superficie-suave)',
                        border: '1px solid var(--cor-borda)',
                        padding: '10px 14px',
                        borderRadius: 'var(--raio-p)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        opacity: disponivel > 0 ? 1 : 0.5
                      }}
                    >
                      <div>
                        <strong>{produto.nome}</strong>
                        <div style={{ fontSize: '0.75rem', color: 'var(--cor-texto-secundario)' }}>
                          No caminhão: {disponivel} kg
                        </div>
                      </div>

                      <div className="counter-box">
                        <button className="btn-counter" onClick={() => handleAlterarRetirada(produto.id, -1)}>
                          -
                        </button>
                        <span style={{ fontWeight: 800, minWidth: '32px', textAlign: 'center' }}>
                          {selecionado} kg
                        </span>
                        <button className="btn-counter" onClick={() => handleAlterarRetirada(produto.id, 1)}>
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Finalizar */}
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                border: '1px solid var(--cor-borda-destaque)',
                padding: '16px',
                borderRadius: 'var(--raio-m)'
              }}
            >
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
                disabled={kgAlimentoGerado === 0 && kgAlimentoGasto === 0}
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
