// Gera site/demos/portal-escolar/ renderizando os templates EJS do projeto
// portal-escolar com dados fictícios. O repositório original só é lido.
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { AQUI, RAIZ, pastaLimpa, copiar, copiarPasta, gravar, montarPagina, trocar, escaparAttr } from './comum.mjs';

const ID = 'portal-escolar';
const REPO = path.join(RAIZ, 'portal-escolar');
const VIEWS = path.join(REPO, 'app', 'views');
const EXTRAS = path.join(AQUI, 'extras', ID);

const FOTO_PADRAO = 'https://res.cloudinary.com/duslicdkg/image/upload/v1732682709/user_images/hvgfrnagncizszy4lu83.jpg';
const LOGO = 'https://res.cloudinary.com/duslicdkg/image/upload/v1732718770/Images/Logo_lnvgnx.webp';
const MATRICULAS = 'https://res.cloudinary.com/duslicdkg/image/upload/v1732718779/Images/Matriculas_jfpi3c.webp';
const SENHA_DEMO = 'demo123';

// ---------- Dados fictícios ----------
const turmas = [
  { id: 1, nome: '1º A' },
  { id: 2, nome: '2º B' },
  { id: 3, nome: '3º A' },
];

const materias = [
  { id: 1, nome: 'Matemática' },
  { id: 2, nome: 'Língua Portuguesa' },
  { id: 3, nome: 'Biologia' },
  { id: 4, nome: 'Física' },
  { id: 5, nome: 'Química' },
  { id: 6, nome: 'História' },
  { id: 7, nome: 'Geografia' },
  { id: 8, nome: 'Inglês' },
];

const usuarios = [
  [1, 'Helena Duarte Campos', '1979-08-02', 'direcao@escola.example', 'direcao', null],
  [2, 'Marcos Vinícius Teles', '1985-04-19', 'professor@escola.example', 'professor', null],
  [3, 'Patrícia Nogueira Lins', '1990-11-07', 'patricia.lins@escola.example', 'professor', null],
  [4, 'Renato Alves Brandão', '1982-01-25', 'renato.brandao@escola.example', 'professor', null],
  [5, 'Ana Clara Moreira', '2008-03-14', 'aluno@escola.example', 'aluno', 3],
  [6, 'Bruno Henrique Sales', '2008-07-30', 'bruno.sales@escola.example', 'aluno', 3],
  [7, 'Camila Rocha Prado', '2008-01-09', 'camila.prado@escola.example', 'aluno', 3],
  [8, 'Diego Fernandes Lima', '2007-12-02', 'diego.lima@escola.example', 'aluno', 3],
  [9, 'Eduarda Martins Freitas', '2009-05-21', 'eduarda.freitas@escola.example', 'aluno', 2],
  [10, 'Felipe Augusto Rangel', '2009-09-12', 'felipe.rangel@escola.example', 'aluno', 2],
  [11, 'Gabriela Souza Pinto', '2009-02-03', 'gabriela.pinto@escola.example', 'aluno', 2],
  [12, 'Igor Matheus Coelho', '2010-06-17', 'igor.coelho@escola.example', 'aluno', 1],
  [13, 'Júlia Castro Mendes', '2010-10-28', 'julia.mendes@escola.example', 'aluno', 1],
  [14, 'Lucas Barbosa Teixeira', '2010-04-05', 'lucas.teixeira@escola.example', 'aluno', 1],
].map(([id, nome, nasc, email, cargo, turma_id]) => ({
  id, nome,
  data_nascimento: nasc.split('-').reverse().join('/'),
  email, senha: '(hash bcrypt)', cargo,
  imagemperfil: `images/avatar-${id}.svg`,
  turma_id,
}));

// Professores_Materias
const professoresMaterias = { 2: [1, 4], 3: [2, 8], 4: [] };

const CONTAS = { direcao: 1, professor: 2, aluno: 5 };

// Notas determinísticas: 1º a 3º bimestres lançados, 4º ainda em aberto.
function nota(alunoId, materiaId, bimestre) {
  const x = Math.sin(alunoId * 12.9898 + materiaId * 78.233 + bimestre * 37.719) * 43758.5453;
  const frac = x - Math.floor(x);
  return Math.round((5 + frac * 5) * 2) / 2; // 5,0 a 10,0 de meio em meio ponto
}
function notasDe(alunoId, materiaId) {
  return [1, 2, 3, 4].map((b) => (b < 4 ? nota(alunoId, materiaId, b) : null));
}

const alunos = usuarios.filter((u) => u.cargo === 'aluno');
const notasProfessor = Object.fromEntries(alunos.map((a) => [a.id, notasDe(a.id, 1)]));
const notasAluno = Object.fromEntries(materias.map((m) => [m.id, notasDe(CONTAS.aluno, m.id)]));

// ---------- Rotas do Express -> arquivos ----------
function arquivoDaRota(url, cargo) {
  if (/^\/(css|js|images)\//.test(url)) return url.slice(1);
  const r = url.toLowerCase();
  if (r === '/') return cargo ? `inicio-${cargo}.html` : 'inicio.html';
  if (r === '/login' || r === '/logout') return 'index.html';
  if (r === '/cadastro') return 'cadastro.html';
  if (r === '/perfil') return cargo ? `perfil-${cargo}.html` : 'index.html';
  if (r === '/notas' && (cargo === 'professor' || cargo === 'aluno')) return `notas-${cargo}.html`;
  if (r === '/administrar') return 'administrar.html';
  const m = r.match(/^\/adm\/editar\/(\d+)$/);
  if (m) return `editar-${m[1]}.html`;
  return null;
}

function acaoDoFormulario(url) {
  const r = url.toLowerCase();
  if (r === '/logar') return 'logar';
  if (r === '/cadastrar') return 'cadastrar';
  if (/^\/adm\/edit\/\d+$/.test(r)) return 'salvar-usuario';
  if (r === '/admin/adduser' || r === '/upload' || r === '/editar-dados'
    || /^\/admin\/(deleteuser|upload)\/\d+$/.test(r)) return 'nao-salva';
  return null;
}

function rotear(html, cargo) {
  html = html.replace(/<form([^>]*)>/g, (tag, attrs) => {
    const m = attrs.match(/\saction="([^"]*)"/);
    if (!m) return tag;
    const destino = arquivoDaRota(m[1], cargo);
    if (destino && /method="GET"/i.test(attrs)) {
      return `<form${attrs.replace(m[0], ` action="${destino}"`)}>`;
    }
    const acao = acaoDoFormulario(m[1]);
    if (!acao) throw new Error('formulário sem tratamento: ' + m[1]);
    return `<form${attrs.replace(m[0], ` action="#" data-demo="${acao}"`)}>`;
  });
  return html.replace(/\s(href|src)="(\/[^"]*)"/g, (tudo, attr, url) => {
    const destino = arquivoDaRota(url, cargo);
    if (destino) return ` ${attr}="${destino}"`;
    if (attr === 'href') return ' href="#" data-demo-ausente';
    throw new Error('recurso sem destino: ' + url);
  });
}

// ---------- Renderização ----------
async function render(view, dados) {
  return ejs.renderFile(path.join(VIEWS, view), dados);
}

function finalizar(html, cargo, { centro = false } = {}) {
  html = rotear(html, cargo);
  html = html.split(FOTO_PADRAO).join('images/sem-foto.svg');
  html = html.split(LOGO).join('images/marca-portal.svg');
  html = html.split(MATRICULAS).join('images/matriculas.svg');
  return montarPagina(html, {
    id: ID,
    cabeca: '<link rel="stylesheet" href="css/demo.css">\n    <script src="js/dados-demo.js"></script>\n    <script src="js/demo.js"></script>',
    classeBody: centro ? 'demo-centro' : '',
  });
}

function sessao(u) {
  return { user: { id: u.id, nome: u.nome, email: u.email, cargo: u.cargo } };
}

function comFoto(u) {
  return { ...u, imagemPerfil: u.imagemperfil || FOTO_PADRAO };
}

function caixaContas() {
  const linhas = Object.entries(CONTAS).map(([cargo, id]) => {
    const u = usuarios.find((x) => x.id === id);
    const rotulo = { direcao: 'Direção', professor: 'Professor', aluno: 'Aluno' }[cargo];
    return `<li><button type="button" data-conta="${escaparAttr(u.email)}"><strong>${rotulo}</strong>${u.email}</button></li>`;
  }).join('\n                        ');
  return `<div class="demo-contas">
                    <p>Contas de demonstração (senha <code>${SENHA_DEMO}</code>). Cada cargo vê um menu diferente.</p>
                    <ul>
                        ${linhas}
                    </ul>
                </div>`;
}

function avatar(u) {
  const cores = ['#2c3e50', '#16a085', '#8e44ad', '#c0392b', '#d35400', '#2980b9', '#27ae60'];
  const iniciais = u.nome.split(' ').filter((p) => p.length > 2).slice(0, 2).map((p) => p[0]).join('');
  const cor = cores[u.id % cores.length];
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Foto de perfil de ${u.nome}">
  <rect width="100" height="100" fill="${cor}"/>
  <text x="50" y="50" dy=".35em" text-anchor="middle" font-family="Arial, sans-serif" font-size="38" font-weight="700" fill="#ffffff">${iniciais}</text>
</svg>
`;
}

export async function gerar() {
  const destino = pastaLimpa(ID);
  const pagina = (nome, html) => gravar(path.join(destino, nome), html);

  // Arquivos públicos do projeto (sem as imagens com a marca da escola).
  copiarPasta(path.join(REPO, 'public', 'css'), path.join(destino, 'css'));
  copiar(path.join(REPO, 'public', 'js', 'notasfront.js'), path.join(destino, 'js', 'notasfront.js'));
  const indexFront = trocar(fs.readFileSync(path.join(REPO, 'public', 'js', 'indexfront.js'), 'utf8'), [
    [MATRICULAS, 'images/matriculas.svg'],
    [' \u{1F680}</p>', '</p>'], // tira o emoji do fim do texto do PAS
  ], 'indexfront.js');
  gravar(path.join(destino, 'js', 'indexfront.js'), indexFront);
  copiarPasta(path.join(EXTRAS, 'css'), path.join(destino, 'css'));
  copiarPasta(path.join(EXTRAS, 'js'), path.join(destino, 'js'));
  copiarPasta(path.join(EXTRAS, 'images'), path.join(destino, 'images'));
  for (const u of usuarios) gravar(path.join(destino, 'images', `avatar-${u.id}.svg`), avatar(u));

  const dadosNavegador = {
    senhaDemo: SENHA_DEMO,
    contas: Object.entries(CONTAS).map(([cargo, id]) => ({ cargo, email: usuarios.find((u) => u.id === id).email })),
    usuarios: usuarios.map(({ id, nome, cargo, turma_id }) => ({ id, nome, cargo, turma_id })),
    notasProfessor,
    notasAluno,
  };
  gravar(path.join(destino, 'js', 'dados-demo.js'),
    '// Dados fictícios usados pela demonstração.\nwindow.DADOS_DEMO = ' + JSON.stringify(dadosNavegador, null, 2) + ';\n');

  // Login (entrada da demo) e cadastro
  let login = await render('Login.ejs', {});
  login = trocar(login, [['</form>', '</form>\n                ' + caixaContas()]], 'Login.ejs');
  pagina('index.html', finalizar(login, null, { centro: true }));
  pagina('cadastro.html', finalizar(await render('Cadastro.ejs', { Alunos: usuarios }), null, { centro: true }));

  // Página inicial sem login
  pagina('inicio.html', finalizar(await render('index.ejs', { session: {} }), null));

  for (const [cargo, id] of Object.entries(CONTAS)) {
    const u = usuarios.find((x) => x.id === id);
    const s = sessao(u);
    pagina(`inicio-${cargo}.html`, finalizar(await render('index.ejs', { session: s, usuario: comFoto(u) }), cargo));
    pagina(`perfil-${cargo}.html`, finalizar(await render('perfil.ejs', { session: s, usuario: comFoto(u) }), cargo));
  }

  // Notas do professor: turmas com alunos, já que ele tem matérias associadas.
  const prof = usuarios.find((x) => x.id === CONTAS.professor);
  const turmasProf = professoresMaterias[prof.id].length
    ? turmas.filter((t) => alunos.some((a) => a.turma_id === t.id))
    : [];
  pagina('notas-professor.html', finalizar(await render('notas.ejs', { user: sessao(prof).user, turmas: turmasProf }), 'professor'));

  // Notas do aluno: o notasfront.js do original quebra nessa tela (procura a
  // lista de turmas, que só existe para o professor), então a consulta é
  // respondida pelo demo.js.
  const aluno = usuarios.find((x) => x.id === CONTAS.aluno);
  let notasAlunoHtml = await render('notas.ejs', { user: sessao(aluno).user, materias });
  notasAlunoHtml = trocar(notasAlunoHtml, [
    ['<form id="consulta-notas-form">', '<form id="consulta-notas-form" data-demo="consultar-notas">'],
    ['<script src="/js/notasfront.js"></script>', ''],
  ], 'notas.ejs (aluno)');
  pagina('notas-aluno.html', finalizar(notasAlunoHtml, 'aluno'));

  // Administração (direção)
  const dir = usuarios.find((x) => x.id === CONTAS.direcao);
  const professoresComMaterias = usuarios.filter((x) => x.cargo === 'professor').map((p) => ({
    ...p,
    materias: professoresMaterias[p.id].map((mid) => ({ materia: materias.find((m) => m.id === mid).nome })),
  }));
  pagina('administrar.html', finalizar(await render('adm.ejs', {
    session: sessao(dir), usuario: comFoto(dir), users: usuarios, professoresComMaterias,
  }), 'direcao'));

  for (const u of usuarios) {
    pagina(`editar-${u.id}.html`, finalizar(await render('editar.ejs', {
      user: u, materias, materiasAssociadas: professoresMaterias[u.id] || [], session: sessao(dir),
    }), 'direcao'));
  }

  console.log('ok', ID);
}
