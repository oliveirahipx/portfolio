// ============ GLOBAL APP STATE ============
let currentLoginMode = 'pt';
let librasMode = true; 
let systemVideoActive = true; 
let currentUser = {name: 'ESTUDANTE EXEMPLO', matricula: '000000000'};

// MAPEAMENTO COMPACTO E EXPANDIDO DOS VÍDEOS DE SUPORTE
const videoRoutes = {
  inicio: "https://res.cloudinary.com/duslicdkg/video/upload/v1782094950/Inicio_hwm30f.mp4",
  grupos: "https://res.cloudinary.com/duslicdkg/video/upload/v1782094950/Grupo_de_estudos_ucpxpp.mp4",
  manual: "https://res.cloudinary.com/duslicdkg/video/upload/v1782094950/Manual_eazrxp.mp4"
};

const pages = {
  inicio: 'Início',
  repositorio: 'Repositório de Aulas',
  trabalhos: 'Trabalhos Acadêmicos',
  grupos: 'Grupos de Estudo',
  painel: 'Painel do Professor',
  acessibilidade: 'Acessibilidade',
  manual: 'Manual do Usuário'
};

// Sincronizar UI Inicial ao carregar e configurar o listener de encerramento do vídeo
window.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('libras-mode');
  applyFontSize('14'); 
  
  const player = document.getElementById('libras-video-player');
  player.addEventListener('ended', () => {
    document.getElementById('libras-video-container').style.display = 'none';
  });
});

// ============ SYSTEM SESSION CLOCK ============
let sessionSeconds = 41 * 60; 
setInterval(() => {
  sessionSeconds++;
  const m = String(Math.floor(sessionSeconds / 60)).padStart(2, '0');
  const s = String(sessionSeconds % 60).padStart(2, '0');
  const el = document.getElementById('session-time');
  if (el) el.textContent = 'Sessão: ' + m + ':' + s;
}, 1000);

// ============ ENGINE DE EXECUÇÃO DE VÍDEOS AUTOMATIZADOS ============
function playContextVideo(routeKey) {
  if (!systemVideoActive) return;

  const container = document.getElementById('libras-video-container');
  const player = document.getElementById('libras-video-player');
  const videoUrl = videoRoutes[routeKey];

  if (container && player && videoUrl) {
    player.src = videoUrl;
    container.style.display = 'block';
    player.load();
    player.play().catch(err => console.log("Aguardando interação do usuário."));
  }
}

// Reseta e oculta o player flutuante
function stopContextVideo() {
  const container = document.getElementById('libras-video-container');
  const player = document.getElementById('libras-video-player');
  if (container && player) {
    player.pause();
    player.src = "";
    container.style.display = 'none';
  }
}

function handleVideoControlSelect(val) {
  // O selo de status é opcional: a página de Acessibilidade não o exibe hoje.
  const badge = document.getElementById('status-video-badge');
  if (val === 'desativado') {
    systemVideoActive = false;
    stopContextVideo();
    if (badge) {
      badge.textContent = 'Inativo';
      badge.className = 'badge-status';
    }
  } else {
    systemVideoActive = true;
    if (badge) {
      badge.textContent = 'Ativo';
      badge.className = 'badge-status status-active';
    }
  }
}

function changeVideoPosition(pos) {
  const container = document.getElementById('libras-video-container');
  if (!container) return;

  container.style.top = 'auto'; container.style.bottom = 'auto';
  container.style.left = 'auto'; container.style.right = 'auto';

  if (pos === 'inferior-esquerdo') {
    container.style.bottom = '20px'; container.style.left = '20px';
  } else if (pos === 'superior-direito') {
    container.style.top = '80px'; container.style.right = '20px';
  } else {
    container.style.bottom = '20px'; container.style.right = '20px';
  }
}

// ============ ROUTING VIEWPORT MATRIX ============
function setPage(id) {
  // ♿ NOVIDADE: Para o vídeo da tela anterior imediatamente ao mudar de aba
  stopContextVideo();

  document.querySelectorAll('[id^="pg-"]').forEach(el => el.style.display = 'none');
  const pg = document.getElementById('pg-' + id);
  if (pg) pg.style.display = 'block';
  
  document.getElementById('breadcrumb').innerHTML = 'Portal Bilíngue &rsaquo; <span>' + pages[id] + '</span>';
  
  document.querySelectorAll('.sidebar-item').forEach(el => {
    el.classList.remove('active');
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes("'" + id + "'")) el.classList.add('active');
  });
  document.querySelectorAll('.navmenu-item').forEach(el => {
    el.classList.remove('active');
    if (el.getAttribute('onclick') && el.getAttribute('onclick').includes("'" + id + "'")) el.classList.add('active');
  });

  // Disparar vídeos contextuais correspondentes
  if (id === 'inicio' || id === 'grupos' || id === 'manual') {
    playContextVideo(id);
  }
}

// ============ GATE LOGIN MANAGER ============
function setLoginMode(mode) {
  currentLoginMode = mode;
  document.getElementById('btn-mode-pt').classList.toggle('active', mode === 'pt');
  document.getElementById('btn-mode-libras').classList.toggle('active', mode === 'libras');
  document.getElementById('libras-notice').style.display = mode === 'libras' ? 'block' : 'none';
}

function doLogin() {
  const mat = document.getElementById('login-matricula').value.trim();
  const pw = document.getElementById('login-senha').value.trim();
  const errEl = document.getElementById('login-error');

  if (!mat || !pw) {
    errEl.style.display = 'block';
    errEl.textContent = 'Preencha a matrícula e a senha.';
    return;
  }
  
  errEl.style.display = 'none';
  currentUser.matricula = mat;
  currentUser.name = mat === '000000000' ? 'ESTUDANTE EXEMPLO' : 'Estudante Exemplo';

  document.getElementById('welcome-name').textContent = currentUser.name;
  document.getElementById('topbar-user').textContent = currentUser.name;
  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  
  playContextVideo('inicio');
}

function redirectSigaa() {
  
}

// ============ ACCESSIBILITY ENGINE TOOLS ============
function toggleLibrasMode() {
  librasMode = !librasMode;
  document.body.classList.toggle('libras-mode', librasMode);
  const badge = document.getElementById('topbar-mode-badge');
  const btn = document.getElementById('libras-mode-btn');
  
  if (librasMode) {
    badge.textContent = '🤟 LIBRAS';
    badge.className = 'mode-badge';
    if (btn) btn.textContent = 'Desativar Modo Libras';
  } else {
    badge.textContent = '🇧🇷 PT';
    badge.className = 'mode-badge pt';
    if (btn) btn.textContent = 'Ativar Modo Libras';
  }
}

function applyContrast(val) {
  document.body.classList.remove('high-contrast', 'dark-mode');
  if (val === 'high') document.body.classList.add('high-contrast');
  if (val === 'dark') document.body.classList.add('dark-mode');
}

function toggleContrast() {
  const hasContrast = document.body.classList.contains('high-contrast');
  applyContrast(hasContrast ? 'normal' : 'high');
}

function applyFontSize(size) {
  document.body.style.fontSize = size + 'px';
}

function changeFontSize() {
  const current = parseInt(window.getComputedStyle(document.body).fontSize) || 14;
  const next = current >= 18 ? 14 : current + 2;
  applyFontSize(String(next));
}

// ============ VIDEO MODAL LAYER ============
function openVideoModal(url, title) {
  document.getElementById('modal-iframe').src = url;
  document.getElementById('modal-title').textContent = '🎬 ' + title;
  document.getElementById('video-modal').style.display = 'flex';
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('video-modal') || e.target.classList.contains('modal-close')) {
    document.getElementById('video-modal').style.display = 'none';
    document.getElementById('modal-iframe').src = '';
  }
}

// ============ GLOBAL EVENT MATRIX ============
document.querySelectorAll('.submenu-tag').forEach(el => {
  el.onclick = function() {
    document.querySelectorAll('.submenu-tag').forEach(e => e.classList.remove('active'));
    this.classList.add('active');
  };
});

function logout() {
  document.getElementById('app').style.display = 'none';
  document.getElementById('login-screen').style.display = 'flex';
  librasMode = false;
  stopContextVideo();
  document.body.classList.remove('libras-mode', 'high-contrast', 'dark-mode');
  document.body.style.fontSize = '14px';
}