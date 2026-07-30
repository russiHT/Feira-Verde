export const utilitarios = {
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

    // Criar elementos DOM com textContent para garantir escaping
    const iconElem = document.createElement('i');
    iconElem.className = `fa-solid ${icone}`;

    const textWrapper = document.createElement('div');
    const titleElem = document.createElement('div');
    titleElem.style.fontWeight = '700';
    titleElem.style.fontSize = '0.9rem';
    titleElem.textContent = 'FeiraVerde Digital';

    const msgElem = document.createElement('div');
    msgElem.style.fontSize = '0.85rem';
    msgElem.style.color = '#cbd5e1';
    msgElem.textContent = mensagem;

    textWrapper.appendChild(titleElem);
    textWrapper.appendChild(msgElem);

    cartaoToast.appendChild(iconElem);
    cartaoToast.appendChild(textWrapper);

    meucarter.appendChild(cartaoToast);

    setTimeout(() => {
      cartaoToast.style.opacity = '0';
      cartaoToast.style.transform = 'translateX(100%)';
      cartaoToast.style.transition = 'all 0.3s ease';
      setTimeout(() => cartaoToast.remove(), 300);
    }, 4000);
  },

  // Formatadores
  formatarPeso(val, unidade = 'kg') {
    return `${parseFloat(val || 0).toFixed(1)} ${unidade}`;
  },

  formatarMoeda(val) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);
  }
};
