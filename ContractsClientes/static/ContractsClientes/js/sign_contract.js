// =========================================================================
// VARIÁVEIS E CONFIGURAÇÕES GLOBAIS
// =========================================================================

// REMOVIDA: const PDF_URL = './livro-diretrizes-ia-1.pdf';

// Variáveis globais para gerenciar o estado do documento
let pdfDoc = null;
let pageNum = 1;
// A variável 'scale' foi ajustada para que o primeiro clique de zoomOut resulte em 100%.
let scale = 1.0;

// Referências aos elementos do DOM
const sidebar = document.getElementById('sidebar');
const thumbnailsContainer = document.getElementById('thumbnails-container');
const outlineContainer = document.getElementById('outline-container');
const pdfViewerContainer = document.querySelector('.pdf-viewer-container');

const zoomInBtn = document.getElementById('zoom-in');
const zoomOutBtn = document.getElementById('zoom-out');
const toggleSidebarBtn = document.getElementById('toggle-sidebar');
const currentPageSpan = document.getElementById('current-page-display');
const totalPagesSpan = document.getElementById('total-pages-display');
const documentNameSpan = document.getElementById('document-name');
const zoomLevelSpan = document.getElementById('zoom-level');

// Botões das abas da barra lateral
const showThumbnailsBtn = document.getElementById('show-thumbnails');
const showOutlineBtn = document.getElementById('show-outline');


// =========================================================================
// FUNÇÕES DE UTILIDADE
// =========================================================================

/**
 * Converte uma string Base64 em um Uint8Array (formato binário).
 * @param {string} base64 - A string Base64 do PDF.
 * @returns {Uint8Array} - O ArrayBuffer binário para o PDF.js.
 */
function base64ToUint8Array(base64) {
    const raw = window.atob(base64);
    const rawLength = raw.length;
    const array = new Uint8Array(new ArrayBuffer(rawLength));

    for (let i = 0; i < rawLength; i++) {
        array[i] = raw.charCodeAt(i);
    }
    return array;
}

async function createAllPages() {
    if (!pdfDoc) return;

    pdfViewerContainer.innerHTML = '';
    const renderPromises = [];

    for (let i = 1; i <= pdfDoc.numPages; i++) {
        renderPromises.push(new Promise(async (resolve, reject) => {
            try {
                const page = await pdfDoc.getPage(i);
                const viewport = page.getViewport({ scale: scale });
                const pageDiv = document.createElement('div');
                const pageCanvas = document.createElement('canvas');

                pageDiv.className = 'pdf-viewer';
                pageDiv.dataset.pageNumber = i;
                pageCanvas.className = 'page-canvas';
                pageCanvas.height = viewport.height;
                pageCanvas.width = viewport.width;

                const renderContext = {
                    canvasContext: pageCanvas.getContext('2d'),
                    viewport: viewport,
                };

                // Use page.render para renderizar a página
                await page.render(renderContext).promise;

                pageDiv.appendChild(pageCanvas);
                pdfViewerContainer.appendChild(pageDiv);

                resolve(pageDiv);
            } catch (error) {
                console.error(`Erro ao criar a página ${i}:`, error);
                reject(error);
            }
        }));
    }

    await Promise.all(renderPromises);
    console.log("Todas as páginas foram criadas.");
    setupIntersectionObserver();
}

/**
 * Redimensiona e renderiza as páginas existentes com o novo nível de zoom.
 * Esta função é chamada nos eventos de zoom.
 */
async function updatePageScaleAndRender() {
    if (!pdfDoc) return;

    const pageDivs = document.querySelectorAll('.pdf-viewer');
    const renderPromises = [];

    for (let i = 0; i < pageDivs.length; i++) {
        const pageDiv = pageDivs[i];
        const pageNumber = i + 1;

        renderPromises.push(new Promise(async (resolve, reject) => {
            try {
                const page = await pdfDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: scale });
                const pageCanvas = pageDiv.querySelector('.page-canvas');

                pageCanvas.height = viewport.height;
                pageCanvas.width = viewport.width;

                const renderContext = {
                    canvasContext: pageCanvas.getContext('2d'),
                    viewport: viewport,
                };

                await page.render(renderContext).promise;
                resolve();
            } catch (error) {
                console.error(`Erro ao redimensionar a página ${pageNumber}:`, error);
                reject(error);
            }
        }));
    }

    await Promise.all(renderPromises);
    console.log("Todas as páginas foram redimensionadas.");
}

// =========================================================================
// FUNÇÕES DE NAVEGAÇÃO E ZOOM
// =========================================================================

/**
 * Navega para uma página específica, rolando para sua posição.
 * @param {number} num - O número da página de destino.
 */
function goToPage(num) {
    if (!pdfDoc || num < 1 || num > pdfDoc.numPages) return;

    const pageElement = pdfViewerContainer.querySelector(`[data-page-number="${num}"]`);
    if (pageElement) {
        pageElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

/**
 * Aumenta o zoom do PDF.
 */
function zoomIn() {
    if (!pdfDoc) {
        console.error("Erro: O documento PDF ainda não foi carregado.");
        return;
    }
    scale = Math.round((scale + 0.25) * 100) / 100;
    updateZoomLevel();
    updatePageScaleAndRender();
}

/**
 * Diminui o zoom do PDF.
 */
function zoomOut() {
    if (!pdfDoc) {
        console.error("Erro: O documento PDF ainda não foi carregado.");
        return;
    }
    if (scale <= 0.25) {
        return;
    }
    scale = Math.round((scale - 0.25) * 100) / 100;
    updateZoomLevel();
    updatePageScaleAndRender();
}

/**
 * Atualiza o nível de zoom exibido na interface.
 */
function updateZoomLevel() {
    zoomLevelSpan.textContent = `${Math.round(scale * 100)}%`;
}


// =========================================================================
// FUNÇÕES DA BARRA LATERAL
// =========================================================================

/**
 * Alterna a visibilidade da barra lateral.
 */
function toggleSidebar() {
    sidebar.classList.toggle('collapsed');
}

/**
 * Alterna entre as abas de Páginas e Tópicos.
 * @param {string} tab - 'thumbnails' ou 'outline'.
 */
function showTab(tab) {
    thumbnailsContainer.classList.remove('active');
    outlineContainer.classList.remove('active');
    showThumbnailsBtn.classList.remove('active');
    showOutlineBtn.classList.remove('active');

    if (tab === 'thumbnails') {
        thumbnailsContainer.classList.add('active');
        showThumbnailsBtn.classList.add('active');
    } else if (tab === 'outline') {
        outlineContainer.classList.add('active');
        showOutlineBtn.classList.add('active');
    }
}

/**
 * Gera miniaturas de todas as páginas do PDF na barra lateral.
 */
function generateThumbnails() {
    thumbnailsContainer.innerHTML = '';
    for (let i = 1; i <= pdfDoc.numPages; i++) {
        pdfDoc.getPage(i).then(page => {
            const viewport = page.getViewport({ scale: 0.25 });
            const thumbnailCanvas = document.createElement('canvas');
            const thumbnailCtx = thumbnailCanvas.getContext('2d');
            thumbnailCanvas.className = 'thumbnail-canvas';
            thumbnailCanvas.width = viewport.width;
            thumbnailCanvas.height = viewport.height;
            thumbnailCanvas.dataset.page = i;

            page.render({
                canvasContext: thumbnailCtx,
                viewport: viewport,
            });

            thumbnailCanvas.addEventListener('click', () => {
                goToPage(i);
            });
            thumbnailsContainer.appendChild(thumbnailCanvas);
        });
    }
}

/**
 * Atualiza a miniatura ativa na barra lateral.
 * @param {number} page - A página atual.
 */
function updateActiveThumbnail(page) {
    document.querySelectorAll('.thumbnail-canvas').forEach(thumb => {
        thumb.classList.remove('current-page');
        if (parseInt(thumb.dataset.page) === page) {
            thumb.classList.add('current-page');
            thumb.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    });
}

/**
 * Gera a estrutura do sumário do PDF na barra lateral.
 */
async function generateOutline() {
    try {
        const outline = await pdfDoc.getOutline();
        outlineContainer.innerHTML = '';
        if (!outline || outline.length === 0) {
            outlineContainer.innerHTML = '<p class="no-outline-message">Este documento não tem um sumário.</p>';
            return;
        }

        outline.forEach(item => {
            const listItem = document.createElement('div');
            listItem.className = 'outline-item';
            listItem.textContent = item.title;

            pdfDoc.getDestination(item.dest).then(destArray => {
                if (destArray) {
                    pdfDoc.getPageIndex(destArray[0]).then(pageIndex => {
                        const pageNum = pageIndex + 1;
                        listItem.dataset.page = pageNum;
                        listItem.addEventListener('click', () => {
                            goToPage(pageNum);
                        });
                    });
                }
            });
            outlineContainer.appendChild(listItem);
        });
    } catch (error) {
        console.error('Erro ao gerar o sumário:', error);
    }
}

/**
 * Atualiza o item do sumário que corresponde à página atual.
 * @param {number} page - A página atual.
 */
function updateActiveOutline(page) {
    document.querySelectorAll('.outline-item').forEach(item => {
        item.classList.remove('active');
        if (parseInt(item.dataset.page) === page) {
            item.classList.add('active');
        }
    });
}


/**
 * Carrega e renderiza um documento PDF a partir de um ArrayBuffer.
 * @param {Uint8Array} data - Os dados do PDF.
 */
async function loadPdf(data) {
    try {
        scale = 1.0;

        pdfDoc = await pdfjsLib.getDocument({ data: data }).promise;
        totalPagesSpan.textContent = pdfDoc.numPages;

        updateZoomLevel();

        await createAllPages();

        generateThumbnails();
        generateOutline();

    } catch (error) {
        console.error('Erro ao carregar o PDF:', error);
        alert('Erro ao carregar o arquivo PDF. Por favor, tente novamente.');
    }
}
function setupIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const pageNumber = parseInt(entry.target.dataset.pageNumber);
                currentPageSpan.textContent = pageNumber;
                updateActiveThumbnail(pageNumber);
                updateActiveOutline(pageNumber);
            }
        });
    }, {
        root: pdfViewerContainer,
        threshold: 0.5
    });

    document.querySelectorAll('.pdf-viewer').forEach(pageDiv => {
        observer.observe(pageDiv);
    });
}

function initializeViewer() {
    const pdfDataB64 = document.getElementById('pdf-data-base64').value;

    if (pdfDataB64) {
        const typedArray = base64ToUint8Array(pdfDataB64);
        loadPdf(typedArray);
    } else {
        console.error("Dados do PDF não encontrados no template.");
    }
}

zoomInBtn.addEventListener('click', zoomIn);
zoomOutBtn.addEventListener('click', zoomOut);
toggleSidebarBtn.addEventListener('click', toggleSidebar);

// Event listeners para as abas da barra lateral
showThumbnailsBtn.addEventListener('click', () => showTab('thumbnails'));
showOutlineBtn.addEventListener('click', () => showTab('outline'));

// Lógica de responsividade para a sidebar
window.addEventListener('resize', () => {
    if (window.innerWidth > 768) {
        sidebar.classList.remove('collapsed');
        sidebar.classList.remove('expanded');
    }
});

// CHAMA A FUNÇÃO DE INICIALIZAÇÃO AO CARREGAR A PÁGINA
window.addEventListener('load', initializeViewer);