import React, { useState, useEffect } from 'react';
import { appState } from '../estado';
import { utilitarios } from '../utilitarios';

export function StatusModal({ isOpen, onClose, caminhao }) {
  const [novoStatus, setNovoStatus] = useState('EM_ANDAMENTO');

  useEffect(() => {
    if (caminhao) {
      setNovoStatus(caminhao.status || 'EM_ANDAMENTO');
    }
  }, [caminhao]);

  if (!isOpen || !caminhao) return null;

  const handleSalvar = () => {
    const r = appState.atualizarStatusRota(caminhao.id, novoStatus);
    if (!r.ok) {
      utilitarios.mostrarNotificacao(r.erro, 'danger');
      return;
    }
    utilitarios.mostrarNotificacao(`Status do caminhão ${caminhao.id} atualizado.`, 'success');
    onClose();
  };

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cor-primaria)' }}>
            <i className="fa-solid fa-pen-to-square"></i> Atualizar rota
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div>
          <p style={{ fontSize: '0.85rem', color: 'var(--cor-texto-secundario)', marginBottom: '16px' }}>
            Selecione o novo status da rota do caminhão <strong>{caminhao.id}</strong> para atualização no mapa dos cidadãos.
          </p>

          <div className="form-group">
            <label className="form-label">Novo Status da Rota</label>
            <select
              className="form-control"
              value={novoStatus}
              onChange={(e) => setNovoStatus(e.target.value)}
            >
              <option value="EM_ANDAMENTO">Em Rota / No Ponto Agora</option>
              <option value="ATRASADO_CHUVA">Pausado por Chuva / Temporal</option>
              <option value="AGENDADO">Agendado / Próxima Parada</option>
              <option value="CONCLUIDO">Atendimento Concluído</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={handleSalvar}>
            <i className="fa-solid fa-floppy-disk"></i> Salvar
          </button>
        </div>
      </div>
    </div>
  );
}
