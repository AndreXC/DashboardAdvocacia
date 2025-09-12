document.addEventListener('DOMContentLoaded', () => {

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
    const saveEventBtn = document.getElementById('saveEventBtn');
    const deleteEventBtn = document.getElementById('deleteEventBtn');
    const closeDetailsBtn = document.getElementById('closeDetailsBtn');

    // =======================================
    // ESTADO INICIAL
    // =======================================
    let notificationCount = 0;
    let events = [];
    let selectedDate = null;
    let calendarStateDate = new Date();


    function updateDisplayDate() {
        const today = new Date();
        const options = { weekday: 'long', day: 'numeric', month: 'long' };
        currentDayDate.textContent = today.toLocaleDateString('pt-BR', options);
    }



    function showModal(date) {
        selectedDate = date;
        // Verifica se já existe um evento para a data selecionada
        const existingEvent = events.find(event => event.date.toDateString() === date.toDateString());

        if (existingEvent) {
            // --- MODO DE VISUALIZAÇÃO ---
            modalTitle.textContent = 'Detalhes do Evento';
            eventDetailsContainer.style.display = 'block';
            eventFormContainer.style.display = 'none';
            viewEventType.textContent = existingEvent.type;
            viewEventMessage.textContent = existingEvent.message;
            viewModeBtns.style.display = 'flex';
            addModeBtns.style.display = 'none';
        } else {
            // --- MODO DE ADIÇÃO ---
            modalTitle.textContent = `Adicionar Evento para ${date.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`;
            eventDetailsContainer.style.display = 'none';
            eventFormContainer.style.display = 'block';
            eventTypeInput.value = '';
            eventMessageInput.value = '';
            viewModeBtns.style.display = 'none';
            addModeBtns.style.display = 'flex';
        }
        eventModalOverlay.classList.add('open');
    }

    function closeModal() {
        eventModalOverlay.classList.remove('open');
    }

    function saveEvent() {
        if (eventTypeInput.value.trim() === '' || eventMessageInput.value.trim() === '') {
            alert('Por favor, preencha todos os campos.');
            return;
        }
        events.push({
            date: selectedDate,
            type: eventTypeInput.value,
            message: eventMessageInput.value
        });
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
    eventModalOverlay.addEventListener('click', (e) => {
        if (e.target === eventModalOverlay) closeModal();
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

            dayCell.addEventListener('click', () => showModal(currentDate));

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

    function addNotification(iconClass, message) {
        notificationCount++;
        updateNotificationViewState();

        const listItem = document.createElement('li');
        listItem.className = 'notification-item';
        listItem.setAttribute('role', 'listitem');

        const now = new Date();
        const timestamp = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        listItem.innerHTML = `
            <div class="content">
                <p>${message}</p>
                <span class="timestamp">${timestamp}</span>
            </div>
            <button class="close-notification-btn" aria-label="Dispensar notificação">
                <i class="fas fa-times"></i>
            </button>
        `;

        notificationList.prepend(listItem);

        listItem.querySelector('.close-notification-btn').addEventListener('click', () => {
            removeNotification(listItem);
        });
    }

    clearAllBtn.addEventListener('click', () => {
        const allNotifications = notificationList.querySelectorAll('.notification-item');
        allNotifications.forEach(item => {
            removeNotification(item);
        });
    });

    updateDisplayDate();
    renderCalendar();
    updateNotificationViewState();
});