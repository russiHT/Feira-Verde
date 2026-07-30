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

const modulos = {
  admin: {
    titulo: 'Gestão e estoque',
    descricao: 'Controle operacional do programa',
    aba: 'Gestão'
  },
  operator: {
    titulo: 'Atendimento de troca',
    descricao: 'Terminal de pesagem e retirada',
    aba: 'Atendimento'
  },
  citizen: {
    titulo: 'Consulta do cidadão',
    descricao: 'Saldo, horários e histórico',
    aba: 'Cidadão'
  },
  producer: {
    titulo: 'Produtores rurais',
    descricao: 'Entregas e demandas abertas',
    aba: 'Produtores'
  }
};

export function App() {
  const banco = useAppState();
  const [perfilAtual, setPerfilAtual] = useState('admin');
  const modulo = modulos[perfilAtual];

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
      <header className="institutional-header">
        <div className="govbar">
          <span>Prefeitura Municipal</span>
          <span>Secretaria de Meio Ambiente</span>
        </div>

        <div className="masthead">
          <a href="#" className="brand-logo">
            <div className="brand-mark">FV</div>
            <div>
              <div className="brand-title">FeiraVerde Digital</div>
              <div className="brand-subtitle">Sistema de gestão do programa</div>
            </div>
          </a>

          <div className="masthead-actions">
            <span className="environment-label">Ambiente local</span>
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetar}
              title="Resetar banco de dados simulado"
            >
              Resetar base
            </button>
          </div>
        </div>

        <nav className="role-nav" aria-label="Módulos do sistema">
          {Object.entries(modulos).map(([id, item]) => (
            <button
              key={id}
              className={`role-btn ${perfilAtual === id ? 'active' : ''}`}
              onClick={() => setPerfilAtual(id)}
            >
              {item.aba}
            </button>
          ))}
        </nav>
      </header>

      <main className="main-content">
        <section className="module-header">
          <div>
            <div className="breadcrumb">FeiraVerde / {modulo.aba}</div>
            <h1>{modulo.titulo}</h1>
            <p>{modulo.descricao}</p>
          </div>

          <dl className="system-summary" aria-label="Resumo do sistema">
            <div>
              <dt>Caminhões</dt>
              <dd>{banco.caminhoes.length}</dd>
            </div>
            <div>
              <dt>Munícipes</dt>
              <dd>{banco.cidadaos.length}</dd>
            </div>
            <div>
              <dt>Alimentos</dt>
              <dd>{banco.produtos.length}</dd>
            </div>
          </dl>
        </section>

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
