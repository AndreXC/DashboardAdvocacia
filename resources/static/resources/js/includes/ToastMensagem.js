const toastDetails = {
    success: {
        icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" /></svg>`,
        title: 'Success notification'
    },
    info: {
        icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" /></svg>`,
        title: 'Informational notification'
    },
    warning: {
        icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M8.257 3.099c.636-1.026 2.092-1.026 2.728 0l6.432 10.377c.636 1.026-.114 2.274-1.364 2.274H3.189c-1.25 0-2-1.248-1.364-2.274L8.257 3.099zM10 6a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 6zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" /></svg>`,
        title: 'Warning notification'
    },
    error: {
        icon: `<svg viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" /></svg>`,
        title: 'Error notification'
    }
};

const toastContainer = document.getElementById('toast-container');

function createToast(type, message, duration = 5000) {
    if (!toastContainer) {
        console.error('Toast container not found!');
        return;
    }

    const details = toastDetails[type];
    if (!details) {
        console.error(`Invalid toast type: ${type}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const titleIcon = `<svg class="title-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.106a.75.75 0 0 1 0 1.06l-1.591 1.591a.75.75 0 1 1-1.06-1.06l1.591-1.591a.75.75 0 0 1 1.06 0ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 1 .75.75ZM17.894 17.894a.75.75 0 0 1-1.06 0l-1.591-1.591a.75.75 0 1 1 1.06-1.06l1.591 1.591a.75.75 0 0 1 0 1.06ZM12 18a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.894a.75.75 0 0 1 0-1.06l1.591-1.591a.75.75 0 0 1 1.06 1.06l-1.591 1.591a.75.75 0 0 1-1.06 0ZM4.5 12a.75.75 0 0 1-.75.75H1.5a.75.75 0 0 1 0-1.5h2.25a.75.75 0 0 1 .75.75ZM7.758 6.106a.75.75 0 0 1 1.06 0l1.591 1.591a.75.75 0 0 1-1.06 1.06L7.758 7.167a.75.75 0 0 1 0-1.06Z" /></svg>`;
    const closeIcon = `<svg viewBox="0 0 20 20" fill="currentColor"><path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" /></svg>`;

    toast.innerHTML = `<div class="toast-icon">${details.icon}</div><div class="toast-content"><div class="toast-title">${titleIcon}<span>${details.title}</span></div><p class="toast-message">${message}</p><div class="toast-actions"><button>Action</button><button>Action</button></div></div><button class="toast-close">${closeIcon}</button>`;

    const removeToast = () => {
        toast.classList.add('fade-out');
        toast.addEventListener('transitionend', () => {
            toast.remove();
        }, { once: true });
    };

    toast.querySelector('.toast-close').addEventListener('click', removeToast);
    toastContainer.appendChild(toast);
    setTimeout(removeToast, duration);
}

function showToast(type, Mensagem) {
    createToast(type, Mensagem);
     AdicionarNotificacaoMenuWindow('fa fa-info-circle', Mensagem);
}
// =======================================  