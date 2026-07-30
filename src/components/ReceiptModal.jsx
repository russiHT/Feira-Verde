import React from 'react';
import { utilitarios } from '../utilitarios';

export function ReceiptModal({ isOpen, onClose, transacao, banco }) {
  if (!isOpen || !transacao) return null;

  const listaReciclaveis = Object.entries(transacao.reciclaveis || {}).map(([id, val]) => {
    const itemObj = banco?.taxasConversao?.find(r => r.id === id);
    return {
      id,
      nome: itemObj ? itemObj.nome : id,
      val,
      unidade: itemObj ? itemObj.unidade : 'kg'
    };
  });

  const listaAlimentos = Object.entries(transacao.alimentosRetirados || {}).map(([id, qtd]) => {
    const itemObj = banco?.estoqueCentral?.find(s => s.id === id);
    return {
      id,
      nome: itemObj ? itemObj.nome : id,
      qtd
    };
  });

  return (
    <div className="modal-overlay active">
      <div className="modal-box">
        <div className="modal-header">
          <h3 style={{ margin: 0, fontSize: '1.2rem', color: 'var(--cor-primaria)' }}>
            <i className="fa-solid fa-receipt"></i> Comprovante Digital da Troca
          </h3>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>

        <div id="receipt-modal-content">
          <div style={{
            fontFamily: 'monospace',
            background: '#ffffff',
            color: '#1e293b',
            padding: '24px',
            borderRadius: '12px',
            border: '2px dashed #94a3b8',
            maxWidth: '420px',
            margin: '0 auto'
          }}>
            <div style={{ textAlign: 'center', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0 }}>PREFEITURA MUNICIPAL</h3>
              <p style={{ fontSize: '0.85rem', margin: '2px 0' }}>Programa Feira Verde Digital</p>
              <p style={{ fontSize: '0.75rem', color: '#64748b' }}>Comprovante de Troca Social</p>
            </div>
            
            <div style={{ fontSize: '0.8rem', marginBottom: '12px' }}>
              <p><strong>Nº Transação:</strong> {transacao.id}</p>
              <p><strong>Data/Hora:</strong> {transacao.dataHora}</p>
              <p><strong>Munícipe:</strong> {transacao.nomeCidadao}</p>
              <p><strong>CPF:</strong> ***.{transacao.cpfCidadao ? transacao.cpfCidadao.substr(4, 7) : '***.***'}-**</p>
              <p><strong>Local/Ponto:</strong> {transacao.bairro} ({transacao.idCaminhao})</p>
            </div>

            <div style={{ borderTop: '1px dashed #cbd5e1', borderBottom: '1px dashed #cbd5e1', padding: '10px 0', marginBottom: '12px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                <i className="fa-solid fa-arrows-rotate"></i> RECICLÁVEIS ENTREGUES:
              </p>
              <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.8rem', lineHeight: '1.6' }}>
                {listaReciclaveis.map(item => (
                  <li key={item.id}>
                    <span>{item.nome}:</span> <strong>{item.val} {item.unidade}</strong>
                  </li>
                ))}
              </ul>
              <p style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: '#047857', marginTop: '4px' }}>
                Crédito Gerado: +{utilitarios.formatarPeso(transacao.kgAlimentoGerado, 'kg')} de Alimento
              </p>
            </div>

            <div style={{ borderBottom: '1px dashed #cbd5e1', paddingBottom: '10px', marginBottom: '12px' }}>
              <p style={{ fontWeight: 700, fontSize: '0.85rem', marginBottom: '4px' }}>
                <i className="fa-solid fa-basket-shopping"></i> HORTIFRÚTI RETIRADO:
              </p>
              <ul style={{ listStyle: 'none', paddingLeft: 0, fontSize: '0.8rem', lineHeight: '1.6' }}>
                {listaAlimentos.map(item => (
                  <li key={item.id}>
                    <span>{item.nome}:</span> <strong>{item.qtd} kg</strong>
                  </li>
                ))}
              </ul>
              <p style={{ textAlign: 'right', fontWeight: 800, fontSize: '0.9rem', color: '#b45309', marginTop: '4px' }}>
                Alimentos Entregues: {utilitarios.formatarPeso(transacao.kgAlimentoGasto, 'kg')}
              </p>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginTop: '16px' }}>
              <p>Obrigado por contribuir com a preservação ambiental!</p>
              <p style={{ fontSize: '0.65rem', marginTop: '4px' }}>Autenticado digitalmente via Gov.br / SisFeiraVerde</p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => window.print()}>
            <i className="fa-solid fa-print"></i> Imprimir Recibo
          </button>
          <button className="btn btn-primary" onClick={onClose}>
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
}
