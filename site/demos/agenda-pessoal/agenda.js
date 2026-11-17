const calendarBody = document.querySelector('#calendar tbody');
const monthYear = document.getElementById('monthYear');
const modal = document.getElementById('eventModal');
const modalDate = document.getElementById('modalDate');
const eventList = document.getElementById('eventList');
const eventForm = document.getElementById('eventForm');
const eventText = document.getElementById('eventText');
const closeBtn = document.getElementById('closeModal');

// Menu de projetos (cabeçalho)
const menuToggle = document.getElementById('menuToggle');
const projectsMenu = document.getElementById('projectsMenu');
const projectsList = document.getElementById('projectsList');
const projectForm = document.getElementById('projectForm');
const projectText = document.getElementById('projectText');

function renderProjects(list) {
    projectsList.innerHTML = '';
    list.forEach((p, i) => {
        const li = document.createElement('li');
        li.className = 'project-row';
        li.innerHTML = `
            <span class="project-name">${escapeHtml(p)}</span>
            <div class="project-actions">
                <button class="project-edit" data-index="${i}" title="Editar projeto" aria-label="Editar projeto"> 
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25z" fill="#cfefff"/><path d="M20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34a1.003 1.003 0 00-1.42 0l-1.83 1.83 3.75 3.75 1.84-1.83z" fill="#cfefff"/></svg>
                </button>
                <button class="project-delete" data-index="${i}" title="Excluir projeto" aria-label="Excluir projeto">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 19a2 2 0 002 2h8a2 2 0 002-2V7H6v12z" fill="#ffd7d2"/><path d="M19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" fill="#ffd7d2"/></svg>
                </button>
            </div>
        `;
        projectsList.appendChild(li);
    });

    // attach handlers
    projectsList.querySelectorAll('.project-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.getAttribute('data-index'));
            deleteProject(idx);
        });
    });
    projectsList.querySelectorAll('.project-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const idx = Number(e.currentTarget.getAttribute('data-index'));
            editProject(idx);
        });
    });
}

function loadProjects() {
    const list = JSON.parse(localStorage.getItem('projects') || '[]');
    renderProjects(list);
}

function addProject(name) {
    const list = JSON.parse(localStorage.getItem('projects') || '[]');
    list.push(name);
    localStorage.setItem('projects', JSON.stringify(list));
    renderProjects(list);
}

function getProjects() {
    return JSON.parse(localStorage.getItem('projects') || '[]');
}

function deleteProject(index) {
    const list = getProjects();
    if (index < 0 || index >= list.length) return;
    list.splice(index, 1);
    localStorage.setItem('projects', JSON.stringify(list));
    renderProjects(list);
}

function editProject(index) {
    const list = getProjects();
    if (index < 0 || index >= list.length) return;
    const current = list[index];
    const updated = prompt('Editar nome do projeto:', current);
    if (updated === null) return; // cancel
    const v = updated.trim();
    if (!v) return alert('Nome inválido');
    list[index] = v;
    localStorage.setItem('projects', JSON.stringify(list));
    renderProjects(list);
}

// small helper to avoid XSS when inserting project names into HTML
function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
}

menuToggle && menuToggle.addEventListener('click', () => {
    const open = projectsMenu.classList.toggle('open');
    menuToggle.setAttribute('aria-expanded', open);
    projectsMenu.setAttribute('aria-hidden', !open);
});

projectForm && projectForm.addEventListener('submit', e => {
    e.preventDefault();
    const v = projectText.value.trim();
    if (!v) return;
    addProject(v);
    projectText.value = '';
});

// Fecha menu se clicar fora
document.addEventListener('click', e => {
    if (projectsMenu && !projectsMenu.contains(e.target) && e.target !== menuToggle && projectsMenu.classList.contains('open')) {
        projectsMenu.classList.remove('open');
        menuToggle.setAttribute('aria-expanded', 'false');
        projectsMenu.setAttribute('aria-hidden', 'true');
    }
});

let current = new Date();

// Helper: Formata data para chave do localStorage
function formatDateKey(d) {
    const y = d.getFullYear();
    const m = (d.getMonth() + 1).toString().padStart(2, '0');
    const day = d.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${day}`;
}

function loadMonth(date) {
    calendarBody.innerHTML = '';
    const year = date.getFullYear();
    const month = date.getMonth();
    const today = new Date();
    
    // Título do mês
    monthYear.textContent = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    let row = document.createElement('tr');

    // Células vazias antes do dia 1
    for (let i = 0; i < firstDay; i++) {
        row.appendChild(document.createElement('td'));
    }

    for (let day = 1; day <= daysInMonth; day++) {
        if (row.children.length === 7) {
            calendarBody.appendChild(row);
            row = document.createElement('tr');
        }

        const cell = document.createElement('td');
        cell.textContent = day;
        
        const cellDate = new Date(year, month, day);
        const key = formatDateKey(cellDate);

        // Marca dia atual
        if (cellDate.toDateString() === today.toDateString()) {
            cell.classList.add('today');
        }

        // Marca dias com eventos
        if (localStorage.getItem(key)) {
            cell.classList.add('has-event');
        }

        cell.addEventListener('click', () => openModal(cellDate));
        row.appendChild(cell);
    }

    // Completa a última linha
    while (row.children.length < 7) {
        row.appendChild(document.createElement('td'));
    }
    calendarBody.appendChild(row);
}

function openModal(date) {
    const key = formatDateKey(date);
    modalDate.textContent = date.toLocaleDateString('pt-BR', { dateStyle: 'full' });
    modal.dataset.currentKey = key;
    
    renderEvents(key);
    
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
    eventText.focus();
}

function renderEvents(key) {
    eventList.innerHTML = '';
    const stored = JSON.parse(localStorage.getItem(key) || '[]');
    
    stored.forEach((evt, index) => {
        const li = document.createElement('li');
        li.className = 'event-item';
        li.innerHTML = `
            <span>${escapeHtml(evt)}</span>
            <button class="delete-event" data-index="${index}">Excluir</button>
        `;
        eventList.appendChild(li);
    });

    // Event listeners para botões de excluir
    document.querySelectorAll('.delete-event').forEach(btn => {
        btn.onclick = (e) => {
            const idx = e.target.getAttribute('data-index');
            deleteEvent(key, idx);
        };
    });
}

function deleteEvent(key, index) {
    let list = JSON.parse(localStorage.getItem(key) || '[]');
    list.splice(index, 1);
    
    if (list.length === 0) {
        localStorage.removeItem(key);
    } else {
        localStorage.setItem(key, JSON.stringify(list));
    }
    
    renderEvents(key);
    loadMonth(current);
}

function closeModal() {
    modal.classList.remove('show');
    modal.setAttribute('aria-hidden', 'true');
    eventText.value = '';
}

eventForm.addEventListener('submit', e => {
    e.preventDefault();
    const key = modal.dataset.currentKey;
    const text = eventText.value.trim();
    
    if (!text) return;

    const list = JSON.parse(localStorage.getItem(key) || '[]');
    list.push(text);
    localStorage.setItem(key, JSON.stringify(list));
    
    eventText.value = '';
    renderEvents(key);
    loadMonth(current);
});

// Controles de navegação
// Volta para o dia 1 antes de trocar o mês: em dias 29-31, setMonth()
// pularia meses mais curtos (ex.: 31/jan + 1 mês viraria 03/mar).
document.getElementById('prevMonth').onclick = () => {
    current.setDate(1);
    current.setMonth(current.getMonth() - 1);
    loadMonth(current);
};

document.getElementById('nextMonth').onclick = () => {
    current.setDate(1);
    current.setMonth(current.getMonth() + 1);
    loadMonth(current);
};

closeBtn.onclick = closeModal;
window.onclick = (e) => { if (e.target === modal) closeModal(); };

// Início
loadMonth(current);
// carrega lista de projetos no menu
loadProjects();