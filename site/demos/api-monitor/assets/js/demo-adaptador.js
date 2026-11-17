// Adaptador da demonstração.
// No projeto original o front conversa com o Spring Boot em http://localhost:8080.
// Aqui as mesmas chamadas são atendidas no navegador: login, usuário e histórico
// ficam no localStorage, e o teste de URL vai para a função /api/monitor/testar,
// que faz o GET de verdade e aplica as regras de SLA do serviço Java.
(function () {
  'use strict';

  var BACKEND = 'http://localhost:8080';
  var FUNCAO_TESTE = '/api/monitor/testar';
  var CHAVE_USUARIO = 'apiMonitorDemo.usuario';
  var CHAVE_RESULTADOS = 'apiMonitorDemo.resultados';
  var LIMITE_HISTORICO = 200;
  var LATENCIA_MAXIMA_MS = 50000;

  var USUARIO_PADRAO = {
    id: 1,
    name: 'Usuário Demo',
    email: 'demo@exemplo.com',
    password: '123456',
    projectName: 'Meu projeto',
    baseUrl: 'https://jsonplaceholder.typicode.com'
  };

  // ---------- armazenamento local ----------

  function ler(chave, padrao) {
    try {
      var bruto = localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : padrao;
    } catch (e) {
      return padrao;
    }
  }

  function gravar(chave, valor) {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch (e) { /* modo privado */ }
  }

  function usuario() {
    return ler(CHAVE_USUARIO, USUARIO_PADRAO);
  }

  function semSenha(u) {
    return { id: u.id, name: u.name, email: u.email, projectName: u.projectName, baseUrl: u.baseUrl };
  }

  function resultados() {
    return ler(CHAVE_RESULTADOS, []);
  }

  function salvarResultados(novos) {
    var todos = resultados().concat(novos);
    if (todos.length > LIMITE_HISTORICO) todos = todos.slice(todos.length - LIMITE_HISTORICO);
    gravar(CHAVE_RESULTADOS, todos);
  }

  // ---------- respostas ----------

  function resposta(status, corpo) {
    if (corpo === undefined || status === 204) return new Response(null, { status: status });
    return new Response(JSON.stringify(corpo), {
      status: status,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  // Converte o retorno da função para o formato da entidade ApiTestResult.
  function paraApiTestResult(url, r, id) {
    var ok2xx = r.status >= 200 && r.status < 300;
    var redirecionado = r.status >= 300 && r.status < 400;
    var json = r.contentType ? r.contentType.toLowerCase().indexOf('application/json') !== -1 : false;
    return {
      id: id,
      url: url,
      isSuccessful: r.sucesso,
      statusCode: r.status,
      message: r.motivo,
      responseTimeMillis: r.latenciaMs,
      testDateTime: new Date().toISOString(),
      // Mesmo critério do Java: as checagens de SLA só valem para 2xx.
      isLatencyOk: ok2xx ? r.latenciaMs <= LATENCIA_MAXIMA_MS : redirecionado,
      isContentValid: ok2xx ? json : redirecionado
    };
  }

  function proximoId() {
    var lista = resultados();
    return lista.length ? (lista[lista.length - 1].id || lista.length) + 1 : 1;
  }

  var fetchOriginal = window.fetch.bind(window);

  async function chamarFuncao(corpo) {
    var r = await fetchOriginal(FUNCAO_TESTE, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(corpo)
    });
    var dados = await r.json().catch(function () { return {}; });
    return { status: r.status, dados: dados };
  }

  async function testarUma(url) {
    var r = await chamarFuncao({ url: url });
    if (r.status !== 200) return resposta(r.status, r.dados);
    var resultado = paraApiTestResult(url, r.dados, proximoId());
    salvarResultados([resultado]);
    return resposta(200, resultado);
  }

  async function testarLote(corpoTexto) {
    var corpo;
    try { corpo = JSON.parse(corpoTexto || '{}'); } catch (e) { corpo = {}; }
    var urls = Array.isArray(corpo.apiUrls) ? corpo.apiUrls : [];
    if (!urls.length) return resposta(204);
    var r = await chamarFuncao({ urls: urls });
    if (r.status !== 200) return resposta(r.status, r.dados);
    var id = proximoId();
    var lista = r.dados.resultados.map(function (item, i) {
      return paraApiTestResult(urls[i], item, id + i);
    });
    salvarResultados(lista);
    return resposta(200, lista);
  }

  // Mesma agregação do ApiTestService.getSummaryData: testes por API e dia da semana.
  function resumo() {
    var lista = resultados();
    var sucessos = lista.filter(function (r) { return r.isSuccessful; }).length;
    var chartData = { labels: [1, 2, 3, 4, 5, 6, 7] };
    lista.forEach(function (r) {
      if (!chartData[r.url]) chartData[r.url] = [0, 0, 0, 0, 0, 0, 0];
      var dia = new Date(r.testDateTime).getDay(); // 0 = domingo
      var indice = dia === 0 ? 6 : dia - 1;          // segunda = 0, como DayOfWeek - 1
      chartData[r.url][indice] += 1;
    });
    return { totalTests: lista.length, successfulTests: sucessos, failedTests: lista.length - sucessos, chartData: chartData };
  }

  async function atender(caminho, metodo, corpo) {
    var url = new URL(caminho, BACKEND);
    var p = url.pathname;

    if (p === '/api/auth/login' && metodo === 'POST') {
      var cred = {};
      try { cred = JSON.parse(corpo || '{}'); } catch (e) { /* corpo inválido */ }
      var u = usuario();
      if (cred.email === u.email && cred.password === u.password) return resposta(200, semSenha(u));
      return resposta(401);
    }

    if (p.indexOf('/api/auth/user/') === 0 && metodo === 'GET') {
      var email = decodeURIComponent(p.slice('/api/auth/user/'.length));
      var atual = usuario();
      return email === atual.email ? resposta(200, semSenha(atual)) : resposta(404);
    }

    if (p === '/api/auth/user/update' && metodo === 'PUT') {
      var dados = {};
      try { dados = JSON.parse(corpo || '{}'); } catch (e) { /* corpo inválido */ }
      var salvo = usuario();
      if (String(dados.id) !== String(salvo.id)) return resposta(404);
      salvo.name = dados.name;
      salvo.email = dados.email;
      salvo.projectName = dados.projectName;
      salvo.baseUrl = dados.baseUrl;
      if (dados.password && String(dados.password).trim()) salvo.password = dados.password;
      gravar(CHAVE_USUARIO, salvo);
      return resposta(200, semSenha(salvo));
    }

    if (p === '/api/test' && metodo === 'GET') return testarUma(url.searchParams.get('url') || '');
    if (p === '/api/test/multiple' && metodo === 'POST') return testarLote(corpo);

    if (p === '/api/results' && metodo === 'GET') {
      return resposta(200, resultados().slice().reverse());
    }

    if (p === '/api/summary' && metodo === 'GET') return resposta(200, resumo());

    return resposta(404, { erro: 'Rota não existe na demonstração.' });
  }

  window.fetch = function (entrada, opcoes) {
    var alvo = typeof entrada === 'string' ? entrada : (entrada && entrada.url) || '';
    if (alvo.indexOf(BACKEND) !== 0) return fetchOriginal(entrada, opcoes);
    var metodo = ((opcoes && opcoes.method) || 'GET').toUpperCase();
    return atender(alvo.slice(BACKEND.length), metodo, opcoes && opcoes.body);
  };

  // O PDF do original é gerado no servidor com iText. Na demonstração o botão
  // abre a impressão do navegador, que também permite salvar em PDF.
  var abrirOriginal = window.open.bind(window);
  window.open = function (url) {
    if (typeof url === 'string' && url.indexOf(BACKEND + '/api/export/pdf') === 0) {
      imprimir();
      return null;
    }
    return abrirOriginal.apply(window, arguments);
  };

  function imprimir() {
    var marca = document.getElementById('data-impressao');
    if (marca) marca.textContent = 'Relatório gerado em ' + new Date().toLocaleString('pt-BR');
    window.print();
  }

  document.addEventListener('DOMContentLoaded', function () {
    // Na página de resumo o botão não tinha ação no original.
    if (document.body.classList.contains('page-resumo')) {
      var botao = document.querySelector('.btn-baixar');
      if (botao) botao.addEventListener('click', imprimir);
    }
  });
})();
