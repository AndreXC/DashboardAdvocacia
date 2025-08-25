// Seletores de elementos
const sideMenu = document.querySelector('aside');
const menuBtn = document.getElementById('menu-btn');
const themeToggler = document.querySelector('.theme-toggler');

// Função para aplicar o modo escuro
const applyDarkMode = () => {
    document.body.classList.add('dark-theme-variables');
    themeToggler.querySelector('span:nth-child(1)').classList.remove('active');
    themeToggler.querySelector('span:nth-child(2)').classList.add('active');
};

// Função para aplicar o modo claro
const applyLightMode = () => {
    document.body.classList.remove('dark-theme-variables');
    themeToggler.querySelector('span:nth-child(1)').classList.add('active');
    themeToggler.querySelector('span:nth-child(2)').classList.remove('active');
};

// Checa o localStorage ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    const isDarkMode = localStorage.getItem('isDarkMode');
    if (isDarkMode === 'true') {
        applyDarkMode();
    } else {
        applyLightMode();
    }
});

// Evento para abrir o menu
menuBtn.addEventListener('click', () => {
    sideMenu.style.display = 'block';
});

// Evento para alternar o tema
themeToggler.addEventListener('click', () => {
    // Alterna a classe no body
    document.body.classList.toggle('dark-theme-variables');

    // Salva o estado no localStorage
    if (document.body.classList.contains('dark-theme-variables')) {
        localStorage.setItem('isDarkMode', 'true');
        applyDarkMode();
    } else {
        localStorage.setItem('isDarkMode', 'false');
        applyLightMode();
    }
});