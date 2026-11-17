// POST /api/monitor/testar
// Backend da demonstração do api-monitor. Faz um GET na URL informada e devolve
// só o resumo do teste (status, latência, Content-Type e o veredito de SLA),
// seguindo as mesmas regras do ApiTestService do projeto em Java.
//
// Corpo aceito: { "url": "https://..." }  ou  { "urls": ["https://...", ...] } (até 5)

const LATENCIA_MAXIMA_MS = 50000;            // MAX_LATENCY_MS do serviço Java
const CONTENT_TYPE_ESPERADO = 'application/json';
const TIMEOUT_MS = 8000;
const MAX_REDIRECTS = 3;
const MAX_URLS = 5;
const MAX_TAMANHO_URL = 2048;
const MAX_CORPO_PEDIDO = 16 * 1024;

// Limite simples por IP, por instância (não é global, só evita uso em rajada).
const JANELA_MS = 60_000;
const MAX_URLS_POR_JANELA = 30;
const contagem = new Map();

function json(dados, status = 200, extras = {}) {
  return new Response(JSON.stringify(dados), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...extras,
    },
  });
}

function erro(status, mensagem) {
  return json({ erro: mensagem }, status);
}

// ---------- Validação de destino ----------

function ipv4ParaNumeros(host) {
  const partes = host.split('.');
  if (partes.length !== 4) return null;
  const n = partes.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (n.some((x) => Number.isNaN(x) || x > 255)) return null;
  return n;
}

function ipv4Bloqueado([a, b, c]) {
  return (
    a === 0 ||                                  // 0.0.0.0/8
    a === 10 ||                                 // privada
    a === 127 ||                                // loopback
    (a === 100 && b >= 64 && b <= 127) ||       // CGNAT
    (a === 169 && b === 254) ||                 // link-local (inclui metadados de nuvem)
    (a === 172 && b >= 16 && b <= 31) ||        // privada
    (a === 192 && b === 168) ||                 // privada
    (a === 192 && b === 0 && c === 0) ||        // reservada IETF
    (a === 198 && (b === 18 || b === 19)) ||    // testes de rede
    a >= 224                                    // multicast e reservadas
  );
}

function ipv6Bloqueado(host) {
  const h = host.toLowerCase();
  if (h === '::' || h === '::1') return true;
  if (/^f[cd][0-9a-f]{2}:/.test(h)) return true;          // fc00::/7 (ULA)
  if (/^fe[89ab][0-9a-f]:/.test(h)) return true;          // fe80::/10 (link-local)
  if (/^ff[0-9a-f]{2}:/.test(h)) return true;             // multicast
  // IPv4 mapeado/compatível (::ffff:7f00:1, ::ffff:127.0.0.1, ::7f00:1 ...)
  if (h.startsWith('::ffff:') || /^::[0-9a-f]{1,4}(:[0-9a-f]{1,4})?$/.test(h) || h.startsWith('64:ff9b:')) {
    return true;
  }
  return false;
}

// Devolve null se a URL pode ser testada, ou o motivo da recusa.
function motivoRecusa(url) {
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    return 'Só são aceitas URLs http ou https.';
  }
  if (url.username || url.password) {
    return 'URLs com usuário e senha não são aceitas.';
  }
  if (url.port && url.port !== '80' && url.port !== '443') {
    return 'Só as portas padrão (80 e 443) são aceitas na demonstração.';
  }
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  if (!host) return 'URL sem host.';
  if (host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local') || host.endsWith('.internal')) {
    return 'Endereços locais não podem ser testados.';
  }
  if (host.startsWith('[')) {
    if (ipv6Bloqueado(host.slice(1, -1))) return 'Endereços de rede privada ou local não podem ser testados.';
    return null;
  }
  const v4 = ipv4ParaNumeros(host);
  if (v4 && ipv4Bloqueado(v4)) return 'Endereços de rede privada ou local não podem ser testados.';
  if (!v4 && !host.includes('.')) return 'Informe um domínio completo (ex.: api.exemplo.com).';
  return null;
}

// O host pode ser um nome que aponta para um IP interno (ex.: 127.0.0.1.nip.io).
// Resolve via DNS sobre HTTPS e recusa se algum endereço cair numa faixa bloqueada.
async function resolveParaRedeInterna(url) {
  const host = url.hostname.replace(/\.$/, '');
  if (host.startsWith('[') || ipv4ParaNumeros(host)) return false; // IP literal já foi checado
  const consultar = async (tipo) => {
    const r = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(host)}&type=${tipo}`, {
      headers: { 'Accept': 'application/dns-json' },
      signal: AbortSignal.timeout(3000),
    });
    if (!r.ok) throw new Error('dns');
    const dados = await r.json();
    return (dados.Answer || []).filter((a) => a.type === 1 || a.type === 28).map((a) => a.data);
  };
  const [v4, v6] = await Promise.all([consultar('A'), consultar('AAAA')]);
  return v4.some((ip) => { const n = ipv4ParaNumeros(ip); return !n || ipv4Bloqueado(n); })
    || v6.some((ip) => ipv6Bloqueado(ip));
}

async function destinoInterno(url) {
  try {
    return await resolveParaRedeInterna(url);
  } catch {
    return false; // sem resposta do DNS o próprio fetch vai falhar ou seguir o caminho normal
  }
}

function interpretarUrl(texto) {
  if (typeof texto !== 'string') return { recusa: 'Cada URL deve ser um texto.' };
  const limpo = texto.trim();
  if (!limpo) return { recusa: 'URL vazia.' };
  if (limpo.length > MAX_TAMANHO_URL) return { recusa: 'URL longa demais.' };
  let url;
  try {
    url = new URL(limpo);
  } catch {
    return { recusa: 'URL inválida: ' + limpo.slice(0, 120) };
  }
  const motivo = motivoRecusa(url);
  return motivo ? { recusa: motivo + ' (' + limpo.slice(0, 120) + ')' } : { url };
}

// ---------- Execução do teste ----------

function conteudoValido(contentType) {
  return contentType != null && contentType.toLowerCase().includes(CONTENT_TYPE_ESPERADO);
}

async function descartarCorpo(resposta) {
  try { await resposta.body?.cancel(); } catch { /* nada a fazer */ }
}

async function testarUrl(urlInicial) {
  const controle = new AbortController();
  const relogio = setTimeout(() => controle.abort(), TIMEOUT_MS);
  const inicio = Date.now();
  let atual = urlInicial;

  try {
    for (let salto = 0; ; salto++) {
      const resposta = await fetch(atual.toString(), {
        method: 'GET',
        redirect: 'manual',
        signal: controle.signal,
        headers: {
          'Accept': 'application/json, text/plain, */*',
          'User-Agent': 'api-monitor-demo/1.0',
        },
      });
      const status = resposta.status;

      if (status >= 300 && status < 400 && resposta.headers.has('location')) {
        await descartarCorpo(resposta);
        if (salto >= MAX_REDIRECTS) {
          return falha(status, Date.now() - inicio, null,
            `Erro de Status HTTP (não 2xx): ${status}. Mais de ${MAX_REDIRECTS} redirecionamentos.`);
        }
        let proximo;
        try {
          proximo = new URL(resposta.headers.get('location'), atual);
        } catch {
          return falha(status, Date.now() - inicio, null, 'Redirecionamento com destino inválido.');
        }
        if (motivoRecusa(proximo) || await destinoInterno(proximo)) {
          return falha(status, Date.now() - inicio, null, 'Redirecionamento para destino não permitido.');
        }
        atual = proximo;
        continue;
      }

      // Para de medir assim que os cabeçalhos chegam; o corpo nunca é lido.
      const latencia = Date.now() - inicio;
      const contentType = resposta.headers.get('content-type');
      await descartarCorpo(resposta);
      return avaliar(status, resposta.statusText, latencia, contentType);
    }
  } catch {
    // Timeout, DNS, TLS ou conexão recusada: no Java cai em ResourceAccessException.
    return falha(0, Date.now() - inicio, null,
      'Erro de Conexão (Timeout/Indisponível): O serviço não respondeu. ');
  } finally {
    clearTimeout(relogio);
  }
}

function falha(status, latenciaMs, contentType, motivo) {
  return { status, latenciaMs, contentType, sucesso: false, motivo };
}

// Mesmas regras do ApiTestService.runTest.
function avaliar(status, statusText, latenciaMs, contentType) {
  const descricao = `${status}${statusText ? ' ' + statusText : ''}`;

  if (status >= 400 && status < 500) {
    return falha(status, latenciaMs, contentType, `Erro de Cliente: Status ${status}. ${descricao}`);
  }
  if (status >= 500) {
    return falha(status, latenciaMs, contentType, `Erro Desconhecido ou 5xx Server Error: ${descricao}`);
  }

  const status2xx = status >= 200 && status < 300;
  let latenciaOk = true;
  let conteudoOk = true;
  let detalhes = '';

  if (status2xx) {
    latenciaOk = latenciaMs <= LATENCIA_MAXIMA_MS;
    if (!latenciaOk) {
      detalhes += ` (Latência acima de ${LATENCIA_MAXIMA_MS}ms: ${latenciaMs}ms)`;
    }
    conteudoOk = conteudoValido(contentType);
    if (!conteudoOk) {
      detalhes += ` (Content-Type esperado '${CONTENT_TYPE_ESPERADO}' inválido/ausente)`;
    }
  }

  const sucesso = status2xx && latenciaOk && conteudoOk;
  let motivo;
  if (sucesso) motivo = 'Teste completo: Sucesso.';
  else if (status2xx) motivo = 'Status 2xx OK, mas Falha no SLA.' + detalhes;
  else motivo = `Erro de Status HTTP (não 2xx): ${status}`;

  return { status, latenciaMs, contentType, sucesso, motivo };
}

// ---------- Handlers ----------

function origemPermitida(request) {
  const origem = request.headers.get('Origin');
  if (!origem) return true; // chamadas sem navegador (curl) não mandam Origin
  return origem === new URL(request.url).origin;
}

function dentroDoLimite(request, quantidade) {
  const ip = request.headers.get('CF-Connecting-IP') || 'local';
  const agora = Date.now();
  const registro = contagem.get(ip);
  if (!registro || agora - registro.inicio > JANELA_MS) {
    contagem.set(ip, { inicio: agora, total: quantidade });
  } else {
    registro.total += quantidade;
    if (registro.total > MAX_URLS_POR_JANELA) return false;
  }
  if (contagem.size > 5000) contagem.clear();
  return true;
}

export async function onRequestPost({ request }) {
  if (!origemPermitida(request)) return erro(403, 'Origem não permitida.');

  const tipo = request.headers.get('Content-Type') || '';
  if (!tipo.toLowerCase().includes('application/json')) {
    return erro(400, 'Envie o corpo como JSON.');
  }

  const declarado = Number(request.headers.get('Content-Length') || 0);
  if (declarado > MAX_CORPO_PEDIDO) return erro(400, 'Corpo do pedido grande demais.');
  const texto = await request.text();
  if (texto.length > MAX_CORPO_PEDIDO) return erro(400, 'Corpo do pedido grande demais.');

  let corpo;
  try {
    corpo = JSON.parse(texto);
  } catch {
    return erro(400, 'JSON inválido.');
  }
  if (!corpo || typeof corpo !== 'object' || Array.isArray(corpo)) {
    return erro(400, 'Envie { "url": "..." } ou { "urls": [...] }.');
  }

  const lote = Array.isArray(corpo.urls);
  const entradas = lote ? corpo.urls : [corpo.url];
  if (!lote && corpo.url === undefined) return erro(400, 'Informe a URL a testar.');
  if (entradas.length === 0) return erro(400, 'A lista de URLs está vazia.');
  if (entradas.length > MAX_URLS) return erro(400, `No máximo ${MAX_URLS} URLs por lote.`);

  const urls = [];
  for (const entrada of entradas) {
    const { url, recusa } = interpretarUrl(entrada);
    if (recusa) return erro(400, recusa);
    urls.push(url);
  }
  for (const url of urls) {
    if (await destinoInterno(url)) {
      return erro(400, `Endereços de rede privada ou local não podem ser testados. (${url.hostname})`);
    }
  }

  if (!dentroDoLimite(request, urls.length)) {
    return json({ erro: 'Muitos testes em pouco tempo. Aguarde um minuto.' }, 429, { 'Retry-After': '60' });
  }

  // Como no runMultipleTests do Java, as URLs são testadas uma de cada vez.
  const resultados = [];
  for (const url of urls) resultados.push(await testarUrl(url));

  return json(lote ? { resultados } : resultados[0]);
}

export function onRequest({ request }) {
  return json({ erro: 'Método não permitido. Use POST.' }, 405, { 'Allow': 'POST' });
}
