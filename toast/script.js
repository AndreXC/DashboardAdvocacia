/**
 * Exibe uma notificação toast na tela.
 *
 * @param {object} options - As opções para o toast.
 * @param {string} options.type - O tipo de toast ('success', 'info', 'warning', 'error').
 * @param {string} options.message - A mensagem principal a ser exibida.
 * @param {number} [options.duration=5000] - A duração em milissegundos antes do toast desaparecer.
 */
function showToast({ type, message, duration = 5000 }) {
    const container = document.getElementById('toast-container');
    if (!container) {
        console.error('O contêiner de toast (#toast-container) não foi encontrado no DOM.');
        return;
    }

    // ATUALIZADO: Mapeamento para os ícones do Font Awesome
    const toastDetails = {
        success: {
            icon: 'fa-check',
            title: 'Success notification'
        },
        info: {
            icon: 'fa-info',
            title: 'Informational notification'
        },
        warning: {
            icon: 'fa-triangle-exclamation',
            title: 'Warning notification'
        },
        error: {
            icon: 'fa fa-times-circle-o',
            title: 'Error notification'
        }
    };

    // Ícone de brilho do Font Awesome
    const sparkleIcon = 'fa-wand-magic-sparkles';

    const detail = toastDetails[type];
    if (!detail) {
        console.error(`Tipo de toast inválido: ${type}`);
        return;
    }

    const toast = document.createElement('div');
    toast.className = `toast toast--${type}`;

    // ATUALIZADO: Montar o HTML com as classes do Font Awesome (fa-solid fa-...)
    toast.innerHTML = `
        <div class="toast__icon-wrapper">
            <i class="fa-solid ${detail.icon}"></i>
        </div>
        <div class="toast__content">
            <div class="toast__title-wrapper">
                <i class="fa-solid ${sparkleIcon} toast__sparkle-icon"></i>
                <p class="toast__title">${detail.title}</p>
            </div>
            <p class="toast__message">${message}</p>
            <div class="toast__actions">
                <button class="toast__action">Action</button>
                <button class="toast__action">Action</button>
            </div>
        </div>
        <button class="toast__close">&times;</button>
    `;

    container.appendChild(toast);
    toast.classList.add('show');
    // setTimeout(() => {
    //     toast.classList.add('show');
    // }, 100);

    // const removeToast = () => {
    //     toast.classList.remove('show');
    //     toast.addEventListener('transitionend', () => toast.remove());
    // };

    // const autoCloseTimeout = setTimeout(removeToast, duration);

    // toast.querySelector('.toast__close').addEventListener('click', () => {
    //     clearTimeout(autoCloseTimeout);
    //     removeToast();
    // });
}