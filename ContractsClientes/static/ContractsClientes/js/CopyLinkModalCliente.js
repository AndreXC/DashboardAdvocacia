document.addEventListener('DOMContentLoaded', function () {
    const allCopyButtons = document.querySelectorAll('.copy-btn');

    allCopyButtons.forEach(button => {
        button.addEventListener('click', function () {
            const input = this.previousElementSibling;
            const icon = this.querySelector('i');

            input.select();
            input.setSelectionRange(0, 99999); // Para mobile

            try {
                document.execCommand('copy');

            } catch (err) {
                console.error('Falha ao copiar o texto: ', err);
            }

            // Remove a seleção do texto
            window.getSelection().removeAllRanges();
        });
    });
});