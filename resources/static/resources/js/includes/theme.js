document.addEventListener('DOMContentLoaded', () => {
// Seletores de elementos
const sideMenu = document.querySelector('aside');
const menuBtn = document.getElementById('menu-btn');
const themeToggle = document.getElementById('menu-btn-darkmode'); // O id do seu input foi alterado aqui

// Função para aplicar o modo escuro
const applyDarkMode = () => {
  document.body.classList.add('dark-theme-variables');
};

// Função para aplicar o modo claro
const applyLightMode = () => {
  document.body.classList.remove('dark-theme-variables');
};

// Checa o localStorage ao carregar a página

  const isDarkMode = localStorage.getItem('isDarkMode');
  if (isDarkMode === 'true') {
    applyDarkMode();
    themeToggle.checked = false; // Desmarcado para o modo escuro
  } else {
    applyLightMode();
    themeToggle.checked = true; // Marcado para o modo claro
  }

// Evento para abrir o menu
menuBtn.addEventListener('click', () => {
  sideMenu.style.display = 'block';
});

// Evento para alternar o tema com o novo checkbox
themeToggle.addEventListener('change', () => {
  // Salva o estado no localStorage
  if (themeToggle.checked) {
    localStorage.setItem('isDarkMode', 'false'); // Se marcado, é modo claro
    applyLightMode();
  } else {
    localStorage.setItem('isDarkMode', 'true'); // Se desmarcado, é modo escuro
    applyDarkMode();
  }
});
});
