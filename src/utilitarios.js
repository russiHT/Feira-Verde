export const utilitarios = {
  /** Notificações flutuantes (toasts). */
  mostrarNotificacao(mensagem, tipo = 'success') {
    let container = document.querySelector('.toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;

    let icone = 'fa-circle-check';
    if (tipo === 'danger') icone = 'fa-triangle-exclamation';
    if (tipo === 'warning') icone = 'fa-bell';

    // textContent em vez de innerHTML: a mensagem pode conter dado de entrada.
    const iconeElem = document.createElement('i');
    iconeElem.className = `fa-solid ${icone}`;

    const wrapper = document.createElement('div');

    const titulo = document.createElement('div');
    titulo.style.fontWeight = '700';
    titulo.style.fontSize = '0.9rem';
    titulo.textContent = 'FeiraVerde Digital';

    const corpo = document.createElement('div');
    corpo.style.fontSize = '0.85rem';
    corpo.style.color = '#cbd5e1';
    corpo.textContent = mensagem;

    wrapper.append(titulo, corpo);
    toast.append(iconeElem, wrapper);
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  /**
   * Mascara CPF para exibição. Enquanto o dado ainda vive no navegador,
   * ao menos nunca aparece inteiro na tela nem em impressão.
   */
  mascararCpf(cpf) {
    if (!cpf) return '***.***.***-**';
    const digitos = String(cpf).replace(/\D/g, '');
    if (digitos.length !== 11) return '***.***.***-**';
    return `***.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-**`;
  },

  formatarPeso(valor, unidade = 'kg') {
    return `${(parseFloat(valor) || 0).toFixed(1)} ${unidade}`;
  },

  formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }
};
