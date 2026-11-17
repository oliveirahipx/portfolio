import { ROTAS, SENHA_DEMO, atender, restaurarDados, tabelas } from './servidor.js';

const BASE = 'http://localhost:3001';
const $ = (sel) => document.querySelector(sel);

// Corpo de exemplo de cada rota que recebe JSON.
const EXEMPLOS = {
  'POST /auth/registrar': { nome: 'Ana Quadrilheira', email: 'ana@arraia.com', senha: SENHA_DEMO, tipo: 'participante' },
  'POST /auth/login': { email: 'joao@barraca.com', senha: SENHA_DEMO },
  'POST /barracas': { evento_id: 1, nome: 'Barraca do Quentão', responsavel_id: 2 },
  'POST /eventos': { nome: 'Arraiá da Quadra', data: '2026-07-11', ativo: true },
  'POST /produtos': { barraca_id: 1, nome: 'Canjica', preco: 7.5, estoque: 40 },
  'PUT /produtos/atualizar/:id': { nome: 'Pamonha doce', preco: 9, estoque: 45 },
};
const PARAMS = { ':id': '1', ':eventoId': '1', ':barracaId': '1' };

const el = {
  rotas: $('[data-rotas]'),
  form: $('[data-form]'),
  metodo: $('[data-metodo]'),
  caminho: $('[data-caminho]'),
  token: $('[data-token]'),
  enviarToken: $('[data-enviar-token]'),
  blocoCorpo: $('[data-bloco-corpo]'),
  corpo: $('[data-corpo]'),
  avisoJson: $('[data-aviso-json]'),
  curl: $('[data-curl]'),
  status: $('[data-status]'),
  tipo: $('[data-tipo]'),
  resposta: $('[data-resposta]'),
  tabelas: $('[data-tabelas]'),
};

let rotaAtual = null;

// ---------- Lista de rotas ----------
function montarRotas() {
  const grupos = new Map();
  for (const r of ROTAS) {
    if (!grupos.has(r.grupo)) grupos.set(r.grupo, []);
    grupos.get(r.grupo).push(r);
  }
  for (const nome of ['Autenticação', 'Eventos', 'Barracas', 'Produtos']) {
    const h = document.createElement('h3');
    h.className = 'rotas__grupo';
    h.textContent = nome;
    const ul = document.createElement('ul');
    ul.className = 'rotas__lista';
    for (const r of grupos.get(nome)) {
      const li = document.createElement('li');
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'rota';
      b.setAttribute('aria-pressed', 'false');
      b.innerHTML = `<span class="metodo metodo--${r.metodo.toLowerCase()}">${r.metodo}</span>`
        + `<span class="rota__caminho">${r.caminho}</span>`
        + (r.publica ? '' : '<span class="cadeado" title="Exige token"><span class="sr">exige token</span></span>')
        + `<span class="rota__resumo">${r.resumo}</span>`;
      b.addEventListener('click', () => escolher(r, b));
      r.botao = b;
      li.appendChild(b);
      ul.appendChild(li);
    }
    el.rotas.append(h, ul);
  }
}

function escolher(rota, botao) {
  rotaAtual = rota;
  for (const r of ROTAS) r.botao.setAttribute('aria-pressed', String(r === rota));
  el.metodo.value = rota.metodo;
  // A Pamonha (id 2) é o exemplo do PUT; o Milho (id 1) está num pedido e não pode ser apagado.
  const params = rota.metodo === 'PUT' ? { ...PARAMS, ':id': '2' } : PARAMS;
  el.caminho.value = rota.caminho.replace(/:\w+/g, (p) => params[p] || '1');
  const exemplo = EXEMPLOS[`${rota.metodo} ${rota.caminho}`];
  el.corpo.value = exemplo ? JSON.stringify(exemplo, null, 2) : '';
  atualizarCorpo();
  atualizarCurl();
  if (botao && window.matchMedia('(max-width: 899px)').matches) {
    el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function temCorpo() {
  return el.metodo.value === 'POST' || el.metodo.value === 'PUT';
}

function atualizarCorpo() {
  el.blocoCorpo.hidden = !temCorpo();
  el.avisoJson.hidden = true;
}

// ---------- curl ----------
function aspasShell(s) {
  return "'" + s.replace(/'/g, "'\\''") + "'";
}

function corpoCompacto() {
  const texto = el.corpo.value.trim();
  if (!texto) return '';
  try { return JSON.stringify(JSON.parse(texto)); } catch (e) { return texto; }
}

function atualizarCurl() {
  const linhas = [];
  const metodo = el.metodo.value;
  const url = BASE + (el.caminho.value.startsWith('/') ? '' : '/') + el.caminho.value;
  linhas.push(metodo === 'GET' ? `curl ${url}` : `curl -X ${metodo} ${url}`);
  const token = el.token.value.trim();
  if (el.enviarToken.checked && token) linhas.push(`-H "Authorization: Bearer ${token}"`);
  const corpo = temCorpo() ? corpoCompacto() : '';
  if (corpo) {
    linhas.push('-H "Content-Type: application/json"');
    linhas.push(`-d ${aspasShell(corpo)}`);
  }
  el.curl.textContent = linhas.join(' \\\n  ');
}

// ---------- Envio ----------
const FRASES = { 200: 'OK', 201: 'Created', 400: 'Bad Request', 401: 'Unauthorized', 403: 'Forbidden', 404: 'Not Found', 500: 'Internal Server Error' };

async function enviar() {
  const metodo = el.metodo.value;
  const corpo = temCorpo() ? el.corpo.value : '';
  el.avisoJson.hidden = true;
  if (corpo.trim()) {
    try {
      JSON.parse(corpo);
    } catch (e) {
      // O servidor responderia 400; avisar antes ajuda a corrigir o texto.
      el.avisoJson.textContent = 'O corpo não é um JSON válido. A API responderia 400 com o erro do parser; confira aspas e vírgulas.';
      el.avisoJson.hidden = false;
    }
  }
  const headers = {};
  if (corpo.trim()) headers['Content-Type'] = 'application/json';
  const token = el.token.value.trim();
  if (el.enviarToken.checked && token) headers.Authorization = `Bearer ${token}`;

  el.status.textContent = 'enviando...';
  el.status.className = 'status';
  const inicio = performance.now();
  const r = await atender({ metodo, caminho: el.caminho.value.trim(), headers, corpo });
  const ms = Math.max(1, Math.round(performance.now() - inicio));

  if (r.status === 0) {
    el.status.textContent = 'sem resposta';
    el.status.className = 'status status--erro';
    el.tipo.hidden = true;
    el.resposta.textContent = r.motivo;
  } else {
    el.status.textContent = `${r.status} ${FRASES[r.status] || ''} · ${ms} ms`;
    el.status.className = 'status ' + (r.status < 300 ? 'status--ok' : r.status < 500 ? 'status--aviso' : 'status--erro');
    el.tipo.textContent = 'Content-Type: ' + r.tipo;
    el.tipo.hidden = false;
    el.resposta.textContent = typeof r.corpo === 'string' ? r.corpo : JSON.stringify(r.corpo, null, 2);
  }

  if (r.status === 200 && r.corpo && r.corpo.token) {
    el.token.value = r.corpo.token;
    el.enviarToken.checked = true;
    atualizarCurl();
  }
  mostrarTabelas();
}

// ---------- Tabelas em memória ----------
function mostrarTabelas() {
  const db = tabelas();
  const blocos = ['usuarios', 'eventos', 'barracas', 'produtos'].map((nome) => {
    const linhas = db[nome].map((l) => {
      const { senha, ...resto } = l;
      return nome === 'usuarios' ? { ...resto, senha_hash: '(oculto)' } : resto;
    });
    return `<h4>${nome}</h4><pre class="codigo codigo--tabela">${escapar(JSON.stringify(linhas, null, 2))}</pre>`;
  });
  el.tabelas.innerHTML = blocos.join('');
}

function escapar(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
}

// ---------- Contas de exemplo ----------
function montarContas() {
  document.querySelector('[data-senha-demo]').textContent = SENHA_DEMO;
  const ul = document.querySelector('[data-contas]');
  for (const u of tabelas().usuarios) {
    const li = document.createElement('li');
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'conta';
    b.innerHTML = `<span class="conta__email">${u.email}</span><span class="conta__tipo">${u.tipo}</span>`;
    b.title = 'Preencher o login com esta conta';
    b.addEventListener('click', () => {
      const rota = ROTAS.find((r) => r.caminho === '/auth/login');
      escolher(rota, null);
      el.corpo.value = JSON.stringify({ email: u.email, senha: SENHA_DEMO }, null, 2);
      atualizarCurl();
      el.form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    li.appendChild(b);
    ul.appendChild(li);
  }
}

// ---------- Eventos ----------
el.form.addEventListener('submit', (e) => { e.preventDefault(); enviar(); });
el.form.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); enviar(); }
});
el.metodo.addEventListener('change', () => { atualizarCorpo(); atualizarCurl(); });
for (const campo of [el.caminho, el.token, el.corpo]) campo.addEventListener('input', atualizarCurl);
el.enviarToken.addEventListener('change', atualizarCurl);

document.querySelector('[data-restaurar]').addEventListener('click', () => {
  restaurarDados();
  mostrarTabelas();
  el.status.textContent = 'dados restaurados';
  el.status.className = 'status';
});

document.querySelector('[data-copiar]').addEventListener('click', async (e) => {
  const botao = e.currentTarget;
  try {
    await navigator.clipboard.writeText(el.curl.textContent);
    botao.textContent = 'Copiado';
  } catch (err) {
    const faixa = document.createRange();
    faixa.selectNodeContents(el.curl);
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(faixa);
    botao.textContent = 'Selecionado';
  }
  setTimeout(() => { botao.textContent = 'Copiar'; }, 1600);
});

montarRotas();
montarContas();
mostrarTabelas();
escolher(ROTAS.find((r) => r.caminho === '/auth/login'), null);
