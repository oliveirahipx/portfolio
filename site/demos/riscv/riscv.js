import { LISTAGEM, FONTE } from './programa.js';

// Strings do segmento .data, nos mesmos endereços do RARS.
const DADOS = {
  0x10010000: '\nDigite um numero positivo para o fatorial: ',
  0x1001002d: '\nErro: O numero nao pode ser negativo!',
  0x10010054: '\nO resultado do fatorial eh: ',
};

const NOMES = ['zero', 'ra', 'sp', 'gp', 'tp', 't0', 't1', 't2', 's0', 's1', 'a0', 'a1', 'a2', 'a3', 'a4', 'a5', 'a6', 'a7'];
const MOSTRAR = ['a0', 'a7', 'ra', 'sp', 's0', 's1', 't0', 't1'];
const SP_INICIAL = 0x7fffeffc;
const PC_INICIAL = 0x00400000;
const LIMITE = 5000;

const porEndereco = new Map(LISTAGEM.map((i) => [parseInt(i.end, 16), i]));
const u32 = (v) => v >>> 0;
const hex = (v) => '0x' + u32(v).toString(16).padStart(8, '0');

let cpu;

function reiniciar() {
  cpu = {
    pc: PC_INICIAL,
    regs: Object.fromEntries(NOMES.map((n) => [n, 0])),
    mem: new Map(),
    saida: '',
    fim: false,
    passos: 0,
    alterado: null,
  };
  cpu.regs.sp = SP_INICIAL;
  cpu.regs.gp = 0x10008000;
  render();
}

const ler = (r) => (r === 'zero' ? 0 : cpu.regs[r] | 0);
const escrever = (r, v) => { if (r !== 'zero') { cpu.regs[r] = v | 0; cpu.alterado = r; } };

function executar(instr, entrada) {
  const [op, ...resto] = instr.basica.replace(/,/g, ' ').split(/\s+/);
  const a = resto;
  const imm = (s) => parseInt(s, s.startsWith('0x') || s.startsWith('-0x') ? 16 : 10);
  const off = (s) => { const m = s.match(/^(-?\d+)\((\w+)\)$/); return [parseInt(m[1], 10), m[2]]; };
  let proximo = cpu.pc + 4;
  cpu.alterado = null;

  switch (op) {
    case 'add': escrever(a[0], ler(a[1]) + ler(a[2])); break;
    case 'addi': escrever(a[0], ler(a[1]) + imm(a[2])); break;
    case 'mul': escrever(a[0], Math.imul(ler(a[1]), ler(a[2]))); break;
    case 'auipc': escrever(a[0], cpu.pc + (imm(a[1]) << 12)); break;
    case 'bge': if (ler(a[0]) >= ler(a[1])) proximo = cpu.pc + imm(a[2]); break;
    case 'jal': escrever(a[0], cpu.pc + 4); proximo = cpu.pc + imm(a[1]); break;
    case 'jalr': { const [o, r] = off(a[1]); const destino = ler(r) + o; escrever(a[0], cpu.pc + 4); proximo = destino; break; }
    case 'sw': { const [o, r] = off(a[1]); cpu.mem.set(u32(ler(r) + o), ler(a[0])); break; }
    case 'lw': { const [o, r] = off(a[1]); escrever(a[0], cpu.mem.get(u32(ler(r) + o)) ?? 0); break; }
    case 'ecall': {
      const servico = ler('a7');
      if (servico === 4) cpu.saida += DADOS[u32(ler('a0'))] ?? '';
      else if (servico === 1) cpu.saida += String(ler('a0'));
      else if (servico === 10) { cpu.fim = true; cpu.saida += '\n\n-- programa encerrado (ecall 10) --'; }
      else if (servico === 5) {
        cpu.saida += String(entrada);
        escrever('a0', entrada);
      }
      break;
    }
    default: throw new Error('Instrução não suportada: ' + op);
  }
  cpu.pc = u32(proximo);
  cpu.passos++;
  return true;
}

const aguardaLeitura = () => !cpu.fim && porEndereco.get(cpu.pc)?.basica === 'ecall' && ler('a7') === 5;

function passo(entrada) {
  if (cpu.fim || (aguardaLeitura() && entrada === undefined)) return false;
  const instr = porEndereco.get(cpu.pc);
  if (!instr) { cpu.fim = true; cpu.saida += '\n-- PC fora do programa --'; return false; }
  return executar(instr, entrada);
}

// ---------- Interface ----------

const $ = (s) => document.querySelector(s);
const fonteEl = $('[data-fonte]');
const linhasFonte = FONTE.map((txt, i) => {
  const li = document.createElement('li');
  li.value = i + 1;
  const comentario = txt.indexOf('#');
  if (comentario >= 0) {
    li.append(txt.slice(0, comentario));
    const c = document.createElement('span'); c.className = 'coment'; c.textContent = txt.slice(comentario); li.append(c);
  } else li.textContent = txt || ' ';
  fonteEl.append(li);
  return li;
});

function render() {
  const instr = porEndereco.get(cpu.pc);
  linhasFonte.forEach((li) => li.classList.remove('atual'));
  if (instr && !cpu.fim) {
    const li = linhasFonte[instr.linha - 1];
    li.classList.add('atual');
    const caixa = fonteEl.parentElement;
    const topo = li.offsetTop - caixa.offsetTop;
    if (topo < caixa.scrollTop || topo > caixa.scrollTop + caixa.clientHeight - 40) caixa.scrollTop = topo - caixa.clientHeight / 3;
  }
  $('[data-pc]').textContent = cpu.fim ? '' : hex(cpu.pc);
  $('[data-basica]').textContent = cpu.fim ? 'fim da execução' : instr ? `${instr.basica}   (${instr.fonte})` : '';
  $('[data-console]').textContent = cpu.saida || ' ';
  $('[data-contador]').textContent = `${cpu.passos} ${cpu.passos === 1 ? 'instrução executada' : 'instruções executadas'}`;

  const regs = $('[data-regs]');
  regs.replaceChildren(...MOSTRAR.map((r) => {
    const tr = document.createElement('tr');
    if (r === cpu.alterado) tr.className = 'mudou';
    tr.innerHTML = `<th scope="row">${r}</th><td>${hex(ler(r))}</td><td>${ler(r)}</td>`;
    return tr;
  }));

  const pilha = $('[data-pilha]');
  const sp = u32(ler('sp'));
  const linhas = [];
  for (let end = SP_INICIAL - 4; end >= sp; end -= 4) {
    const tr = document.createElement('tr');
    const papel = (SP_INICIAL - 4 - end) % 8 === 0 ? 'ra' : 'n';
    if (end === sp) tr.className = 'linha-sp';
    tr.innerHTML = `<th scope="row">${hex(end)}${end === sp ? ' <span class="sp">sp</span>' : ''}</th><td>${papel}</td><td>${papel === 'ra' ? hex(cpu.mem.get(end) ?? 0) : (cpu.mem.get(end) ?? 0)}</td>`;
    linhas.push(tr);
  }
  pilha.replaceChildren(...linhas);
  $('[data-pilha-vazia]').hidden = linhas.length > 0;

  const lendo = aguardaLeitura();
  $('[data-entrada]').hidden = !lendo;
  $('[data-passo]').disabled = cpu.fim || lendo;
  $('[data-ate-fim]').disabled = cpu.fim || lendo;
}

$('[data-passo]').addEventListener('click', () => { passo(); render(); });
$('[data-ate-fim]').addEventListener('click', () => {
  let n = 0;
  while (n++ < LIMITE && passo()) { /* executa até ecall de leitura ou fim */ }
  render();
});
$('[data-reiniciar]').addEventListener('click', reiniciar);
$('[data-entrada]').addEventListener('submit', (e) => {
  e.preventDefault();
  const v = parseInt($('#numero').value, 10);
  if (Number.isNaN(v)) return;
  passo(v);
  render();
  $('[data-passo]').focus();
});

reiniciar();
