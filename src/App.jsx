import React, { useState } from 'react';
import { appState } from './estado';
import { useAppState } from './useAppState';
import { utilitarios } from './utilitarios';
import { AdminComponent } from './components/Admin';
import { OperadorComponent } from './components/Operador';
import { CidadaoComponent } from './components/Cidadao';
import { ProdutorComponent } from './components/Produtor';
import { ReceiptModal } from './components/ReceiptModal';
import { StatusModal } from './components/StatusModal';
import { AlertModal } from './components/AlertModal';

export function App() {
  const banco = useAppState();
  const [perfilAtual, setPerfilAtual] = useState('admin');

  const [reciboModalOpen, setReciboModalOpen] = useState(false);
  const [transacaoRecibo, setTransacaoRecibo] = useState(null);

  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [caminhaoSelecionadoStatus, setCaminhaoSelecionadoStatus] = useState(null);

  const [alertModalOpen, setAlertModalOpen] = useState(false);

  const handleResetar = () => {
    if (window.confirm('Resetar o banco de dados simulado? Todo o histórico local será perdido.')) {
      appState.resetar();
      utilitarios.mostrarNotificacao('Dados reinicializados.', 'success');
    }
  };

  const handleAbrirStatusModal = (caminhao) => {
    setCaminhaoSelecionadoStatus(caminhao);
    setStatusModalOpen(true);
  };

  const handleFinalizarTransacaoOperador = (tx) => {
    setTransacaoRecibo(tx);
    setReciboModalOpen(true);
  };

  return (
    <div>
      <header className="app-header">
        <div className="header-container">
          <a href="#" className="brand-logo">
            <div className="brand-icon">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <div>
              <div className="brand-title">FeiraVerde <span>Digital</span></div>
            </div>
          </a>

          {/* Perfis / Funcionalidades do MVP */}
          <nav className="role-nav">
            <button
              className={`role-btn ${perfilAtual === 'admin' ? 'active' : ''}`}
              onClick={() => setPerfilAtual('admin')}
            >
              <i className="fa-solid fa-chart-line"></i> Gestão & Estoque
            </button>
            <button
              className={`role-btn ${perfilAtual === 'operator' ? 'active' : ''}`}
              onClick={() => setPerfilAtual('operator')}
            >
              <i className="fa-solid fa-truck-front"></i> PDV Troca
            </button>
            <button
              className={`role-btn ${perfilAtual === 'citizen' ? 'active' : ''}`}
              onClick={() => setPerfilAtual('citizen')}
            >
              <i className="fa-solid fa-user"></i> Cidadão
            </button>
            <button
              className={`role-btn ${perfilAtual === 'producer' ? 'active' : ''}`}
              onClick={() => setPerfilAtual('producer')}
            >
              <i className="fa-solid fa-wheat-awn"></i> Produtores & Alertas
            </button>
          </nav>

          <button
            className="btn btn-secondary btn-sm"
            onClick={handleResetar}
            title="Resetar Banco de Dados Simulado"
          >
            <i className="fa-solid fa-rotate-left"></i> Resetar
          </button>
        </div>
      </header>

      {/* Conteúdo da Visão Atual */}
      <main className="main-content">
        <div id="view-container">
          {perfilAtual === 'admin' && (
            <AdminComponent
              banco={banco}
              onAbrirStatusModal={handleAbrirStatusModal}
              onAbrirAlertModal={() => setAlertModalOpen(true)}
            />
          )}
          {perfilAtual === 'operator' && (
            <OperadorComponent
              banco={banco}
              onFinalizarTransacao={handleFinalizarTransacaoOperador}
            />
          )}
          {perfilAtual === 'citizen' && (
            <CidadaoComponent
              banco={banco}
            />
          )}
          {perfilAtual === 'producer' && (
            <ProdutorComponent
              banco={banco}
            />
          )}
        </div>
      </main>

      {/* Modais JSX */}
      <ReceiptModal
        isOpen={reciboModalOpen}
        onClose={() => setReciboModalOpen(false)}
        transacao={transacaoRecibo}
        banco={banco}
      />

      <StatusModal
        isOpen={statusModalOpen}
        onClose={() => setStatusModalOpen(false)}
        caminhao={caminhaoSelecionadoStatus}
      />

      <AlertModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        banco={banco}
      />
    </div>
  );
}
