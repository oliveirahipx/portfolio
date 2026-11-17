// Gera site/demos/ceilandia-times/ renderizando os templates EJS do projeto
// ceilandia-times. As notícias e os posts são texto fixo nos templates
// (lorem ipsum no original); aqui eles viram textos fictícios sobre a cidade.
import fs from 'node:fs';
import path from 'node:path';
import ejs from 'ejs';
import { AQUI, RAIZ, pastaLimpa, copiarPasta, gravar, montarPagina, trocar } from './comum.mjs';

const ID = 'ceilandia-times';
const REPO = path.join(RAIZ, 'ceilandia-times');
const VIEWS = path.join(REPO, 'app', 'views');
const EXTRAS = path.join(AQUI, 'extras', ID);
const CLOUD = 'https://res.cloudinary.com/duslicdkg/image/upload/';

const LEITORA = { id: 1, nome: 'Joana Ribeiro', email: 'leitora@exemplo.com', imagemPerfil: 'media/usuario-2.svg' };

const LOREM_NOTICIA = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed egestas quam dui, a luctus velit condimentum sed. Maecenas eu dignissim tortor, tempus ullamcorper nisl. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas.';
const LOREM_POST = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed egestas quam dui, a luctus velit condimentum sed. Maecenas eu dignissim tortor, tempus ullamcorper nisl. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestasa Phasellus quam arcu, bibendum non ipsum!';
const LOREM_COMENTARIO = 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed egestas quam dui, a luctus velit condimentum sed.';

const NOTICIAS = [
  {
    titulo: 'Feira de artesanato ocupa o centro no fim de semana',
    texto: 'Barracas de artesanato, comida típica e apresentações de forró vão ocupar a área central da cidade neste sábado e domingo, das 9h às 18h, com entrada gratuita. Parte das vagas de estacionamento fica fechada para a montagem, então a organização recomenda ir de ônibus ou de metrô.',
  },
  {
    titulo: 'Casa do Cantador abre inscrições para oficina de cordel',
    texto: 'A oficina é gratuita, para estudantes a partir de 14 anos, e ensina métrica, rima e xilogravura para a capa do folheto. As aulas são às terças e quintas à tarde, e a turma termina o curso com uma roda de repente aberta ao público.',
  },
];

const POSTS = [
  {
    autor: 'Rafael Nunes', quando: 'há 1 hora', tag: 'Comércio',
    titulo: 'Vendo hambúrgueres a menos de R$30,00!',
    texto: 'Hambúrguer artesanal com batata por R$ 28,00, de quinta a domingo, das 18h às 23h. Entrego na região da QNM e da QNN; quem preferir retirar, me chama aqui que eu passo o endereço.',
    comentarios: [
      ['Bianca Lopes', 'há 40 minutos', 'Tem opção vegetariana?'],
      ['Rafael Nunes', 'há 35 minutos', 'Tem sim, de grão-de-bico, pelo mesmo preço.'],
    ],
  },
  {
    autor: 'Aparecida F. Santos', quando: 'há 3 horas', tag: 'Geral',
    titulo: 'Mutirão de limpeza na praça da quadra no sábado',
    texto: 'Vamos juntar os vizinhos para recolher o lixo e pintar os bancos da praça, a partir das 8h. Quem puder, leve luvas e saco de lixo; a tinta foi doada pelo pessoal do comércio da quadra.',
    comentarios: [
      ['Thiago R. Melo', 'há 2 horas', 'Conta comigo, levo duas vassouras.'],
      ['Juliana Prado', 'há 1 hora', 'Chego depois do almoço, ainda dá tempo de ajudar?'],
    ],
  },
  {
    autor: 'Carlos Henrique M.', quando: 'ontem', tag: 'Escolas',
    titulo: 'Feira de ciências aberta para a comunidade',
    texto: 'Os alunos do ensino médio vão apresentar os projetos do semestre na quadra da escola, das 14h às 18h. A entrada é livre e tem até braço robótico feito com sucata.',
    comentarios: [
      ['Marina Costa', 'ontem', 'Minha filha vai mostrar um projeto de horta, passem lá!'],
      ['Pedro A. Lima', 'ontem', 'A do ano passado foi muito boa, recomendo.'],
    ],
  },
];

// Troca cada ocorrência de `alvo`, na ordem, pelo próximo item da lista.
function emOrdem(texto, alvo, itens, onde) {
  const partes = texto.split(alvo);
  if (partes.length - 1 !== itens.length) {
    throw new Error(`${onde}: esperava ${itens.length} ocorrências de ${alvo}, achei ${partes.length - 1}`);
  }
  return partes.reduce((acc, parte, i) => acc + itens[i - 1] + parte);
}

function comunidade(html) {
  const blocos = html.split('<div class="userPost">');
  if (blocos.length - 1 !== POSTS.length) throw new Error('index.ejs: quantidade de posts mudou');
  return blocos.map((bloco, i) => {
    if (i === 0) return bloco;
    const post = POSTS[i - 1];
    bloco = emOrdem(bloco, '<p id="userName">Marcos Carvalho L.</p>',
      [post.autor, ...post.comentarios.map((c) => c[0])].map((n) => `<p id="userName">${n}</p>`), 'post');
    bloco = emOrdem(bloco, '<p id="postTime">há 1 hora</p>',
      [post.quando, ...post.comentarios.map((c) => c[1])].map((q) => `<p id="postTime">${q}</p>`), 'post');
    bloco = trocar(bloco, [
      ['<h3>Vendo hambúrgueres a menos de R$30,00!</h3>', `<h3>${post.titulo}</h3>`],
      [LOREM_POST, post.texto],
      ['<span id="comercioTag">Comércio</span>', `<span id="comercioTag">${post.tag}</span>`],
    ], 'post');
    // Depois do texto do post, porque o lorem dos comentários é o começo dele.
    bloco = emOrdem(bloco, LOREM_COMENTARIO, post.comentarios.map((c) => c[2]), 'post');
    return bloco;
  }).join('<div class="userPost">');
}

function noticias(html, onde) {
  html = emOrdem(html, LOREM_NOTICIA, NOTICIAS.map((n) => n.texto), onde);
  return trocar(html, [
    ['<h3>Centro da cidade</h3>', `<h3>${NOTICIAS[0].titulo}</h3>`],
    ['<h3>Casa do Cantador</h3>', `<h3>${NOTICIAS[1].titulo}</h3>`],
  ], onde);
}

// Imagens que nunca foram enviadas ao repositório (/media) e marcas da escola.
const IMAGENS = [
  ['../media/POSTS DA COMUNIDADE.png', 'media/posts-da-comunidade.svg'],
  ['../media/User Image 2.png', 'media/usuario-2.svg'],
  ['../media/User Image 3.png', 'media/usuario-3.svg'],
  ['../media/User Image.png', 'media/usuario-1.svg'],
  ['../media/Like.png', 'media/curtir.svg'],
  ['../media/Comment.png', 'media/comentar.svg'],
  ['../media/X.png', 'media/fechar.svg'],
  ['../media/icons/closeIconBlack.webp', 'media/fechar.svg'],
  ['../media/icons/whatsappIconBlack.png', 'media/telefone-preto.svg'],
  ['../media/icons/emailIconBlack.png', 'media/email-preto.svg'],
  [CLOUD + 'v1734116310/imagescei/login/icons/whatsappIconWhite_j0d05h.png', 'media/telefone-branco.svg'],
  [CLOUD + 'v1734116308/imagescei/login/icons/emailIconWhite_phy85e.png', 'media/email-branco.svg'],
  [CLOUD + 'v1734116308/imagescei/login/icons/cem09LogoWhite_l7ibhf.png', 'media/marca.svg'],
  [CLOUD + 'v1734116309/imagescei/login/icons/ico_q08931.ico', 'media/icone.svg'],
];

const ROTAS = {
  '/': 'index.html', '/index': 'index.html', '/noticias': 'noticias.html',
  '/login': 'login.html', '/logout': 'login.html', '/perfil': 'perfil.html',
};
const FORMULARIOS = { '/login': 'login', '/cadastro': 'cadastro', '/upload': 'nao-salva', '/profile/update': 'nao-salva' };

function rotear(html) {
  for (const [antes, depois] of IMAGENS) html = html.split(antes).join(depois);
  html = html.replace(/<form([^>]*)\saction="([^"]*)"/g, (tudo, antes, url) => {
    const acao = FORMULARIOS[url.toLowerCase()];
    if (!acao) throw new Error('formulário sem tratamento: ' + url);
    return `<form${antes} action="#" data-demo="${acao}"`;
  });
  html = html.replace(/\s(href|src)=(["'])(\/[^"']*)\2/g, (tudo, attr, q, url) => {
    if (url.startsWith('/css/') || url.startsWith('/js/')) return ` ${attr}="${url.slice(1)}"`;
    const destino = ROTAS[url.toLowerCase()];
    if (destino) return ` ${attr}="${destino}"`;
    throw new Error('rota sem destino: ' + url);
  });
  return html.replace(/<li><a href="#">(Comunidade|Contato)<\/a><\/li>/g, '<li><a href="#" data-demo-ausente>$1</a></li>');
}

function finalizar(html, pagina) {
  html = html.replace(/<html lang="[^"]*">/, `<html lang="pt-BR" data-pagina="${pagina}">`);
  html = rotear(html);
  return montarPagina(html, {
    id: ID,
    cabeca: '<link rel="stylesheet" href="css/demo.css">\n    <script src="js/demo.js"></script>',
    classeBody: `demo-${pagina}`,
  });
}

const render = (view, dados) => ejs.renderFile(path.join(VIEWS, view), dados);

export async function gerar() {
  const destino = pastaLimpa(ID);
  const pagina = (nome, html) => gravar(path.join(destino, nome), html);

  copiarPasta(path.join(REPO, 'public', 'js'), path.join(destino, 'js'));
  copiarPasta(path.join(REPO, 'public', 'css'), path.join(destino, 'css'));

  // A fonte de jornal (/font) nunca foi enviada ao repositório; no lugar dela
  // entra a IM Fell English, do Google Fonts, com cara parecida.
  const css = path.join(destino, 'css', 'index.css');
  let indice = fs.readFileSync(css, 'utf8');
  indice = trocar(indice, [
    [/\/\* Font Import \*\/\s*@font-face \{[^}]*\}/, "/* Font Import */\n@import url('https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=swap');"],
    [/font-family: 'OldNewspaperTypesRegular';/g, "font-family: 'IM Fell English', 'Times New Roman', serif;"],
  ], 'index.css');
  gravar(css, indice);

  copiarPasta(path.join(EXTRAS, 'media'), path.join(destino, 'media'));
  copiarPasta(path.join(EXTRAS, 'js'), path.join(destino, 'js'));
  copiarPasta(path.join(EXTRAS, 'css'), path.join(destino, 'css'));

  const sessao = {};

  let inicio = await render('index.ejs', { session: sessao });
  inicio = comunidade(noticias(inicio, 'index.ejs'));
  pagina('index.html', finalizar(inicio, 'inicio'));

  pagina('noticias.html', finalizar(noticias(await render('noticias.ejs', { session: sessao }), 'noticias.ejs'), 'noticias'));

  let login = await render('login.ejs', { session: sessao });
  login = trocar(login, [
    ['<title>CEM 09 - Entrar</title>', '<title>Ceilândia Times - Entrar</title>'],
    ['class="logoCem09">', 'class="logoCem09" alt="Ceilândia Times">'],
    [/\(\d{2}\) [\d-]+ <a id="openWhatsapp" href="https:\/\/wa\.me\/\d+">Abrir no Whatsapp<\/a>/g,
      '(61) 0000-0000 <a id="openWhatsapp" href="#" data-demo-ausente>Ligar</a>'],
    [/[\w.-]+@[\w.-]+ <a id="openEmail" href="mailto:[^"]+">Abrir email<\/a>/g,
      'contato@exemplo.com <a id="openEmail" href="#" data-demo-ausente>Abrir email</a>'],
    ['contate a direção da escola em:', 'fale com a equipe do jornal em:'],
    ['Todos os direitos reservados © 2024 - Centro de Ensino Médio 09 de Ceilândia', 'Ceilândia Times, projeto de hackathon (2024)'],
    ['<input type="password" name="senha" id="senha2" placeholder="•••••" required>',
      '<input type="password" name="senha" id="senha2" placeholder="•••••" value="demo123" required>'],
  ], 'login.ejs');
  // O e-mail do login é o segundo campo com id="email" (o primeiro é o do cadastro).
  const campoEmail = '<input type="email" name="email" id="email" placeholder="Ex.: joao@gmail.com" required>';
  login = emOrdem(login, campoEmail, [
    campoEmail,
    `<input type="email" name="email" id="email" placeholder="Ex.: joao@gmail.com" value="${LEITORA.email}" required>`,
  ], 'login.ejs');
  pagina('login.html', finalizar(login, 'login'));

  pagina('perfil.html', finalizar(await render('perfil.ejs', { usuario: LEITORA, session: { user: LEITORA } }), 'perfil'));

  console.log('ok', ID);
}
