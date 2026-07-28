/* FeiraVerde Digital - Funções Utilitárias & Auxiliares de UI */

window.utilitarios = {
  // Notificações Flutuantes (Toasts)
  mostrarNotificacao(mensagem, tipo = 'success') {
    let meucarter = document.querySelector('.toast-container');
    if (!meucarter) {
      meucarter = document.createElement('div');
      meucarter.className = 'toast-container';
      document.body.appendChild(meucarter);
    }

    const cartaoToast = document.createElement('div');
    cartaoToast.className = `toast ${tipo}`;
    
    let icone = 'fa-circle-check';
    if (tipo === 'danger') icone = 'fa-triangle-exclamation';
    if (tipo === 'warning') icone = 'fa-bell';

    cartaoToast.innerHTML = `
      <i class="fa-solid ${icone}"></i>
      <div>
        <div style="font-weight:700; font-size:0.9rem;">FeiraVerde Digital</div>
        <div style="font-size:0.85rem; color:#cbd5e1;">${mensagem}</div>
      </div>
    `;

    meucarter.appendChild(cartaoToast);

    setTimeout(() => {
      cartaoToast.style.opacity = '0';
      cartaoToast.style.transform = 'translateX(100%)';
      cartaoToast.style.transition = 'all 0.3s ease';
      setTimeout(() => cartaoToast.remove(), 300);
    }, 4000);
  },

  // Controle de Modais
  abrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.add('active');
  },

  fecharModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.remove('active');
  },

  // Formatadores
  formatarPeso(val, unidade = 'kg') {
    return `${parseFloat(val || 0).toFixed(1)} ${unidade}`;
  },

  formatarMoeda(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  },

  // Gerador do Comprovante Digital em HTML
  gerarHtmlRecibo(tx) {
    const listaReciclaveis = Object.entries(tx.reciclaveis)
      .map(([id, val]) => {
        const itemObj = window.appState.banco.taxasConversao.find(r => r.id === id);
        return `<li><span>${itemObj ? itemObj.nome : id}:</span> <strong>${val} ${itemObj ? itemObj.unidade : 'kg'}</strong></li>`;
      }).join('');

    const listaAlimentos = Object.entries(tx.alimentosRetirados)
      .map(([id, qtd]) => {
        const itemObj = window.appState.banco.estoqueCentral.find(s => s.id === id);
        return `<li><span>${itemObj ? itemObj.nome : id}:</span> <strong>${qtd} kg</strong></li>`;
      }).join('');

    return `
      <div style="font-family: monospace; background: #ffffff; color: #1e293b; padding: 24px; border-radius: 12px; border: 2px dashed #94a3b8; max-width: 420px; margin: 0 auto;">
        <div style="text-align: center; border-bottom: 2px solid #000; padding-bottom: 12px; margin-bottom: 12px;">
          <h3 style="font-size: 1.2rem; font-weight: 800; margin: 0;">PREFEITURA MUNICIPAL</h3>
          <p style="font-size: 0.85rem; margin: 2px 0;">Programa Feira Verde Digital</p>
          <p style="font-size: 0.75rem; color: #64748b;">Comprovante de Troca Social</p>
        </div>
        
        <div style="font-size: 0.8rem; margin-bottom: 12px;">
          <p><strong>Nº Transação:</strong> ${tx.id}</p>
          <p><strong>Data/Hora:</strong> ${tx.dataHora}</p>
          <p><strong>Munícipe:</strong> ${tx.nomeCidadao}</p>
          <p><strong>CPF:</strong> ***.${tx.cpfCidadao.substr(4,7)}-**</p>
          <p><strong>Local/Ponto:</strong> ${tx.bairro} (${tx.idCaminhao})</p>
        </div>

        <div style="border-top: 1px dashed #cbd5e1; border-bottom: 1px dashed #cbd5e1; padding: 10px 0; margin-bottom: 12px;">
          <p style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;"><i class="fa-solid fa-arrows-rotate"></i> RECICLÁVEIS ENTREGUES:</p>
          <ul style="list-style: none; padding-left: 0; font-size: 0.8rem; line-height: 1.6;">
            ${listaReciclaveis}
          </ul>
          <p style="text-align: right; font-weight: 800; font-size: 0.9rem; color: #047857; margin-top: 4px;">
            Crédito Gerado: +${tx.kgAlimentoGerado.toFixed(1)} kg de Alimento
          </p>
        </div>

        <div style="border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; margin-bottom: 12px;">
          <p style="font-weight: 700; font-size: 0.85rem; margin-bottom: 4px;"><i class="fa-solid fa-basket-shopping"></i> HORTIFRÚTI RETIRADO:</p>
          <ul style="list-style: none; padding-left: 0; font-size: 0.8rem; line-height: 1.6;">
            ${listaAlimentos}
          </ul>
          <p style="text-align: right; font-weight: 800; font-size: 0.9rem; color: #b45309; margin-top: 4px;">
            Alimentos Entregues: ${tx.kgAlimentoGasto.toFixed(1)} kg
          </p>
        </div>

        <div style="text-align: center; font-size: 0.75rem; color: #475569; margin-top: 16px;">
          <p>Obrigado por contribuir com a preservação ambiental!</p>
          <p style="font-size: 0.65rem; margin-top: 4px;">Autenticado digitalmente via Gov.br / SisFeiraVerde</p>
        </div>
      </div>
    `;
  }
};

// Manter alias retrocompatível para evitar quebras
window.utils = window.utilitarios;
