import React, { useState } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function AlertModal({ isOpen, onClose }) {
  const [produto, setProduto] = useState('cenoura');
  const [qtdKg, setQtdKg] = useState('400');
  const [motivo, setMotivo] = useState('Alta demanda no ponto de Uvaranas e Cará-Cará. Necessário reabastecimento do almoxarifado até as 17:00 de hoje.');

  if (!isOpen) return null;

  const handleDisparar = () => {
    if (!qtdKg || parseFloat(qtdKg) <= 0) {
      utilitarios.mostrarNotificacao('Informe uma quantidade válida em Kg!', 'danger');
      return;
    }
    appState.adicionarDemandaUrgenteProduto(produto, qtdKg, motivo);
    utilitarios.mostrarNotificacao('Alerta de demanda urgente transmitido para os produtores rurais!', 'warning');
    onClose();
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cor-destaque)' }}>
            <i className="fa-solid fa-bullhorn"></i> Emitir Alerta de Demanda Urgente de Hortifrúti
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginBottom: '16px' }}>
            Selecione o produto que está em escassez nos caminhões ou no almoxarifado central. Este alerta será transmitido imediatamente para o portal dos Produtores Rurais e Cooperativas.
          </p>

          <div className="form-group">
            <label className="form-label">Produto Necessário em Urgência</label>
            <select
              className="form-control"
              value={produto}
              onChange={(e) => setProduto(e.target.value)}
            >
              <option value="tomate">Tomate Orgânico</option>
              <option value="batata">Batata Inglesa</option>
              <option value="cenoura">Cenoura Fresca</option>
              <option value="alface">Alface Crespa (Maço)</option>
              <option value="maca">Maçã Gala</option>
              <option value="ovos">Ovos Caipira (Dúzia)</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Quantidade Solicitada (kg)</label>
            <input
              type="number"
              className="form-control"
              value={qtdKg}
              min="10"
              onChange={(e) => setQtdKg(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Motivo da Urgência / Instrução para os Produtores</label>
            <textarea
              className="form-control"
              rows={3}
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-warning"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#fff' }}
            onClick={handleDisparar}
          >
            <i className="fa-solid fa-paper-plane"></i> Disparar Alerta para os Produtores
          </button>
        </div>
      </div>
    </div>
  );
}
