document.addEventListener('DOMContentLoaded', () => {
    const closeModalBtn = document.getElementById('closeModalBtn');
    const modalOverlay = document.getElementById('signatureModal');
    const signatureCanvas = document.getElementById('signatureCanvas');
    const clearCanvasBtn = document.getElementById('clearCanvasBtn');
    const uploadPhotoCheck = document.getElementById('uploadPhotoCheck');
    const dropzoneContainer = document.getElementById('dropzoneContainer');
    const fileInput = document.getElementById('fileInput');
    const fileNameDisplay = document.getElementById('fileNameDisplay');
    const agreeTermsCheck = document.getElementById('agreeTermsCheck');
    const finishContractBtn = document.getElementById('finishContractBtn');
    const signFileBtn = document.getElementById('sign-file');

    let ctx = signatureCanvas.getContext('2d');
    let isDrawing = false;
    let photoFile = null;

    function isCanvasEmpty() {
        const imageData = ctx.getImageData(0, 0, signatureCanvas.width, signatureCanvas.height).data;
        return Array.from(imageData).every(channel => channel === 0);
    }


    function updateFinishButtonState() {
        const agreedToTerms = agreeTermsCheck.checked;
        const wantsToUpload = uploadPhotoCheck.checked;
        const photoIsLoaded = photoFile !== null;

        let canFinish = false;

        if (!agreedToTerms) {
            canFinish = false;
        } else if (wantsToUpload && !photoIsLoaded) {
            canFinish = false;
        } else {
            canFinish = true;
        }

        finishContractBtn.disabled = !canFinish;
    }



    function resizeCanvas() {
        const container = signatureCanvas.parentElement;
        signatureCanvas.width = container.clientWidth;
        signatureCanvas.height = 250;
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }

    function clearCanvas() {
        ctx.clearRect(0, 0, signatureCanvas.width, signatureCanvas.height);
        updateFinishButtonState();
    }

    function getMousePos(canvas, evt) {
        const rect = canvas.getBoundingClientRect();
        const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
        const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
        return { x: clientX - rect.left, y: clientY - rect.top };
    }

    function convertFileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    function startDrawing(e) {
        e.preventDefault();
        isDrawing = true;
        let pos = getMousePos(signatureCanvas, e);
        ctx.beginPath();
        ctx.moveTo(pos.x, pos.y);
    }

    function draw(e) {
        e.preventDefault();
        if (!isDrawing) return;
        let pos = getMousePos(signatureCanvas, e);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
    }

    function stopDrawing() {
        isDrawing = false;
    }

    // Eventos de Desenho
    signatureCanvas.addEventListener('mousedown', startDrawing);
    signatureCanvas.addEventListener('mousemove', draw);
    signatureCanvas.addEventListener('mouseup', stopDrawing);
    signatureCanvas.addEventListener('mouseleave', stopDrawing);
    signatureCanvas.addEventListener('touchstart', startDrawing);
    signatureCanvas.addEventListener('touchmove', draw);
    signatureCanvas.addEventListener('touchend', stopDrawing);

    // ----------------------------------------------------------------------
    // Modal e Controles (CORRIGIDO: clearCanvasBtn)
    // ----------------------------------------------------------------------

    function closeAnimatedModal() {
        modalOverlay.classList.remove('active');
    }

    signFileBtn.addEventListener('click', () => {
        modalOverlay.classList.add('active');
        resizeCanvas();
        updateFinishButtonState();
    });


    closeModalBtn.addEventListener('click', closeAnimatedModal);

    // CORREÇÃO: Listener para o botão Limpar Canvas
    clearCanvasBtn.addEventListener('click', clearCanvas);

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeAnimatedModal();
        }
    });

    // Event Listener: Checkbox de Upload
    uploadPhotoCheck.addEventListener('change', () => {
        dropzoneContainer.style.display = uploadPhotoCheck.checked ? 'flex' : 'none';

        if (!uploadPhotoCheck.checked) {
            photoFile = null;
            fileInput.value = '';
            fileNameDisplay.textContent = '';
        }
        updateFinishButtonState();
    });

    // Event Listener: Checkbox de Termos
    agreeTermsCheck.addEventListener('change', updateFinishButtonState);

    // ----------------------------------------------------------------------
    // Drag & Drop Handlers
    // ----------------------------------------------------------------------

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, () => dropzoneContainer.classList.add('drag-over'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropzoneContainer.addEventListener(eventName, () => dropzoneContainer.classList.remove('drag-over'), false);
    });

    dropzoneContainer.addEventListener('drop', handleDrop, false);
    fileInput.addEventListener('change', (e) => {
        handleFiles(e.target.files);
    });

    function handleDrop(e) {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
    }

    function handleFiles(files) {
        if (files.length === 0) return;

        const file = files[0];
        if (!file.type.startsWith('image/')) {
            alert('Por favor, selecione um arquivo de imagem válido.');
            return;
        }

        photoFile = file;
        fileNameDisplay.textContent = `Arquivo carregado: ${file.name}`;

        // ATUALIZA O BOTÃO SEMPRE QUE O ARQUIVO É CARREGADO
        updateFinishButtonState();
    }

    // ----------------------------------------------------------------------
    // Envio para o Backend
    // ----------------------------------------------------------------------

    // ... (outras funções e variáveis)

    finishContractBtn.addEventListener('click', async () => {
        // 1. Validação Final
        const canvasIsEmpty = isCanvasEmpty();
        let signatureBase64 = '';
        if (!canvasIsEmpty) {
            signatureBase64 = signatureCanvas.toDataURL('image/png').split(',')[1];
        }

        let realPhotoBase64 = '';
        if (photoFile) {
            realPhotoBase64 = (await convertFileToBase64(photoFile)).split(',')[1];
        }

        if (!signatureBase64 && !realPhotoBase64) {
            alert('O contrato não pode ser finalizado. Desenhe uma assinatura no canvas OU envie uma foto.');
            updateFinishButtonState();
            return;
        }

        const payload = {
            signature: signatureBase64,
            real_photo_base64: realPhotoBase64,
            idcontrato: ID_CONTRATO,
        };

        finishContractBtn.disabled = true;
        finishContractBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviando...';
        const csrfToken = document.querySelector('[name=csrfmiddlewaretoken]').value;

        try {
            // 4. CHAMADA REAL À API USANDO FETCH com JSON
            const response = await fetch(DJANGO_SAVE_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify(payload),
            });

            // 5. Verifica o status HTTP
            if (response.ok) {
                closeAnimatedModal();
                window.location.href = '/signing/complete/';

            } else {
                // Trata erros 4xx e 5xx do servidor
                let errorMessage = `Erro de servidor (${response.status}).`;
                try {
                    const errorData = await response.json();
                    if (errorData.error) {
                        errorMessage = errorData.error;
                    }
                } catch (e) {
                    // Não foi possível ler o JSON de erro
                }
                throw new Error(errorMessage);
            }

        } catch (error) {
            console.error('Erro no envio:', error);
            alert(`Erro ao finalizar o contrato: ${error.message}`);

        } finally {
            // 6. Reseta o estado do botão
            updateFinishButtonState();
            finishContractBtn.innerHTML = '<i class="fas fa-check-circle"></i> Finalizar Contrato / Assinar';
        }
    });

    // ----------------------------------------------------------------------
    // Inicialização
    // ----------------------------------------------------------------------

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();
});