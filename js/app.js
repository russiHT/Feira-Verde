/* FeiraVerde Digital - Controlador Principal da Aplicação */

document.addEventListener('DOMContentLoaded', () => {
  // Inscrever a interface do usuário nas atualizações de estado
  window.appState.inscrever((banco) => {
    renderizarVisaoAtual(banco);
  });

  // Navegação do Seletor de Perfis
  const botoesPerfil = document.querySelectorAll('.role-btn');
  botoesPerfil.forEach(botao => {
    botao.addEventListener('click', () => {
      const perfilAlvo = botao.getAttribute('data-role');
      
      botoesPerfil.forEach(b => b.classList.remove('active'));
      botao.classList.add('active');

      window.appState.perfilAtual = perfilAlvo;
      renderizarVisaoAtual(window.appState.banco);
    });
  });

  // Renderização Inicial
  renderizarVisaoAtual(window.appState.banco);
});

function renderizarVisaoAtual(banco) {
  const conteiner = document.getElementById('view-container');
  if (!conteiner) return;

  const perfil = window.appState.perfilAtual;

  if (perfil === 'admin') {
    conteiner.innerHTML = window.componenteAdmin.render(banco);
  } else if (perfil === 'operator') {
    conteiner.innerHTML = window.componenteOperador.render(banco);
  } else if (perfil === 'citizen') {
    conteiner.innerHTML = window.componenteCidadao.render(banco);
  } else if (perfil === 'producer') {
    conteiner.innerHTML = window.componenteProdutor.render(banco);
  }
}
