document.addEventListener('DOMContentLoaded', function() {
    const clientSelect = document.getElementById('id_client_select');
    const serviceSelect = document.getElementById('id_service_select');

    // Desabilita o campo de serviço inicialmente
    serviceSelect.disabled = true;

    clientSelect.addEventListener('change', function() {
        const clientId = this.value;
        
        // Limpa o campo de serviço antes de preencher
        serviceSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
        serviceSelect.disabled = true;

        if (clientId) {
            const url = `/ContractsClientes/api/services-by-client/${clientId}/`;

            fetch(url)
                .then(response => response.json())
                .then(data => {
                    if (data.services.length > 0) {
                        serviceSelect.innerHTML = '<option value="" disabled selected>Selecione um serviço</option>';
                        data.services.forEach(service => {
                            const option = document.createElement('option');
                            option.value = service.id;
                            option.textContent = service.text;
                            serviceSelect.appendChild(option);
                        });
                        serviceSelect.disabled = false;
                    } else {
                        serviceSelect.innerHTML = '<option value="" disabled selected>Nenhum serviço ativo encontrado</option>';
                        serviceSelect.disabled = true;
                    }
                })
                .catch(error => {
                    console.error('Erro ao buscar serviços:', error);
                    serviceSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar serviços</option>';
                    serviceSelect.disabled = true;
                });
        }
    });
});