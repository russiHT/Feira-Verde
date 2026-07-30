import React, { useState } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function AlertModal({ isOpen, onClose, banco }) {
  const [idProduto, setIdProduto] = useState(() => banco.produtos[0]?.id || '');
  const [qtdKg, setQtdKg] = useState('400');
  const [motivo, setMotivo] = useState(
    'Alta demanda nos pontos de Uvaranas e Cará-Cará. Necessário reabastecimento do almoxarifado até as 17:00 de hoje.'
  );

  if (!isOpen) return null;

  const handleDisparar = () => {
    const r = appState.adicionarDemandaUrgente({
      idProduto,
      kgSolicitados: parseFloat(qtdKg),
      motivo
    });

    if (!r.ok) {
      utilitarios.mostrarNotificacao(r.erro, 'danger');
      return;
    }

    utilitarios.mostrarNotificacao('Demanda transmitida aos produtores rurais.', 'warning');
    onClose();
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cor-destaque)' }}>
            <i className="fa-solid fa-bullhorn"></i> Emitir Demanda Urgente de Hortifrúti
          </h3>
          <button className="modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginBottom: '16px' }}>
            Selecione o produto em escassez. O pedido aparece imediatamente no portal dos Produtores
            Rurais e Cooperativas.
          </p>

          <div className="form-group">
            <label className="form-label">Produto Necessário</label>
            <select className="form-control" value={idProduto} onChange={(e) => setIdProduto(e.target.value)}>
              {banco.produtos.map((produto) => (
                <option key={produto.id} value={produto.id}>
                  {produto.nome}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantidade Solicitada (kg)</label>
            <input
              type="number"
              className="form-control"
              value={qtdKg}
              min="10"
              step="10"
              onChange={(e) => setQtdKg(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo / Instrução aos Produtores</label>
            <textarea
              className="form-control"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button
            className="btn btn-warning"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
            onClick={handleDisparar}
          >
            <i className="fa-solid fa-paper-plane"></i> Disparar Demanda
          </button>
        </div>
      </div>
    </div>
  );
}
