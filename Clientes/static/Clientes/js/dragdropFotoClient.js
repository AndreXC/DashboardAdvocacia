document.addEventListener('DOMContentLoaded', () => {
    // Seleciona os elementos do DOM
    const dragDropArea = document.getElementById('drag-drop-area');
    const fileInput = document.getElementById('photoUpload');
    const previewContainer = document.getElementById('preview-container');
    const previewImage = document.getElementById('preview-image');
    const fileName = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');

    // Função para tratar o arquivo e mostrar a pré-visualização
    const handleFile = (file) => {
        if (file && file.type.startsWith('image/')) {
            const reader = new FileReader();

            reader.onload = function (e) {
                previewImage.src = e.target.result;
                fileName.textContent = file.name;
                // Adiciona a classe que muda o layout via CSS
                dragDropArea.classList.add('has-file');
            };

            reader.readAsDataURL(file);
        } else {
            // Reseta em caso de arquivo inválido
            resetComponent();
            alert("Por favor, selecione um arquivo de imagem válido.");
        }
    };

    // Função para resetar o componente ao estado inicial
    const resetComponent = () => {
        fileInput.value = ''; // Limpa o valor do input de arquivo
        previewImage.src = '#';
        fileName.textContent = '';
        dragDropArea.classList.remove('has-file');
    };

    // --- EVENT LISTENERS ---

    // Adiciona a classe 'drag-over' quando um arquivo é arrastado sobre a área
    dragDropArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        dragDropArea.classList.add('drag-over');
    });

    // Remove a classe 'drag-over' quando o arquivo sai da área
    dragDropArea.addEventListener('dragleave', () => {
        dragDropArea.classList.remove('drag-over');
    });

    // Processa o arquivo quando ele é solto na área
    dragDropArea.addEventListener('drop', (e) => {
        e.preventDefault();
        dragDropArea.classList.remove('drag-over');

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            handleFile(files[0]);
        }
    });

    // CORREÇÃO APLICADA AQUI
    // Abre o seletor de arquivos ao clicar na área
    dragDropArea.addEventListener('click', (e) => {
        // Previne o comportamento padrão do label, que causava o duplo clique.
        e.preventDefault();
        fileInput.click();
    });

    // Processa o arquivo quando selecionado pelo seletor de arquivos
    fileInput.addEventListener('change', () => {
        const files = fileInput.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });

    // Reseta o componente ao clicar no botão de remover
    removeFileBtn.addEventListener('click', (e) => {
        // Impede que o clique se propague para o label e abra o seletor de arquivos
        e.stopPropagation();
        e.preventDefault();
        resetComponent();
    });
});