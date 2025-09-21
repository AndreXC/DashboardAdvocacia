// =======================================
// Mapeamento de Ícones para Notificações
// =======================================
const ICON_MAP = {
    'error': 'fas fa-exclamation-circle',
    'warning': 'fas fa-exclamation-triangle',
    'success': 'fas fa-check-circle',
    'info': 'fas fa-info-circle',
    'message': 'fas fa-envelope',
    'sound': 'fas fa-volume-up',
    'document': 'fas fa-file-alt',
    'calendar': 'fas fa-calendar-day'
};

// =======================================
// Seletores de Elementos
// =======================================
const notificationList = document.getElementById('notificationList');
const noNotificationsMessage = document.getElementById('noNotificationsMessage');
const clearAllBtn = document.getElementById('clear-all-btn');

// Painel de Foco e Calendário
const focusPanel = document.getElementById('focusPanel');
const focusHeader = document.getElementById('focusHeader');
const currentDayDate = document.getElementById('currentDayDate');

// Elementos do Calendário
const calendarContainer = document.getElementById('calendarContainer');
const currentMonthYear = document.getElementById('current-month-year');
const calendarGrid = document.querySelector('.calendar-grid');
const prevMonthBtn = document.getElementById('prev-month-btn');
const nextMonthBtn = document.getElementById('next-month-btn');

// Elementos do Modal
const eventModalOverlay = document.getElementById('eventModalOverlay');
const modalTitle = document.getElementById('modalTitle');
const closeModalBtn = document.getElementById('closeModalBtn');

const eventDetailsContainer = document.getElementById('eventDetailsContainer');
const eventFormContainer = document.getElementById('eventFormContainer');
const viewEventType = document.getElementById('viewEventType');
const viewEventMessage = document.getElementById('viewEventMessage');
const eventTypeInput = document.getElementById('eventType');
const eventMessageInput = document.getElementById('eventMessage');

const addModeBtns = document.getElementById('add-mode-btns');
const viewModeBtns = document.getElementById('view-mode-btns');
const cancelEventBtn = document.getElementById('cancelEventBtn');
const saveEventBtn = document = document.getElementById('saveEventBtn');
const deleteEventBtn = document.getElementById('deleteEventBtn');
const closeDetailsBtn = document.getElementById('closeDetailsBtn');

// =======================================
// ESTADO INICIAL
// =======================================
let notificationCount = 0;
let events = [];
let selectedDate = null;
let calendarStateDate = new Date();

// =======================================
// LÓGICA DO CALENDÁRIO E MODAL
// =======================================
function updateDisplayDate() {
    const today = new Date();
    const options = { weekday: 'long', day: 'numeric', month: 'long' };
    currentDayDate.textContent = today.toLocaleDateString('pt-BR', options);
}

// function showModal(date) {
//     selectedDate = date;
//     const existingEvent = events.find(event => event.date.toDateString() === date.toDateString());

//     if (existingEvent) {
//         modalTitle.textContent = 'Detalhes do Evento';
//         eventDetailsContainer.style.display = 'block';
//         eventFormContainer.style.display = 'none';
//         viewEventType.textContent = existingEvent.type;
//         viewEventMessage.textContent = existingEvent.message;
//         viewModeBtns.style.display = 'flex';
//         addModeBtns.style.display = 'none';
//     } else {
//         modalTitle.textContent = `Adicionar Evento para ${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
//         eventDetailsContainer.style.display = 'none';
//         eventFormContainer.style.display = 'block';
//         eventTypeInput.value = '';
//         eventMessageInput.value = '';
//         viewModeBtns.style.display = 'none';
//         addModeBtns.style.display = 'flex';
//     }
//     eventModalOverlay.classList.add('open');
// }

function closeModal() {
    eventModalOverlay.classList.remove('open');
}

function saveEvent() {
    if (eventTypeInput.value.trim() === '' || eventMessageInput.value.trim() === '') {
        alert('Por favor, preencha todos os campos.');
        return;
    }
    const newEvent = {
        date: selectedDate,
        type: eventTypeInput.value,
        message: eventMessageInput.value
    };
    events.push(newEvent);
    AdicionarNotificacao(newEvent.type, `Novo evento: ${newEvent.message}`);
    closeModal();
    renderCalendar();
}

function deleteEvent() {
    events = events.filter(event => event.date.toDateString() !== selectedDate.toDateString());
    closeModal();
    renderCalendar();
}

// Eventos dos botões do modal
closeModalBtn.addEventListener('click', closeModal);
cancelEventBtn.addEventListener('click', closeModal);
closeDetailsBtn.addEventListener('click', closeModal);

// Evento para fechar o modal ao clicar fora dele
document.addEventListener('click', (e) => {
    // Verifica se o modal está aberto E se o clique ocorreu fora do modal principal (eventModalOverlay)
    if (eventModalOverlay.classList.contains('open') && !eventModalOverlay.contains(e.target)) {
        closeModal();
    }
});

saveEventBtn.addEventListener('click', saveEvent);
deleteEventBtn.addEventListener('click', deleteEvent);

function renderCalendar() {
    calendarStateDate.setDate(1);
    const month = calendarStateDate.getMonth();
    const year = calendarStateDate.getFullYear();
    const monthYearString = calendarStateDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    currentMonthYear.textContent = monthYearString.charAt(0).toUpperCase() + monthYearString.slice(1);

    const daysOfWeek = calendarGrid.querySelectorAll('.day-of-week');
    calendarGrid.innerHTML = '';
    daysOfWeek.forEach(day => calendarGrid.appendChild(day));

    const firstDayIndex = calendarStateDate.getDay();
    const lastDayOfMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const totalGridCells = firstDayIndex + lastDayOfMonth > 35 ? 42 : 35;
    const nextMonthDays = totalGridCells - (firstDayIndex + lastDayOfMonth);

    for (let x = firstDayIndex; x > 0; x--) {
        const dayCell = document.createElement('div');
        dayCell.className = 'date-cell other-month';
        dayCell.textContent = prevMonthLastDay - x + 1;
        calendarGrid.appendChild(dayCell);
    }

    for (let i = 1; i <= lastDayOfMonth; i++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'date-cell';
        dayCell.textContent = i;

        const currentDate = new Date(year, month, i);
        const today = new Date();

        if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
            dayCell.classList.add('today');
        }

        const hasEvent = events.some(event => event.date.toDateString() === currentDate.toDateString());
        if (hasEvent) {
            dayCell.classList.add('has-event');
        }

        // dayCell.addEventListener('click', () => showModal(currentDate));

        calendarGrid.appendChild(dayCell);
    }

    for (let j = 1; j <= nextMonthDays; j++) {
        const dayCell = document.createElement('div');
        dayCell.className = 'date-cell other-month';
        dayCell.textContent = j;
        calendarGrid.appendChild(dayCell);
    }
}

focusHeader.addEventListener('click', () => focusPanel.classList.toggle('calendar-open'));
prevMonthBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    calendarStateDate.setMonth(calendarStateDate.getMonth() - 1);
    renderCalendar();
});
nextMonthBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    calendarStateDate.setMonth(calendarStateDate.getMonth() + 1);
    renderCalendar();
});

// =======================================
// LÓGICA DAS NOTIFICAÇÕES
// =======================================
function updateNotificationViewState() {
    noNotificationsMessage.style.display = notificationCount === 0 ? 'block' : 'none';
    clearAllBtn.style.display = notificationCount > 0 ? 'inline-block' : 'none';
}

function removeNotification(notificationElement) {
    notificationElement.classList.add('dismissing');
    notificationElement.addEventListener('animationend', () => {
        notificationElement.remove();
        notificationCount--;
        updateNotificationViewState();
    }, { once: true });
}

/**
 * Adiciona uma nova notificação à lista com base no tipo e mensagem.
 * Se o tipo for 'documento', adiciona um botão "Ver Agora".
 * @param {string} type - O tipo da notificação (ex: 'success', 'error').
 * @param {string} message - A mensagem da notificação.
 * @param {string} [actionUrl] - URL opcional para o botão "Ver Agora".
 */
function AdicionarNotificacao(type, message, actionUrl = '#') {
    const iconClass = ICON_MAP[type] || ICON_MAP['info'];

    notificationCount++;
    updateNotificationViewState();

    const listItem = document.createElement('li');
    listItem.className = 'notification-item';
    listItem.setAttribute('role', 'listitem');

    const now = new Date();
    const timestamp = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    let actionButton = '';
    if (type === 'document') {
        actionButton = `<a href="${actionUrl}" class="notification-action-btn" aria-label="Ver agora" role="button">
            <i class="fas fa-arrow-right"></i> Ver Agora
        </a>`;
    }

    listItem.innerHTML = `
        <div class="notification-icon">
            <i class="${iconClass}"></i>
        </div>
        <div class="content">
            <p>${message}</p>
            <span class="timestamp">${timestamp}</span>
        </div>
        ${actionButton}
        <button class="close-notification-btn" aria-label="Dispensar notificação">
            <i class="fas fa-times"></i>
        </button>
    `;

    notificationList.prepend(listItem);

    listItem.querySelector('.close-notification-btn').addEventListener('click', () => {
        removeNotification(listItem);
    });
}

// Evento para limpar todas as notificações
clearAllBtn.addEventListener('click', () => {
    const allNotifications = notificationList.querySelectorAll('.notification-item');
    allNotifications.forEach(item => removeNotification(item));
});

// =======================================
// INICIALIZAÇÃO
// =======================================
updateDisplayDate();
renderCalendar();
updateNotificationViewState();

// Exemplos de como usar a nova função de notificação
AdicionarNotificacao('success', 'Calendário carregado com sucesso!');
AdicionarNotificacao('info', 'Bem-vindo(a) de volta! Verifique seus eventos.');
AdicionarNotificacao('document', 'Novo documento "Relatório Mensal" disponível para leitura.', 'https://example.com/relatorio-mensal.pdf');