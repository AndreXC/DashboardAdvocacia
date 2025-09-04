// document.addEventListener("DOMContentLoaded", () => {
//     // 1. SELEÇÃO DOS ELEMENTOS PRINCIPAIS
//     const sidebar = document.querySelector('aside');
//     if (!sidebar) return; // Se não houver sidebar, o script para.

//     const toggleBtn = document.getElementById('toggle-btn');
//     const submenuTriggers = document.querySelectorAll('.has-submenu > a');

//     // 2. VARIÁVEIS DE CONTROLE
//     let isAccordionAnimating = false;
//     const animationSpeed = 300; // Deve ser o mesmo valor da transição no CSS

//     // 3. FUNÇÕES DE LÓGICA

//     /**
//      * Alterna o estado da sidebar e salva no localStorage.
//      * Esta é a ÚNICA função que controla o estado expandido/colapsado.
//      */
//     const handleSidebarToggle = () => {
//         sidebar.classList.toggle('collapsed');
//         localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
//     };

//     /**
//      * Alterna o estado de um submenu (acordeão).
//      * Só funciona se a sidebar estiver expandida.
//      */
//     const handleSubmenuToggle = (event) => {
//         if (!sidebar.classList.contains('collapsed') && !isAccordionAnimating) {
//             event.preventDefault();
//             isAccordionAnimating = true;

//             const parentLi = event.currentTarget.parentElement;
//             parentLi.classList.toggle('open');

//             setTimeout(() => {
//                 isAccordionAnimating = false;
//             }, animationSpeed);
//         }
//     };

//     /**
//      * Restaura o estado da sidebar ao carregar a página.
//      */
//     const restoreSidebarState = () => {
//         if (localStorage.getItem('sidebarState') === 'collapsed') {
//             sidebar.classList.add('collapsed');
//         }
//     };

//     /**
//      * Abre o submenu correto se a página ativa for um de seus filhos.
//      */
//     const openActiveSubmenu = () => {
//         const activeSubmenuLink = document.querySelector('.submenu a.active');
//         if (activeSubmenuLink) {
//             const parentLi = activeSubmenuLink.closest('.has-submenu');
//             if (parentLi) {
//                 parentLi.classList.add('open');
//             }
//         }
//     };

//     // 4. ANEXAÇÃO DOS EVENTOS

//     // Apenas o botão #toggle-btn controla o estado da sidebar
//     if (toggleBtn) {
//         toggleBtn.addEventListener('click', handleSidebarToggle);
//     }

//     submenuTriggers.forEach(trigger => {
//         trigger.addEventListener('click', handleSubmenuToggle);
//     });

//     // 5. INICIALIZAÇÃO
//     restoreSidebarState();
//     openActiveSubmenu();
// });


// document.addEventListener("DOMContentLoaded", () => {
//     const sidebar = document.querySelector('aside');
//     const toggleBtn = document.getElementById('toggle-btn');
//     const submenuTriggers = document.querySelectorAll('.has-submenu > a');
//     let isAccordionAnimating = false;
//     const animationSpeed = 300;

//     const handleSidebarToggle = () => {
//         sidebar.classList.toggle('collapsed');
//         localStorage.setItem('sidebarState', sidebar.classList.contains('collapsed') ? 'collapsed' : 'expanded');
//     };

//     const handleSubmenuToggle = (event) => {
//         if (!sidebar.classList.contains('collapsed') && !isAccordionAnimating) {
//             event.preventDefault();
//             isAccordionAnimating = true;

//             const parentLi = event.currentTarget.parentElement;
//             parentLi.classList.toggle('open');

//             setTimeout(() => {
//                 isAccordionAnimating = false;
//             }, animationSpeed);
//         }
//     };


//     const openActiveSubmenu = () => {
//         const activeSubmenuLink = document.querySelector('.submenu a.active');
//         if (activeSubmenuLink) {
//             const parentLi = activeSubmenuLink.closest('.has-submenu');
//             if (parentLi) {
//                 parentLi.classList.add('open');
//             }
//         }
//     };

//     if (toggleBtn) {
//         toggleBtn.addEventListener('click', handleSidebarToggle);
//     }

//     submenuTriggers.forEach(trigger => {
//         trigger.addEventListener('click', handleSubmenuToggle);
//     });

//     restoreSidebarState();
//     openActiveSubmenu();

// });
document.addEventListener("DOMContentLoaded", () => {
    const sidebar = document.querySelector("aside");
    const toggleBtn = document.getElementById("toggle-btn");
    const allSubmenus = document.querySelectorAll("li.has-submenu");

    // --- Alternar Sidebar ---
    toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("collapsed");

        if (sidebar.classList.contains("collapsed")) {
            allSubmenus.forEach(item => {
                item.classList.remove("open");
                const arrow = item.querySelector(".arrow");
                if (arrow) arrow.style.transform = "rotate(0deg)";

                // 🔹 Garante que o submenu feche instantaneamente
                const submenuWrapper = item.querySelector(".submenu-wrapper");
                if (submenuWrapper) {
                    submenuWrapper.style.transition = "none";
                    submenuWrapper.style.gridTemplateRows = "0fr";
                }
            });

            // Reativa as transições depois de um tick
            requestAnimationFrame(() => {
                allSubmenus.forEach(item => {
                    const submenuWrapper = item.querySelector(".submenu-wrapper");
                    if (submenuWrapper) submenuWrapper.style.transition = "";
                });
            });
        }
    });

    // --- Abrir/Fechar Submenus ---
    allSubmenus.forEach(item => {
        const link = item.querySelector("a");
        const arrow = item.querySelector(".arrow");

        link.addEventListener("click", e => {
            e.preventDefault();

            // Se a sidebar está colapsada, não abre por clique (somente hover no CSS)
            if (sidebar.classList.contains("collapsed")) return;

            // Fecha os outros submenus antes de abrir o atual
            allSubmenus.forEach(sub => {
                if (sub !== item) {
                    sub.classList.remove("open");
                    const subArrow = sub.querySelector(".arrow");
                    if (subArrow) subArrow.style.transform = "rotate(0deg)";
                }
            });

            // Alterna o submenu atual
            item.classList.toggle("open");

            // Roda a seta de forma suave
            if (item.classList.contains("open")) {
                if (arrow) arrow.style.transform = "rotate(180deg)";
            } else {
                if (arrow) arrow.style.transform = "rotate(0deg)";
            }
        });
    });

    // --- Clique fora fecha submenus no modo colapsado ---
    document.addEventListener("click", e => {
        if (!sidebar.contains(e.target) && sidebar.classList.contains("collapsed")) {
            allSubmenus.forEach(item => {
                item.classList.remove("open");
                const arrow = item.querySelector(".arrow");
                if (arrow) arrow.style.transform = "rotate(0deg)";
            });
        }
    });
});
