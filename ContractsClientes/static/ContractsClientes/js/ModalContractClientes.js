document.addEventListener('DOMContentLoaded', function () {

    // --- 1. SELEÇÃO DOS ELEMENTOS DO HTML ---

    // O modal principal que será exibido/escondido
    const modal = document.getElementById('create-contract-modal');

    // O seu botão flutuante que vai ABRIR o modal
    const openModalBtn = document.getElementById('add-new-Contrato-cliente');

    // Todos os botões que servem para FECHAR o modal (o 'X' e o botão 'Cancelar')
    const closeModalBtns = modal.querySelectorAll('.close-button, .cancel-btn');

    // O formulário de criação de contrato que está dentro do modal
    const contractForm = document.getElementById('create-contract-form');

    // A `div` dentro do modal onde as mensagens de erro de validação serão exibidas
    const formErrorsDiv = document.getElementById('form-errors');


    // --- 2. FUNÇÃO PARA OBTER O CSRF TOKEN DO DJANGO ---
    // Isto é essencial para que o Django aceite requisições POST via AJAX com segurança.
    function getCookie(name) {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
            const cookies = document.cookie.split(';');
            for (let i = 0; i < cookies.length; i++) {
                const cookie = cookies[i].trim();
                if (cookie.substring(0, name.length + 1) === (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
    const csrftoken = getCookie('csrftoken');


    // --- 3. LÓGICA PARA ABRIR E FECHAR O MODAL ---

    // Adiciona um "ouvinte" de clique ao botão para abrir o modal
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => {
            modal.style.display = 'flex'; // Muda o estilo do modal para 'block' para exibi-lo
        });
    }

    // Adiciona o mesmo "ouvinte" para todos os botões de fechar
    closeModalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modal.style.display = 'none'; // Muda o estilo para 'none' para escondê-lo
        });
    });

    // Permite fechar o modal clicando fora da área de conteúdo (no fundo cinza)
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    });


    // --- 4. LÓGICA PARA ENVIAR O FORMULÁRIO COM AJAX ---

    // Adiciona um "ouvinte" para o evento de 'submit' do formulário
    contractForm.addEventListener('submit', function (e) {
        // Previne o comportamento padrão do navegador, que é recarregar a página
        e.preventDefault();

        // Limpa as mensagens de erro de tentativas anteriores
        formErrorsDiv.innerHTML = '';

        // Coleta todos os dados preenchidos no formulário
        const formData = new FormData(contractForm);

        // Usa a API Fetch para enviar os dados para a URL definida no 'action' do form
        fetch(contractForm.action, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRFToken': csrftoken, // Envia o token de segurança do Django
                'X-Requested-With': 'XMLHttpRequest' // Identifica para a view que é uma requisição AJAX
            }
        })
            .then(response => response.json()) // Converte a resposta do servidor para o formato JSON
            .then(data => {
                // Se a resposta da view contiver 'success: true'
                if (data.success) {
                    modal.style.display = 'none'; // Fecha o modal
                    window.location.reload(); // Recarrega a página para mostrar o novo contrato na lista
                } else {
                    // Se houver erros de validação, constrói uma lista com eles
                    let errorHtml = '<ul>';
                    for (const field in data.errors) {
                        errorHtml += `<li>${field}: ${data.errors[field][0].message}</li>`;
                    }
                    errorHtml += '</ul>';
                    // Exibe a lista de erros na div correspondente
                    formErrorsDiv.innerHTML = errorHtml;
                }
            })
            .catch(error => {
                // Em caso de erro de rede ou falha na comunicação com o servidor
                console.error('Error:', error);
                formErrorsDiv.textContent = 'Ocorreu um erro de comunicação ao enviar o formulário.';
            });
    });
});