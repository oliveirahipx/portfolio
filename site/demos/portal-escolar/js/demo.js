// Comportamento da versão estática: os formulários e as rotas JSON que no
// projeto original iam para o Express são atendidos aqui, no navegador.
(function () {
  const dados = window.DADOS_DEMO;
  const NAO_SALVA = 'Na demonstração os dados não são salvos.';

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

  // O alert do notasfront.js vira um aviso que não trava a página.
  window.alert = function (texto) {
    if (texto === 'Notas salvas com sucesso!') {
      aviso('Notas guardadas só nesta aba. ' + NAO_SALVA);
    } else {
      aviso(String(texto));
    }
  };

  // ---------- Rotas JSON de notas ----------
  function lerSalvas(alunoId) {
    try {
      const bruto = sessionStorage.getItem('demo-notas-' + alunoId);
      return bruto ? JSON.parse(bruto) : null;
    } catch (e) {
      return null;
    }
  }

  function json(corpo, status) {
    return new Response(JSON.stringify(corpo), {
      status: status || 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const fetchOriginal = window.fetch ? window.fetch.bind(window) : null;
  window.fetch = async function (entrada, opcoes) {
    const url = typeof entrada === 'string' ? entrada : entrada.url;
    const caminho = new URL(url, location.href).pathname;
    const metodo = ((opcoes && opcoes.method) || 'GET').toUpperCase();

    let m = caminho.match(/\/api\/turmas\/(\d+)\/alunos$/);
    if (m && metodo === 'GET') {
      const id = Number(m[1]);
      const alunos = dados.usuarios
        .filter((u) => u.turma_id === id && u.cargo === 'aluno')
        .map((u) => ({ id: u.id, nome: u.nome }));
      return json(alunos);
    }

    m = caminho.match(/\/api\/alunos\/(\d+)\/notas$/);
    if (m && metodo === 'GET') {
      const id = m[1];
      const notas = lerSalvas(id) || dados.notasProfessor[id] || [null, null, null, null];
      // Bimestre sem nota vai como texto vazio para o campo number não reclamar de "null".
      return json([1, 2, 3, 4].map((b, i) => ({ bimestre: b, nota: notas[i] === null ? '' : notas[i] })));
    }
    if (m && metodo === 'POST') {
      let corpo = {};
      try { corpo = JSON.parse((opcoes && opcoes.body) || '{}'); } catch (e) { /* corpo inválido */ }
      if (!Array.isArray(corpo.notas) || corpo.notas.length === 0) {
        return json({ erro: 'Notas inválidas.' }, 400);
      }
      const valores = [1, 2, 3, 4].map((b) => {
        const item = corpo.notas.find((n) => n.bimestre === b);
        return item && item.nota !== null ? item.nota : null;
      });
      try { sessionStorage.setItem('demo-notas-' + m[1], JSON.stringify(valores)); } catch (e) { /* sem armazenamento */ }
      return json({ mensagem: 'Notas salvas.' }, 201);
    }

    if (fetchOriginal) return fetchOriginal(entrada, opcoes);
    throw new Error('fetch indisponível');
  };

  // ---------- Formulários ----------
  function entrar(form) {
    const email = (form.querySelector('[name="email"]').value || '').trim().toLowerCase();
    const senha = form.querySelector('[name="senha"]').value || '';
    const conta = dados.contas.find((c) => c.email === email);
    if (!conta || senha !== dados.senhaDemo) {
      aviso('Usuário ou senha incorretos. Use uma das contas de demonstração.');
      return;
    }
    location.href = 'inicio-' + conta.cargo + '.html';
  }

  function consultarNotas(form) {
    const materia = form.querySelector('#materia');
    const bimestre = form.querySelector('#bimestre').value;
    const notas = dados.notasAluno[materia.value] || [];
    const nota = notas[Number(bimestre) - 1];
    const saida = document.getElementById('resultado-notas');
    const nomeMateria = materia.options[materia.selectedIndex].text;
    saida.textContent = '';
    const p = document.createElement('p');
    p.className = 'demo-resultado';
    p.textContent = nota === null || nota === undefined
      ? nomeMateria + ', ' + bimestre + 'º bimestre: nota ainda não lançada.'
      : nomeMateria + ', ' + bimestre + 'º bimestre: ' + String(nota).replace('.', ',');
    saida.appendChild(p);
  }

  const acoes = {
    logar: entrar,
    'consultar-notas': consultarNotas,
    cadastrar() {
      aviso('Cadastro recebido. ' + NAO_SALVA);
      setTimeout(() => { location.href = 'index.html'; }, 1800);
    },
    'salvar-usuario'() {
      aviso('Alterações recebidas. ' + NAO_SALVA);
      setTimeout(() => { location.href = 'administrar.html'; }, 1800);
    },
    'nao-salva'() {
      aviso(NAO_SALVA);
    },
  };

  document.addEventListener('submit', (e) => {
    const form = e.target;
    const acao = form.dataset && form.dataset.demo;
    if (!acao || !acoes[acao]) return;
    e.preventDefault();
    acoes[acao](form);
  }, true);

  document.addEventListener('click', (e) => {
    const link = e.target.closest && e.target.closest('[data-demo-ausente]');
    if (!link) return;
    e.preventDefault();
    aviso('Este link aponta para uma página que não existe no projeto original.');
  });

  // Botões da caixa de contas na tela de login.
  document.addEventListener('click', (e) => {
    const botao = e.target.closest && e.target.closest('[data-conta]');
    if (!botao) return;
    const form = document.querySelector('form[data-demo="logar"]');
    form.querySelector('[name="email"]').value = botao.dataset.conta;
    form.querySelector('[name="senha"]').value = dados.senhaDemo;
    form.querySelector('button[type="submit"]').focus();
  });
})();
