// Dados dos projetos. Cada projeto vira uma "tabela" e um nó do diagrama.
// links: { codigo, executavel: {href, rotulo, nota}, demo, site, extra: [{href, rotulo}] }

const GH = 'https://github.com/oliveirahipx/';

export const TECNOLOGIAS = [
  { id: 'java', nome: 'Java' },
  { id: 'node', nome: 'Node.js' },
  { id: 'postgres', nome: 'Postgres' },
  { id: 'mysql', nome: 'MySQL' },
  { id: 'flutter', nome: 'Flutter' },
  { id: 'supabase', nome: 'Supabase' },
  { id: 'web', nome: 'HTML/CSS/JS' },
  { id: 'riscv', nome: 'RISC-V' },
];

export const PROJETOS = [
  {
    id: 'hipfinance',
    nome: 'hipfinance',
    titulo: 'HipFinance',
    destaque: true,
    icone: 'assets/hipfinance.svg',
    oQueFaz: 'App Android de finanças pessoais. Junta saldo, cartões, faturas e parcelas das minhas contas bancárias via Open Finance e mostra quanto vou pagar e receber no mês.',
    stack: ['Flutter', 'Dart', 'Supabase', 'Postgres + RLS', 'Edge Functions (TypeScript)'],
    tec: ['flutter', 'supabase', 'postgres'],
    detalhes: [
      'Dados cifrados no servidor (X25519 + HKDF + AES-GCM), login Google, senha mestra e biometria.',
      'Sincronização agendada por GitHub Actions; mais de 1.500 testes automatizados.',
    ],
    status: 'Em desenvolvimento. Código privado; a versão de demonstração (dados fictícios) é pública.',
    links: {
      demo: 'demos/hipfinance/',
      site: { href: 'https://hipfinance.com.br', rotulo: 'Site do app' },
      executavel: { href: 'https://hipfinance.com.br/#baixar', rotulo: 'Baixar a demo (APK)', nota: 'Android · login Google só para baixar' },
    },
  },
  {
    id: 'api-monitor',
    nome: 'api-monitor',
    titulo: 'Monitor de APIs',
    oQueFaz: 'Testa APIs REST externas: status, latência e Content-Type, um endereço ou vários em lote, guarda o histórico no Postgres e mostra gráficos e um relatório em PDF.',
    stack: ['Java', 'Spring Boot', 'JPA/Hibernate', 'Postgres', 'JavaScript'],
    tec: ['java', 'postgres', 'web'],
    status: 'Concluído.',
    links: { executavel: { href: 'https://github.com/oliveirahipx/api-monitor/releases/download/v1.0.0/api-monitor-1.0.0.jar', rotulo: 'Baixar o .jar', nota: 'Java 17 · precisa de um Postgres (docker-compose no repositório) · abre em localhost:8080' }, demo: 'demos/api-monitor/', codigo: GH + 'api-monitor' },
  },
  {
    id: 'portal-escolar',
    nome: 'portal-escolar',
    titulo: 'Portal Escolar (TCC)',
    oQueFaz: 'Sistema web do Centro de Ensino Médio 09: cadastro e login, perfis de aluno, professor e administração, lançamento de notas e foto de perfil na nuvem.',
    stack: ['Node.js', 'Express', 'EJS', 'Postgres', 'Cloudinary'],
    tec: ['node', 'postgres', 'web'],
    status: 'Concluído (TCC).',
    links: { demo: 'demos/portal-escolar/', codigo: GH + 'portal-escolar' },
  },
  {
    id: 'arraia-show-api',
    nome: 'arraia-show-api',
    titulo: 'Arraiá Show API',
    oQueFaz: 'API REST para festas juninas: barracas, eventos e produtos, com cadastro, login e rotas protegidas por token.',
    stack: ['Node.js', 'Express', 'MySQL', 'JWT', 'bcrypt'],
    tec: ['node', 'mysql'],
    status: 'Concluído.',
    links: { demo: 'demos/arraia-show-api/', codigo: GH + 'arraia-show-api' },
  },
  {
    id: 'ceilandia-times',
    nome: 'ceilandia-times',
    titulo: 'Ceilândia Times',
    oQueFaz: 'Portal de notícias feito em hackathon: login, perfil com foto e listagem de notícias.',
    stack: ['Node.js', 'Express', 'EJS', 'Postgres', 'Cloudinary'],
    tec: ['node', 'postgres', 'web'],
    status: 'Protótipo de hackathon.',
    links: { demo: 'demos/ceilandia-times/', codigo: GH + 'ceilandia-times' },
  },
  {
    id: 'fastfood-manager',
    nome: 'fastfood-manager',
    titulo: 'FastFood Manager',
    oQueFaz: 'Programa de desktop para lanchonete: login, cardápio de lanches e bebidas e registro de pedidos.',
    stack: ['Java', 'Swing', 'SQLite', 'DAO', 'Maven'],
    tec: ['java'],
    status: 'Concluído.',
    links: { executavel: { href: 'https://github.com/oliveirahipx/fastfood-manager/releases/download/v1.0.0/fastfood-manager-1.0.0.jar', rotulo: 'Baixar o .jar', nota: 'Java 8 ou mais novo · abre com dois cliques; o banco SQLite é criado sozinho' }, demo: 'demos/fastfood-manager/', codigo: GH + 'fastfood-manager' },
  },
  {
    id: 'embaixada-desktop',
    nome: 'embaixada-desktop',
    titulo: 'Embaixada',
    oQueFaz: 'Programa de desktop para uma embaixada: cadastro e login de cidadãos, pedidos de visto e passaporte e consulta de documentos.',
    stack: ['Java', 'Swing', 'JDBC', 'MySQL'],
    tec: ['java', 'mysql'],
    status: 'Concluído.',
    links: { executavel: { href: 'https://github.com/oliveirahipx/embaixada-desktop/releases/download/v1.0.0/embaixada-desktop-1.0.0.jar', rotulo: 'Baixar o .jar', nota: 'Java 8 ou mais novo · precisa de um MySQL; o repositório tem um docker-compose pronto' }, demo: 'demos/embaixada-desktop/', codigo: GH + 'embaixada-desktop' },
  },
  {
    id: 'riscv',
    nome: 'arq-computadores-tema4-fluxo-de-controle',
    titulo: 'Fluxo de controle em RISC-V',
    oQueFaz: 'Trabalho de Arquitetura de Computadores (UCB): como laços, decisões e recursão viram instruções RV32I, com prova de conceito no RARS, um rastreador em Python e relatório técnico.',
    stack: ['Assembly RISC-V', 'RARS', 'Python'],
    tec: ['riscv'],
    status: 'Entregue (em grupo, 2026).',
    links: {
      codigo: GH + 'arq-computadores-tema4-fluxo-de-controle',
      demo: 'demos/riscv/',
      extra: [{ href: GH + 'arq-computadores-tema4-fluxo-de-controle/blob/main/relatorio/Relatorio_Tema4_Fluxo_de_Controle.pdf', rotulo: 'Relatório (PDF)' }],
    },
  },
  {
    id: 'portal-libras',
    nome: 'portal-libras',
    titulo: 'Portal bilíngue Libras/Português',
    oQueFaz: 'Protótipo de acessibilidade: um portal acadêmico que mostra o vídeo em Libras do conteúdo escolhido ao lado do texto em português.',
    stack: ['HTML', 'CSS', 'JavaScript'],
    tec: ['web'],
    status: 'Protótipo.',
    links: { codigo: GH + 'portal-libras', demo: 'demos/portal-libras/' },
  },
  {
    id: 'agenda-pessoal',
    nome: 'agenda-pessoal',
    titulo: 'Agenda Pessoal',
    oQueFaz: 'Calendário mensal com eventos por dia e uma lista de projetos, tudo salvo no próprio navegador.',
    stack: ['HTML', 'CSS', 'JavaScript', 'localStorage'],
    tec: ['web'],
    status: 'Concluído.',
    links: { codigo: GH + 'agenda-pessoal', demo: 'demos/agenda-pessoal/' },
  },
];

// ---------- Tabelas ----------

const el = (tag, attrs = {}, ...filhos) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') n.className = v;
    else if (k === 'text') n.textContent = v;
    else n.setAttribute(k, v);
  }
  for (const f of filhos.flat()) if (f != null) n.append(f);
  return n;
};

const linha = (coluna, tipo, valor) =>
  el('div', { class: 'linha' },
    el('dt', {}, el('span', { class: 'col', text: coluna }), el('span', { class: 'tipo', text: tipo })),
    el('dd', {}, valor));

function linksDe(p) {
  const L = p.links, itens = [];
  if (L.executavel) {
    itens.push(el('a', { class: 'botao botao--baixar', href: L.executavel.href }, L.executavel.rotulo));
  }
  if (L.demo) itens.push(el('a', { class: 'botao botao--baixar', href: L.demo }, 'Abrir a demo'));
  if (L.site) itens.push(el('a', { class: 'botao botao--secundario', href: L.site.href }, L.site.rotulo));
  if (L.codigo) itens.push(el('a', { class: 'botao botao--secundario', href: L.codigo }, 'Ver o código'));
  for (const x of L.extra || []) itens.push(el('a', { class: 'botao botao--secundario', href: x.href }, x.rotulo));
  const box = el('div', { class: 'acoes' }, itens);
  if (L.executavel?.nota) box.append(el('p', { class: 'acoes__nota', text: L.executavel.nota }));
  return box;
}

function tabela(p) {
  const cabeca = el('header', { class: 'tabela__cabeca' },
    p.icone ? el('img', { src: p.icone, alt: '', width: 40, height: 40, class: 'tabela__icone' }) : null,
    el('div', {},
      el('h3', { class: 'tabela__titulo', text: p.titulo }),
      el('p', { class: 'tabela__nome', text: p.nome })));

  const dl = el('dl', { class: 'tabela__linhas' },
    linha('o_que_faz', 'text', p.oQueFaz),
    linha('stack', 'varchar[]', p.stack.join(', ')),
    p.detalhes ? linha('detalhes', 'text', el('ul', { class: 'detalhes' }, p.detalhes.map((s) => el('li', { text: s })))) : null,
    linha('status', 'enum', p.status),
    linha('links', 'fk', linksDe(p)));

  return el('article', {
    class: 'tabela' + (p.destaque ? ' tabela--destaque' : ''),
    id: 'p-' + p.id,
    'data-tec': p.tec.join(' '),
    'aria-labelledby': 'p-' + p.id + '-t',
  }, cabeca, dl);
}

const area = document.querySelector('[data-tabelas]');
for (const p of PROJETOS) {
  const t = tabela(p);
  t.querySelector('.tabela__titulo').id = 'p-' + p.id + '-t';
  area.append(t);
}

// ---------- Diagrama ----------

const NS = 'http://www.w3.org/2000/svg';
const svg = document.querySelector('.esquema__svg');
const s = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

let ativo = null;

function desenhar() {
  for (const n of [...svg.childNodes]) if (n.nodeName !== 'title') n.remove();
  const largura = svg.clientWidth || 520;
  const linhaH = 34, topo = 8;
  const alt = topo * 2 + PROJETOS.length * linhaH;
  svg.setAttribute('viewBox', `0 0 ${largura} ${alt}`);
  svg.setAttribute('height', alt);

  const colTec = Math.min(132, largura * 0.34);
  const xTec = 0, xProj = largura - Math.min(230, largura * 0.56);
  const passoTec = (alt - topo * 2) / TECNOLOGIAS.length;
  const posTec = Object.fromEntries(TECNOLOGIAS.map((t, i) => [t.id, topo + passoTec * (i + 0.5)]));
  const posProj = Object.fromEntries(PROJETOS.map((p, i) => [p.id, topo + linhaH * (i + 0.5)]));

  const gLinhas = s('g', { class: 'rel' });
  svg.append(gLinhas);
  for (const p of PROJETOS) for (const t of p.tec) {
    const y1 = posTec[t], y2 = posProj[p.id], x1 = xTec + colTec, x2 = xProj - 6;
    const mx = (x1 + x2) / 2;
    gLinhas.append(s('path', { d: `M${x1} ${y1} C${mx} ${y1} ${mx} ${y2} ${x2} ${y2}`, 'data-t': t, 'data-p': p.id }));
  }

  for (const t of TECNOLOGIAS) {
    const g = s('g', { class: 'no-tec', 'data-t': t.id, tabindex: 0, role: 'button', 'aria-pressed': String(ativo === t.id) });
    const y = posTec[t.id];
    g.append(s('rect', { x: xTec, y: y - 14, width: colTec, height: 28, rx: 4 }));
    const tx = s('text', { x: xTec + 12, y: y + 5 });
    tx.textContent = t.nome;
    g.append(tx);
    const lbl = s('title'); lbl.textContent = `Filtrar por ${t.nome}`; g.prepend(lbl);
    g.addEventListener('click', () => alternar(t.id));
    g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); alternar(t.id); } });
    g.addEventListener('pointerenter', () => realcar(t.id));
    g.addEventListener('pointerleave', () => realcar(ativo));
    g.addEventListener('focus', () => realcar(t.id));
    g.addEventListener('blur', () => realcar(ativo));
    svg.append(g);
  }

  for (const p of PROJETOS) {
    const a = s('a', { href: '#p-' + p.id, class: 'no-proj', 'data-p': p.id });
    const y = posProj[p.id];
    a.append(s('circle', { cx: xProj, cy: y, r: 3.5 }));
    const tx = s('text', { x: xProj + 10, y: y + 4.5 });
    const max = largura < 480 ? 20 : 26;
    tx.textContent = p.nome.length > max ? p.nome.slice(0, max - 2) + '…' : p.nome;
    a.append(tx);
    svg.append(a);
  }
  realcar(ativo);
}

function realcar(tec) {
  svg.classList.toggle('tem-foco', !!tec);
  const usados = new Set(PROJETOS.filter((p) => p.tec.includes(tec)).map((p) => p.id));
  svg.querySelectorAll('.rel path').forEach((n) => n.classList.toggle('on', n.dataset.t === tec));
  svg.querySelectorAll('.no-tec').forEach((n) => n.classList.toggle('on', n.dataset.t === tec));
  svg.querySelectorAll('.no-proj').forEach((n) => n.classList.toggle('on', usados.has(n.dataset.p)));
}

const textoFiltro = document.querySelector('[data-filtro-texto]');
const limpar = document.querySelector('[data-limpar]');

function alternar(tec) {
  ativo = ativo === tec ? null : tec;
  svg.querySelectorAll('.no-tec').forEach((n) => n.setAttribute('aria-pressed', String(n.dataset.t === ativo)));
  realcar(ativo);
  let n = 0;
  area.querySelectorAll('.tabela').forEach((t) => {
    const mostra = !ativo || t.dataset.tec.split(' ').includes(ativo);
    t.hidden = !mostra; if (mostra) n++;
  });
  const nome = TECNOLOGIAS.find((t) => t.id === ativo)?.nome;
  textoFiltro.textContent = ativo ? `${n} ${n === 1 ? 'projeto usa' : 'projetos usam'} ${nome}.` : 'Todos os projetos.';
  limpar.hidden = !ativo;
}
limpar.addEventListener('click', () => alternar(ativo));

desenhar();
let raf;
new ResizeObserver(() => { cancelAnimationFrame(raf); raf = requestAnimationFrame(desenhar); }).observe(svg);
