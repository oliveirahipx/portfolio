// Comportamento da versão estática: login, cadastro e envio de foto, que no
// projeto original iam para o Express, são respondidos aqui no navegador.
(function () {
  const CONTA = { email: 'leitora@exemplo.com', senha: 'demo123' };
  const NAO_SALVA = 'Na demonstração os dados não são salvos.';
  const CHAVE = 'ceilandia-times-demo-login';

  function logado() {
    try { return sessionStorage.getItem(CHAVE) === '1'; } catch (e) { return true; }
  }

  // Como no original, o perfil só abre com login.
  if (document.documentElement.dataset.pagina === 'perfil' && !logado()) {
    location.replace('login.html');
    return;
  }

  function aviso(texto) {
    let caixa = document.getElementById('demo-aviso');
    if (!caixa) {
      caixa = document.createElement('div');
      caixa.id = 'demo-aviso';
      caixa.setAttribute('role', 'status');
      document.body.appendChild(caixa);
    }
    caixa.textContent = texto;
    caixa.classList.add('visivel');
    clearTimeout(aviso.timer);
    aviso.timer = setTimeout(() => caixa.classList.remove('visivel'), 3600);
  }

  // Os ícones de comentário chamam estas funções, que o projeto não chegou a criar.
  window.openCommentWindow = function (n) {
    const janela = document.getElementById('commentsWindow' + n);
    if (!janela) return;
    const aberta = getComputedStyle(janela).display !== 'none';
    document.querySelectorAll('.commentsWindow').forEach((j) => { j.style.display = 'none'; });
    if (!aberta) janela.style.display = 'block';
  };
  window.closeCommentWindow = function (n) {
    const janela = document.getElementById('commentsWindow' + n);
    if (janela) janela.style.display = 'none';
  };

  const acoes = {
    login(form) {
      const email = (form.querySelector('[name="email"]').value || '').trim().toLowerCase();
      const senha = form.querySelector('[name="senha"]').value || '';
      if (email !== CONTA.email || senha !== CONTA.senha) {
        aviso('Email ou senha incorretos! Use a conta de demonstração, que já vem preenchida.');
        return;
      }
      try { sessionStorage.setItem(CHAVE, '1'); } catch (e) { /* sem armazenamento */ }
      location.href = 'index.html';
    },
    cadastro() {
      aviso('Cadastro recebido. ' + NAO_SALVA);
      setTimeout(() => { location.href = 'index.html'; }, 1800);
    },
    'nao-salva'() {
      aviso(NAO_SALVA);
    },
  };

  document.addEventListener('submit', (e) => {
    const acao = e.target.dataset && e.target.dataset.demo;
    if (!acao || !acoes[acao]) return;
    e.preventDefault();
    acoes[acao](e.target);
  }, true);

  document.addEventListener('click', (e) => {
    const alvo = e.target.closest && e.target.closest('#seeMoreNews, #seeMoreCommunityPosts, a[data-demo-ausente]');
    if (!alvo) return;
    e.preventDefault();
    aviso(alvo.matches('a') ? 'Esta parte do site ainda não existe no projeto original.' : 'Na demonstração só há estas publicações.');
  });
})();
