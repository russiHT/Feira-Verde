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
    descricao:
      'Painel operacional para acompanhar rotas, almoxarifado, validade dos lotes e demandas aos produtores.',
    aba: 'Gestão'
  },
  operator: {
    icone: 'fa-truck-front',
    titulo: 'PDV de Troca',
    descricao:
      'Terminal do caminhão para pesar recicláveis, entregar hortifrúti e emitir comprovante digital.',
    aba: 'PDV'
  },
  citizen: {
    icone: 'fa-user',
    titulo: 'Área do Cidadão',
    descricao:
      'Consulta de saldo, simulação de troca, horários dos caminhões e histórico do munícipe.',
    aba: 'Cidadão'
  },
  producer: {
    icone: 'fa-wheat-awn',
    titulo: 'Produtores & Alertas',
    descricao:
      'Portal para atender pedidos urgentes da prefeitura e registrar entregas da agricultura familiar.',
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
    if (window.confirm('Resetar o banco de dados simulado? Todo o historico local sera perdido.')) {
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
      <header className="app-header">
        <div className="header-container">
          <a href="#" className="brand-logo">
            <div className="brand-icon">
              <i className="fa-solid fa-leaf"></i>
            </div>
            <div>
              <div className="brand-title">
                FeiraVerde <span>Digital</span>
              </div>
              <div className="brand-subtitle">Troca de recicláveis por alimentos</div>
            </div>
          </a>

          <nav className="role-nav">
            {Object.entries(perfis).map(([id, item]) => (
              <button
                key={id}
                className={`role-btn ${perfilAtual === id ? 'active' : ''}`}
                onClick={() => setPerfilAtual(id)}
              >
                <i className={`fa-solid ${item.icone}`}></i> {item.aba}
              </button>
            ))}
          </nav>

          <div className="header-actions">
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleResetar}
              title="Resetar Banco de Dados Simulado"
            >
              <i className="fa-solid fa-rotate-left"></i> Resetar
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="page-intro">
          <div>
            <div className="page-kicker">
              <i className={`fa-solid ${perfil.icone}`}></i>
              Sistema municipal em operação
            </div>
            <h1>{perfil.titulo}</h1>
            <p>{perfil.descricao}</p>
          </div>

          <div className="page-stats" aria-label="Resumo do sistema">
            <div className="stat-pill">
              <strong>{banco.caminhoes.length}</strong>
              <span>caminhões</span>
            </div>
            <div className="stat-pill">
              <strong>{banco.cidadaos.length}</strong>
              <span>munícipes</span>
            </div>
            <div className="stat-pill">
              <strong>{banco.produtos.length}</strong>
              <span>alimentos</span>
            </div>
          </div>
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
