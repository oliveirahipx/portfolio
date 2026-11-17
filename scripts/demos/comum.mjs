import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const AQUI = path.dirname(fileURLToPath(import.meta.url));
export const DEMOS = path.resolve(AQUI, '..', '..', 'site', 'demos');

// Pasta com os clones dos projetos (padrão: a pasta que contém o portfólio).
export const RAIZ = path.resolve(process.argv[2] || path.join(AQUI, '..', '..', '..'));

// Recria site/demos/<nome>/ do zero. Só apaga dentro de site/demos.
export function pastaLimpa(nome) {
  const alvo = path.join(DEMOS, nome);
  if (path.dirname(alvo) !== DEMOS) throw new Error('pasta fora de site/demos: ' + alvo);
  fs.rmSync(alvo, { recursive: true, force: true });
  fs.mkdirSync(alvo, { recursive: true });
  return alvo;
}

export function copiar(origem, destino) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.copyFileSync(origem, destino);
}

export function copiarPasta(origem, destino) {
  fs.cpSync(origem, destino, { recursive: true });
}

export function gravar(destino, texto) {
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, texto, 'utf8');
}

export function faixa(id) {
  return '<div class="faixa-demo"><span>Demonstração com dados fictícios. Nada é salvo.</span>'
    + `<a href="../../#p-${id}">Voltar ao portfólio</a></div>`;
}

// Coloca a faixa da demo e os arquivos extras na página renderizada. Os
// links entram no fim do <head>, depois do CSS original, para poder ajustá-lo.
export function montarPagina(html, { id, cabeca = '', classeBody = '' }) {
  const extras = ['<link rel="stylesheet" href="../faixa.css">', cabeca].filter(Boolean).join('\n    ');
  html = html.replace(/<\/head>/i, `    ${extras}\n</head>`);
  html = html.replace(/<body([^>]*)>/i, (m, attrs) => {
    const corpo = classeBody ? `<body${attrs} class="${classeBody}">` : m;
    return `${corpo}\n${faixa(id)}`;
  });
  return html;
}

// Troca todas as ocorrências exigindo que cada trecho exista, para o script
// avisar quando o template original mudar.
export function trocar(texto, pares, onde) {
  for (const [antes, depois] of pares) {
    if (typeof antes !== 'string') antes.lastIndex = 0;
    const achou = typeof antes === 'string' ? texto.includes(antes) : antes.test(texto);
    if (typeof antes !== 'string') antes.lastIndex = 0;
    if (!achou) throw new Error(`trecho não encontrado em ${onde}: ${antes}`);
    texto = typeof antes === 'string' ? texto.split(antes).join(depois) : texto.replace(antes, depois);
  }
  return texto;
}

export function escaparAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
