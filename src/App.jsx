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

const perfis = {
  admin: {
    icone: 'fa-chart-line',
    titulo: 'Gestão & Estoque',
    descricao: 'Secretaria Municipal de Meio Ambiente',
    aba: 'Gestão'
  },
  operator: {
    icone: 'fa-cash-register',
    titulo: 'PDV de Troca',
    descricao: 'Atendimento em rota',
    aba: 'PDV Troca'
  },
  citizen: {
    icone: 'fa-id-card',
    titulo: 'Área do Cidadão',
    descricao: 'Consulta do munícipe',
    aba: 'Cidadão'
  },
  producer: {
    icone: 'fa-tractor',
    titulo: 'Produtores',
    descricao: 'Agricultura familiar',
    aba: 'Produtores'
  }
};

export function App() {
  const banco = useAppState();
  const [perfilAtual, setPerfilAtual] = useState('admin');
  const perfil = perfis[perfilAtual];

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
    <div className="app-shell">
      <aside className="app-sidebar">
        <a href="#" className="brand-logo">
          <div className="brand-icon">
            <i className="fa-solid fa-leaf"></i>
          </div>
          <div>
            <div className="brand-title">FeiraVerde Digital</div>
            <div className="brand-subtitle">Programa municipal</div>
          </div>
        </a>

        <nav className="role-nav" aria-label="Módulos do sistema">
          {Object.entries(perfis).map(([id, item]) => (
            <button
              key={id}
              className={`role-btn ${perfilAtual === id ? 'active' : ''}`}
              onClick={() => setPerfilAtual(id)}
            >
              <i className={`fa-solid ${item.icone}`}></i>
              <span>{item.aba}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="system-chip">
            <span className="status-dot"></span>
            Dados locais ativos
          </div>
          <button
            className="btn btn-secondary btn-sm btn-block"
            onClick={handleResetar}
            title="Resetar Banco de Dados Simulado"
          >
            <i className="fa-solid fa-rotate-left"></i> Resetar base
          </button>
        </div>
      </aside>

      <div className="app-workspace">
        <header className="topbar">
          <div>
            <div className="breadcrumb">FeiraVerde / {perfil.aba}</div>
            <h1>{perfil.titulo}</h1>
            <p>{perfil.descricao}</p>
          </div>

          <div className="topbar-metrics" aria-label="Resumo do sistema">
            <div>
              <strong>{banco.caminhoes.length}</strong>
              <span>Caminhões</span>
            </div>
            <div>
              <strong>{banco.cidadaos.length}</strong>
              <span>Munícipes</span>
            </div>
            <div>
              <strong>{banco.produtos.length}</strong>
              <span>Alimentos</span>
            </div>
          </div>
        </header>

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
            {perfilAtual === 'citizen' && <CidadaoComponent banco={banco} />}
            {perfilAtual === 'producer' && <ProdutorComponent banco={banco} />}
          </div>
        </main>
      </div>

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
