// Backend simulado da Arraiá Show API. Reproduz, sobre dados em memória, o
// que src/server.js, os controllers e o MySQL fazem no projeto original:
// mesmas rotas, mesma ordem dos middlewares, mesmos status e mensagens.

export const SENHA_DEMO = 'demo1234';
const CHAVE_JWT = 'arraia-show-demo-chave-publica';
const DUAS_HORAS = 2 * 60 * 60;

// ---------- Dados de exemplo (bd/Arraiabd.sql) ----------
// As senhas do seed foram trocadas pela senha de demonstração.
function dadosIniciais() {
  return {
    usuarios: [
      { id: 1, nome: 'Administrador', email: 'admin@evento.com', senha: SENHA_DEMO, tipo: 'admin', criado_em: '2026-06-01T12:00:00.000Z' },
      { id: 2, nome: 'João Barraqueiro', email: 'joao@barraca.com', senha: SENHA_DEMO, tipo: 'barraqueiro', criado_em: '2026-06-01T12:00:00.000Z' },
      { id: 3, nome: 'Maria Participante', email: 'maria@cliente.com', senha: SENHA_DEMO, tipo: 'participante', criado_em: '2026-06-01T12:00:00.000Z' },
    ],
    eventos: [
      { id: 1, nome: 'Festa Junina 2026', data_evento: '2026-06-24', ativo: 1 },
    ],
    barracas: [
      { id: 1, evento_id: 1, nome: 'Barraca do Milho', responsavel_id: 2 },
    ],
    produtos: [
      { id: 1, barraca_id: 1, nome: 'Milho Cozido', preco: '5.00', estoque: 100 },
      { id: 2, barraca_id: 1, nome: 'Pamonha', preco: '8.00', estoque: 50 },
    ],
    pedidos: [
      { id: 1, usuario_id: 3, total: '13.00', status: 'pendente' },
    ],
    itens_pedido: [
      { id: 1, pedido_id: 1, produto_id: 1, quantidade: 1, subtotal: '5.00' },
      { id: 2, pedido_id: 1, produto_id: 2, quantidade: 1, subtotal: '8.00' },
    ],
    proximoId: { usuarios: 4, eventos: 2, barracas: 2, produtos: 3 },
  };
}

let db = dadosIniciais();
export function restaurarDados() { db = dadosIniciais(); }
export function tabelas() { return db; }

// ---------- Erros no formato do mysql2 ----------
// O controller devolve o erro cru (res.status(500).json(err)); o JSON de um
// erro do mysql2 traz estes campos.
const SQLSTATE = { 1048: '23000', 1451: '23000', 1452: '23000', 1292: '22007', 1366: 'HY000', 1406: '22001' };
class ErroMySQL extends Error {
  constructor(code, errno, sqlMessage, sql) {
    super(sqlMessage);
    this.corpo = { code, errno, sqlState: SQLSTATE[errno], sqlMessage, sql };
  }
}

// Formata a SQL como o mysql2 faz ao trocar os "?" pelos valores.
function formatarSql(sql, valores) {
  let i = 0;
  return sql.replace(/\?/g, () => escapar(valores[i++]));
}
function escapar(v) {
  if (v === undefined || v === null) return 'NULL';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return v.map(escapar).join(', ');
  if (typeof v === 'object') return Object.entries(v).map(([k, x]) => '`' + k + '` = ' + escapar(x)).join(', ');
  return "'" + String(v).replace(/[\\']/g, (c) => '\\' + c) + "'";
}

const ERRO_NULO = (coluna, sql) => new ErroMySQL('ER_BAD_NULL_ERROR', 1048, `Column '${coluna}' cannot be null`, sql);

function inteiro(valor, coluna, sql, { nulo = true } = {}) {
  if (valor === undefined || valor === null) {
    if (!nulo) throw ERRO_NULO(coluna, sql);
    return null;
  }
  if (typeof valor === 'boolean') return valor ? 1 : 0;
  if (typeof valor === 'number' && Number.isFinite(valor)) return Math.round(valor);
  if (typeof valor === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(valor)) return Math.round(Number(valor));
  throw new ErroMySQL('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 1366,
    `Incorrect integer value: '${typeof valor === 'object' ? JSON.stringify(valor) : valor}' for column '${coluna}' at row 1`, sql);
}

function decimal(valor, coluna, sql) {
  if (valor === undefined || valor === null) throw ERRO_NULO(coluna, sql);
  if (typeof valor === 'boolean') return (valor ? 1 : 0).toFixed(2);
  if (typeof valor === 'number' && Number.isFinite(valor)) return valor.toFixed(2);
  if (typeof valor === 'string' && /^\s*-?\d+(\.\d+)?\s*$/.test(valor)) return Number(valor).toFixed(2);
  throw new ErroMySQL('ER_TRUNCATED_WRONG_VALUE_FOR_FIELD', 1366,
    `Incorrect decimal value: '${typeof valor === 'object' ? JSON.stringify(valor) : valor}' for column '${coluna}' at row 1`, sql);
}

function texto(valor, coluna, sql, limite = 100) {
  if (valor === undefined || valor === null) throw ERRO_NULO(coluna, sql);
  const s = typeof valor === 'object' ? JSON.stringify(valor) : String(valor);
  if (s.length > limite) throw new ErroMySQL('ER_DATA_TOO_LONG', 1406, `Data too long for column '${coluna}' at row 1`, sql);
  return s;
}

function data(valor, coluna, sql) {
  if (valor === undefined || valor === null) throw ERRO_NULO(coluna, sql);
  const m = String(valor).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T]\d{2}:\d{2}(?::\d{2})?)?$/);
  const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  if (!m || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
    throw new ErroMySQL('ER_TRUNCATED_WRONG_VALUE', 1292, `Incorrect date value: '${valor}' for column '${coluna}' at row 1`, sql);
  }
  return `${m[1]}-${m[2]}-${m[3]}`;
}

// Um parâmetro de rota chega como texto; o MySQL converte para número ao
// comparar com a coluna id (o prefixo numérico vale, o resto vira 0).
function idDaRota(s) {
  const n = parseFloat(s);
  return Number.isNaN(n) ? 0 : n;
}

// mysql2 devolve DATE como Date no fuso do servidor (Brasília) e o JSON sai em UTC.
function linhaEvento(e) {
  return { ...e, data_evento: new Date(e.data_evento + 'T00:00:00-03:00').toISOString() };
}

const igualEmail = (a, b) => String(a).trimEnd().toLowerCase() === String(b).trimEnd().toLowerCase();

// ---------- JWT (HS256 com Web Crypto) ----------
const codificador = new TextEncoder();
let chaveHmac;
function chave() {
  if (!chaveHmac) {
    chaveHmac = crypto.subtle.importKey('raw', codificador.encode(CHAVE_JWT), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
  }
  return chaveHmac;
}
function b64url(bytes) {
  let bin = '';
  for (const b of new Uint8Array(bytes)) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function deB64url(s) {
  const bin = atob(s.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((s.length + 3) % 4));
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export async function assinarJwt(dados) {
  const agora = Math.floor(Date.now() / 1000);
  const cabeca = b64url(codificador.encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const corpo = b64url(codificador.encode(JSON.stringify({ ...dados, iat: agora, exp: agora + DUAS_HORAS })));
  const assinatura = await crypto.subtle.sign('HMAC', await chave(), codificador.encode(`${cabeca}.${corpo}`));
  return `${cabeca}.${corpo}.${b64url(assinatura)}`;
}

async function verificarJwt(token) {
  const partes = token.split('.');
  if (partes.length !== 3) throw new Error('jwt malformed');
  const [cabeca, corpo, assinatura] = partes;
  let ok = false;
  try {
    ok = await crypto.subtle.verify('HMAC', await chave(), deB64url(assinatura), codificador.encode(`${cabeca}.${corpo}`));
  } catch (e) {
    throw new Error('invalid signature');
  }
  if (!ok) throw new Error('invalid signature');
  const dados = JSON.parse(new TextDecoder().decode(deB64url(corpo)));
  if (dados.exp && dados.exp <= Math.floor(Date.now() / 1000)) throw new Error('jwt expired');
  return dados;
}

// ---------- Respostas ----------
const json = (status, corpo) => ({ status, tipo: 'application/json; charset=utf-8', corpo });
const html = (status, mensagem) => ({
  status,
  tipo: 'text/html; charset=utf-8',
  corpo: `<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="utf-8">\n<title>Error</title>\n</head>\n<body>\n<pre>${mensagem}</pre>\n</body>\n</html>\n`,
});
// Sem resposta: o processo do Node cairia (rejeição não tratada).
const semResposta = (motivo) => ({ status: 0, tipo: null, corpo: null, motivo });

// ---------- Controllers ----------
const auth = {
  // POST /auth/registrar
  async registrar(req) {
    const { nome, email, senha, tipo } = req.body;
    if (typeof senha !== 'string') return json(500, { error: 'Erro interno' }); // bcrypt.hash lança
    const sql = 'INSERT INTO usuarios (nome, email, senha_hash, tipo) VALUES (?, ?, ?, ?)';
    try {
      const linha = {
        nome: texto(nome, 'nome', sql),
        email: texto(email, 'email', sql),
        senha,
        tipo: tipo || 'participante',
      };
      if (!['admin', 'organizador', 'barraqueiro', 'participante'].includes(linha.tipo)) throw new Error('enum');
      if (db.usuarios.some((u) => igualEmail(u.email, linha.email))) throw new Error('duplicado');
      db.usuarios.push({ id: db.proximoId.usuarios++, ...linha, criado_em: new Date().toISOString() });
      return json(201, { message: 'Usuário criado!' });
    } catch (e) {
      return json(500, { error: 'Erro ao cadastrar' });
    }
  },

  // POST /auth/login
  async login(req) {
    const { email, senha } = req.body;
    const usuario = email === undefined || email === null ? undefined : db.usuarios.find((u) => igualEmail(u.email, email));
    if (!usuario) return json(401, { message: 'Credenciais inválidas' });
    if (typeof senha !== 'string') {
      return semResposta('bcrypt.compare recebeu a senha vazia e lançou um erro dentro do callback do mysql2. '
        + 'Ninguém trata essa rejeição, então o processo do Node cai e a conexão é encerrada sem resposta.');
    }
    if (senha !== usuario.senha) return json(401, { message: 'Senha incorreta' });
    const token = await assinarJwt({ id: usuario.id, tipo: usuario.tipo });
    return json(200, { token, user: { nome: usuario.nome, tipo: usuario.tipo } });
  },
};

// Middleware aplicado a tudo que vem depois de /auth.
async function verificarToken(req) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return json(401, { message: 'Token não fornecido' });
  try {
    req.user = await verificarJwt(token);
    return null;
  } catch (e) {
    return json(403, { message: 'Token inválido' });
  }
}

const eventos = {
  criarEvento(req) {
    const { nome, data: dataEvento, ativo } = req.body;
    const sql = formatarSql('INSERT INTO eventos (nome, data_evento, ativo) VALUES (?, ?, ?)', [nome, dataEvento, ativo]);
    try {
      const linha = {
        nome: texto(nome, 'nome', sql),
        data_evento: data(dataEvento, 'data_evento', sql),
        ativo: inteiro(ativo, 'ativo', sql),
      };
      const id = db.proximoId.eventos++;
      db.eventos.push({ id, ...linha });
      return json(201, { message: 'Evento criado com sucesso!', id });
    } catch (e) {
      if (e instanceof ErroMySQL) return json(500, e.corpo);
      throw e;
    }
  },
  listarEventos() {
    return json(200, db.eventos.map(linhaEvento));
  },
  listarEventoPorId(req) {
    const evento = db.eventos.find((e) => e.id === idDaRota(req.params.id));
    if (!evento) return json(404, { message: 'Evento não encontrado' });
    return json(200, linhaEvento(evento));
  },
};

const barracas = {
  criarBarraca(req) {
    const { evento_id, nome, responsavel_id } = req.body;
    const sql = formatarSql('INSERT INTO barracas (evento_id, nome, responsavel_id) VALUES (?, ?, ?)', [evento_id, nome, responsavel_id]);
    try {
      const linha = {
        evento_id: inteiro(evento_id, 'evento_id', sql, { nulo: false }),
        nome: texto(nome, 'nome', sql),
        responsavel_id: inteiro(responsavel_id, 'responsavel_id', sql),
      };
      if (!db.eventos.some((e) => e.id === linha.evento_id)) throw new Error('fk evento');
      if (linha.responsavel_id !== null && !db.usuarios.some((u) => u.id === linha.responsavel_id)) throw new Error('fk usuario');
      const id = db.proximoId.barracas++;
      db.barracas.push({ id, ...linha });
      return json(201, { message: 'Barraca cadastrada com sucesso!', id });
    } catch (e) {
      return json(500, { error: 'Erro ao criar barraca. Verifique se o Evento e o Responsável existem.' });
    }
  },
  listarBarracasPorEvento(req) {
    return json(200, db.barracas.filter((b) => b.evento_id === idDaRota(req.params.eventoId)));
  },
  listartodasBarracas() {
    return json(200, db.barracas);
  },
};

const FK_PRODUTO = 'Cannot add or update a child row: a foreign key constraint fails (`arraia_show`.`produtos`, CONSTRAINT `produtos_ibfk_1` FOREIGN KEY (`barraca_id`) REFERENCES `barracas` (`id`))';
const FK_ITEM = 'Cannot delete or update a parent row: a foreign key constraint fails (`arraia_show`.`itens_pedido`, CONSTRAINT `itens_pedido_ibfk_2` FOREIGN KEY (`produto_id`) REFERENCES `produtos` (`id`))';

const produtos = {
  criarProduto(req) {
    const { barraca_id, nome, preco, estoque } = req.body;
    const sql = formatarSql('INSERT INTO produtos (barraca_id, nome, preco, estoque) VALUES (?, ?, ?, ?)', [barraca_id, nome, preco, estoque]);
    try {
      const linha = {
        barraca_id: inteiro(barraca_id, 'barraca_id', sql, { nulo: false }),
        nome: texto(nome, 'nome', sql),
        preco: decimal(preco, 'preco', sql),
        estoque: inteiro(estoque, 'estoque', sql, { nulo: false }),
      };
      if (!db.barracas.some((b) => b.id === linha.barraca_id)) {
        throw new ErroMySQL('ER_NO_REFERENCED_ROW_2', 1452, FK_PRODUTO, sql);
      }
      const id = db.proximoId.produtos++;
      db.produtos.push({ id, ...linha });
      return json(201, { message: 'Produto criado com sucesso!', id });
    } catch (e) {
      if (e instanceof ErroMySQL) return json(500, e.corpo);
      throw e;
    }
  },
  listarProdutosPorBarraca(req) {
    return json(200, db.produtos.filter((p) => p.barraca_id === idDaRota(req.params.barracaId)));
  },
  atualizarProduto(req) {
    const { id } = req.params;
    const { nome, preco, estoque } = req.body;
    const sql = formatarSql('UPDATE produtos SET nome = ?, preco = ?, estoque = ? WHERE id = ?', [nome, preco, estoque, id]);
    const produto = db.produtos.find((p) => p.id === idDaRota(id));
    // Sem linha encontrada, o UPDATE não altera nada e o controller responde 200 mesmo assim.
    if (!produto) return json(200, { message: 'Produto atualizado com sucesso!' });
    try {
      const novo = {
        nome: texto(nome, 'nome', sql),
        preco: decimal(preco, 'preco', sql),
        estoque: inteiro(estoque, 'estoque', sql, { nulo: false }),
      };
      Object.assign(produto, novo);
      return json(200, { message: 'Produto atualizado com sucesso!' });
    } catch (e) {
      if (e instanceof ErroMySQL) return json(500, e.corpo);
      throw e;
    }
  },
  deletarProduto(req) {
    const { id } = req.params;
    const alvo = idDaRota(id);
    const sql = formatarSql('DELETE FROM produtos WHERE id = ?', [id]);
    if (db.itens_pedido.some((i) => i.produto_id === alvo)) {
      return json(500, new ErroMySQL('ER_ROW_IS_REFERENCED_2', 1451, FK_ITEM, sql).corpo);
    }
    db.produtos = db.produtos.filter((p) => p.id !== alvo);
    return json(200, { message: 'Produto deletado com sucesso!' });
  },
  listarTodosProdutos() {
    return json(200, db.produtos);
  },
};

// ---------- Rotas (mesma ordem do src/server.js e dos arquivos de rotas) ----------
export const ROTAS = [
  { metodo: 'POST', caminho: '/auth/registrar', fn: auth.registrar, publica: true, grupo: 'Autenticação', resumo: 'Cria um usuário' },
  { metodo: 'POST', caminho: '/auth/login', fn: auth.login, publica: true, grupo: 'Autenticação', resumo: 'Devolve um token válido por 2 horas' },
  { metodo: 'POST', caminho: '/barracas', fn: barracas.criarBarraca, grupo: 'Barracas', resumo: 'Cadastra uma barraca' },
  { metodo: 'GET', caminho: '/barracas/evento/:eventoId', fn: barracas.listarBarracasPorEvento, grupo: 'Barracas', resumo: 'Barracas de um evento' },
  { metodo: 'GET', caminho: '/barracas', fn: barracas.listartodasBarracas, grupo: 'Barracas', resumo: 'Todas as barracas' },
  { metodo: 'POST', caminho: '/eventos', fn: eventos.criarEvento, grupo: 'Eventos', resumo: 'Cria um evento' },
  { metodo: 'GET', caminho: '/eventos', fn: eventos.listarEventos, grupo: 'Eventos', resumo: 'Lista os eventos' },
  { metodo: 'GET', caminho: '/eventos/:id', fn: eventos.listarEventoPorId, grupo: 'Eventos', resumo: 'Um evento pelo id' },
  { metodo: 'POST', caminho: '/produtos', fn: produtos.criarProduto, grupo: 'Produtos', resumo: 'Cadastra um produto' },
  { metodo: 'GET', caminho: '/produtos', fn: produtos.listarTodosProdutos, grupo: 'Produtos', resumo: 'Todos os produtos' },
  { metodo: 'GET', caminho: '/produtos/barraca/:barracaId', fn: produtos.listarProdutosPorBarraca, grupo: 'Produtos', resumo: 'Produtos de uma barraca' },
  { metodo: 'DELETE', caminho: '/produtos/deletar/:id', fn: produtos.deletarProduto, grupo: 'Produtos', resumo: 'Apaga um produto' },
  { metodo: 'PUT', caminho: '/produtos/atualizar/:id', fn: produtos.atualizarProduto, grupo: 'Produtos', resumo: 'Atualiza nome, preço e estoque' },
];

// Casa o caminho como o Express: sem diferenciar maiúsculas e aceitando barra final.
function casar(modelo, caminho) {
  const a = modelo.split('/').filter(Boolean);
  const b = caminho.split('/').filter(Boolean);
  if (a.length !== b.length) return null;
  const params = {};
  for (let i = 0; i < a.length; i++) {
    if (a[i].startsWith(':')) {
      params[a[i].slice(1)] = decodeURIComponent(b[i]);
    } else if (a[i].toLowerCase() !== b[i].toLowerCase()) {
      return null;
    }
  }
  return params;
}

function lerCorpo(texto, metodo) {
  if (metodo === 'GET' || metodo === 'DELETE') return { corpo: undefined };
  if (!texto || !texto.trim()) return { corpo: undefined };
  try {
    const corpo = JSON.parse(texto);
    // O express.json() em modo estrito só aceita objeto ou array.
    if (corpo === null || typeof corpo !== 'object') {
      return { erro: html(400, `SyntaxError: Unexpected token in JSON at position 0`) };
    }
    return { corpo };
  } catch (e) {
    return { erro: html(400, `SyntaxError: ${e.message}`) };
  }
}

// Ponto de entrada: recebe a requisição e devolve { status, tipo, corpo }.
export async function atender({ metodo, caminho, headers = {}, corpo: textoCorpo }) {
  metodo = metodo.toUpperCase();
  caminho = caminho.split('?')[0] || '/';
  if (!caminho.startsWith('/')) caminho = '/' + caminho;

  const lido = lerCorpo(textoCorpo, metodo);
  if (lido.erro) return lido.erro;
  const req = { headers: {}, params: {}, body: lido.corpo };
  for (const [k, v] of Object.entries(headers)) req.headers[k.toLowerCase()] = v;

  const executar = async (rota, params) => {
    req.params = params;
    if (req.body === undefined && (metodo === 'POST' || metodo === 'PUT')) {
      // Express 5 deixa req.body undefined sem corpo; a desestruturação no controller quebra.
      const campo = { registrar: 'nome', login: 'email', criarBarraca: 'evento_id', criarEvento: 'nome', criarProduto: 'barraca_id', atualizarProduto: 'nome' }[rota.fn.name] || 'nome';
      return html(500, `TypeError: Cannot destructure property '${campo}' of 'req.body' as it is undefined.`);
    }
    if (req.body === undefined) req.body = {};
    return rota.fn(req);
  };

  for (const rota of ROTAS.filter((r) => r.publica)) {
    const params = rota.metodo === metodo && casar(rota.caminho, caminho);
    if (params) return executar(rota, params);
  }

  const negado = await verificarToken(req);
  if (negado) return negado;

  for (const rota of ROTAS.filter((r) => !r.publica)) {
    const params = rota.metodo === metodo && casar(rota.caminho, caminho);
    if (params) return executar(rota, params);
  }
  return html(404, `Cannot ${metodo} ${caminho}`);
}
