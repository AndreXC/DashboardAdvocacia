document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // ESTADO DA APLICAÇÃO (STATE)
    // =================================================================================
    let currentCustomerId = null;
    let currentServiceId = null;
    let isEditMode = false;
    // Cache dos dados dos clientes para a busca no frontend.
    let customerCache = [];


    // =================================================================================
    // SELETORES DO DOM
    // =================================================================================
    const searchInput = document.getElementById('search-input');
    const customerListTbody = document.getElementById('customer-list-tbody');
    const emptyState = document.getElementById('empty-state');
    const customerContent = document.getElementById('customer-content');
    const detailTabs = document.querySelector('.detail-tabs');
    const tabContentInfo = document.getElementById('tab-content-info');
    const servicesTbody = document.getElementById('services-tbody');
    const contractsTbody = document.getElementById('contracts-tbody');
    const invoicesTbody = document.getElementById('invoices-tbody');
    const serviceInvoicesSection = document.getElementById('service-invoices-section');
    const totalInvoicesAmountEl = document.getElementById('total-invoices-amount');
    const customerModal = document.getElementById('customer-modal');
    const serviceModal = document.getElementById('service-modal');
    const deleteConfirmationModal = document.getElementById('delete-confirmation-modal');
    const alertModal = document.getElementById('alert-modal');
    const alertModalText = document.getElementById('alert-modal-text');
    const customerForm = document.getElementById('customer-form');
    const serviceForm = document.getElementById('service-form');
    const paymentTypeSelect = document.getElementById('paymentType');
    const entryValueGroup = document.getElementById('entry-value-group');
    const parcelamentoGroup = document.getElementById('parcelamento-group');
    const firstPaymentDateInput = document.getElementById('firstPaymentDate');
    const addNewCustomerBtn = document.getElementById('add-new-customer-btn');
    const addNewServiceBtn = document.getElementById('add-new-service-btn');
    const editCustomerBtn = document.getElementById('edit-customer-btn');
    const deleteCustomerBtn = document.getElementById('delete-customer-btn');
    const saveCustomerBtn = document.getElementById('save-customer-btn');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const deleteModalText = document.getElementById('delete-modal-text');
    const deleteConfirmBtn = document.getElementById('delete-confirm-btn');


    // =================================================================================
    // FUNÇÕES AUXILIARES E API
    // =================================================================================
    const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const getCsrfToken = () => document.querySelector('[name=csrfmiddlewaretoken]').value;

    const showAlert = (message) => {
        alertModalText.textContent = message;
        openModal(alertModal);
    };

    const openModal = (modal) => modal.classList.add('show');
    const closeModal = (modal) => modal.classList.remove('show');

    // Função centralizada para todas as requisições à API Django
    const apiRequest = async (url, method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken(),
            },
        };
        if (body) {
            options.body = JSON.stringify(body);
        }
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Erro HTTP! Status: ${response.status}` }));
                throw new Error(errorData.error || `Erro desconhecido`);
            }
            if (response.status === 204) { // No Content
                return null;
            }
            return response.json();
        } catch (error) {
            console.error('Erro na requisição API:', error);
            showAlert(error.message);
            throw error;
        }
    };


    // =================================================================================
    // FUNÇÕES DE RENDERIZAÇÃO (manipulam o DOM)
    // =================================================================================

    const renderCustomerList = (customers) => {
        // Limpa a lista antes de renderizar (importante para a busca)
        customerListTbody.innerHTML = '';
        if (!customers || customers.length === 0) {
            customerListTbody.innerHTML = '<tr><td colspan="2">Nenhum cliente encontrado.</td></tr>';
            return;
        }
        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.dataset.customerId = customer.id;
            row.className = customer.id === currentCustomerId ? 'selected' : '';
            // Usa fullName vindo da API
            row.innerHTML = `<td>${customer.fullName}</td><td>${customer.company || '-'}</td>`;
            customerListTbody.appendChild(row);
        });
    };

    const renderInfoFields = (customer, inEditMode = false) => {
        const fields = [
            { label: 'Nome', key: 'firstName', value: customer.firstName }, { label: 'Sobrenome', key: 'lastName', value: customer.lastName },
            { label: 'E-mail', key: 'email', value: customer.email, type: 'email' }, { label: 'Telefone', key: 'phone', value: customer.phone, type: 'tel' },
            { label: 'Endereço', key: 'address', value: customer.address }, { label: 'Empresa', key: 'company', value: customer.company },
            { label: 'Cargo', key: 'position', value: customer.position },
        ];
        tabContentInfo.innerHTML = '<div class="info-grid"></div>';
        const infoGrid = tabContentInfo.querySelector('.info-grid');
        fields.forEach(field => {
            const infoItem = document.createElement('div');
            infoItem.className = 'info-item';
            if (inEditMode) {
                infoItem.innerHTML = `<label for="edit-${field.key}">${field.label}</label><input type="${field.type || 'text'}" id="edit-${field.key}" value="${field.value || ''}" />`;
            } else {
                infoItem.innerHTML = `<label>${field.label}</label><p>${field.value || '-'}</p>`;
            }
            infoGrid.appendChild(infoItem);
        });
    };

    const renderServicesList = (services) => {
        servicesTbody.innerHTML = '';
        if (!services || services.length === 0) {
            servicesTbody.innerHTML = '<tr><td colspan="3">Nenhum serviço contratado.</td></tr>';
            return;
        }
        services.forEach(service => {
            const row = document.createElement('tr');
            row.dataset.serviceId = service.id; // ID do banco de dados
            row.className = service.id === currentServiceId ? 'selected' : '';
            const statusClass = service.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            row.innerHTML = `
                <td class="service-name-cell">${service.name}</td>
                <td>
                    <select class="status-select status-${statusClass}" data-entity="service" data-id="${service.id}">
                        <option value="Ativo" ${service.status === 'Ativo' ? 'selected' : ''}>Ativo</option>
                        <option value="Finalizado" ${service.status === 'Finalizado' ? 'selected' : ''}>Finalizado</option>
                        <option value="Cancelado" ${service.status === 'Cancelado' ? 'selected' : ''}>Cancelado</option>
                    </select>
                </td>
                <td>${formatCurrency(service.totalValue)}</td>
            `;
            servicesTbody.appendChild(row);
        });
    };

    const renderInvoicesForService = (service) => {
        invoicesTbody.innerHTML = '';
        currentServiceId = service.id;

        // Re-renderiza a lista de serviços para mostrar a seleção
        document.querySelectorAll('#services-tbody tr').forEach(row => {
            row.classList.toggle('selected', row.dataset.serviceId == service.id);
        });

        if (!service.invoices || service.invoices.length === 0) {
            invoicesTbody.innerHTML = '<tr><td colspan="4">Nenhuma fatura para este serviço.</td></tr>';
            totalInvoicesAmountEl.textContent = formatCurrency(0);
            serviceInvoicesSection.classList.add('hidden');
            return;
        }

        const isServiceLocked = service.status === 'Finalizado' || service.status === 'Cancelado';
        service.invoices.forEach(invoice => {
            const row = document.createElement('tr');
            const statusClass = invoice.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            let statusCellHtml = '';

            if (isServiceLocked) {
                statusCellHtml = `<span class="status-badge status-${statusClass}">${invoice.status}</span>`;
            } else {
                statusCellHtml = `
                    <select class="status-select status-${statusClass}" data-entity="invoice" data-id="${invoice.id}">
                        <option value="pendente" ${invoice.status === 'pendente' ? 'selected' : ''}>Pendente</option>
                        <option value="pago" ${invoice.status === 'pago' ? 'selected' : ''}>Pago</option>
                        <option value="vencido" ${invoice.status === 'vencido' ? 'selected' : ''}>Vencido</option>
                    </select>`;
            }
            row.innerHTML = `
                <td>${invoice.description}</td>
                <td>${formatDate(invoice.dueDate)}</td>
                <td>${statusCellHtml}</td>
                <td>${formatCurrency(invoice.value)}</td>`;
            invoicesTbody.appendChild(row);
        });

        totalInvoicesAmountEl.textContent = formatCurrency(service.totalValue);
        serviceInvoicesSection.classList.remove('hidden');
    };

    const displayCustomerDetails = async (customerId) => {
        try {
            // Busca os dados completos do cliente, incluindo serviços e faturas, da API
            const customer = await apiRequest(`/api/customers/${customerId}/`);
            if (!customer) return;

            if (isEditMode) await exitEditMode(false, customer);
            currentCustomerId = customer.id;

            // Atualiza a classe 'selected' na lista
            document.querySelectorAll('#customer-list-tbody tr').forEach(row => {
                row.classList.toggle('selected', row.dataset.customerId == customer.id);
            });

            // Preenche o painel de detalhes
            document.getElementById('customer-photo').src = customer.photoUrl || 'https://via.placeholder.com/80';
            document.getElementById('customer-fullname').textContent = `${customer.firstName} ${customer.lastName}`;

            renderInfoFields(customer, false);
            renderServicesList(customer.services);

            switchTab('info');
            serviceInvoicesSection.classList.add('hidden');
            currentServiceId = null;
            emptyState.classList.add('hidden');
            customerContent.classList.remove('hidden');

        } catch (error) {
            console.error("Falha ao buscar detalhes do cliente:", error);
        }
    };

    const switchTab = (tabId) => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        document.getElementById(`tab-content-${tabId}`).classList.add('active');
        document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');
    };


    // =================================================================================
    // LÓGICA DE EDIÇÃO E EXCLUSÃO (com chamadas de API)
    // =================================================================================

    const enterEditMode = async () => {
        const customer = await apiRequest(`/api/customers/${currentCustomerId}/`);
        if (!customer) return;

        isEditMode = true;
        renderInfoFields(customer, true);
        editCustomerBtn.classList.add('hidden');
        deleteCustomerBtn.classList.add('hidden');
        saveCustomerBtn.classList.remove('hidden');
        cancelEditBtn.classList.remove('hidden');
    };

    const exitEditMode = async (shouldSaveChanges, customerData = null) => {
        if (!shouldSaveChanges) {
            const customer = customerData || await apiRequest(`/api/customers/${currentCustomerId}/`);
            renderInfoFields(customer, false);
        }

        isEditMode = false;
        editCustomerBtn.classList.remove('hidden');
        deleteCustomerBtn.classList.remove('hidden');
        saveCustomerBtn.classList.add('hidden');
        cancelEditBtn.classList.add('hidden');
    };

    const handleSaveChanges = async () => {
        const customerData = {
            first_name: document.getElementById('edit-firstName').value,
            last_name: document.getElementById('edit-lastName').value,
            email: document.getElementById('edit-email').value,
            phone: document.getElementById('edit-phone').value,
            address: document.getElementById('edit-address').value,
            company: document.getElementById('edit-company').value,
            position: document.getElementById('edit-position').value,
        };
        // Validação aqui se necessário...

        try {
            await apiRequest(`/api/customers/${currentCustomerId}/`, 'PUT', customerData);
            await exitEditMode(true);
            await displayCustomerDetails(currentCustomerId); // Recarrega os dados atualizados
            await loadAndStoreCustomers(); // Atualiza o cache para a busca
        } catch (error) {
            console.error("Falha ao atualizar cliente:", error);
        }
    };

    const handleDeleteRequest = async () => {
        const customer = await apiRequest(`/api/customers/${currentCustomerId}/`);
        if (!customer) return;

        deleteModalText.textContent = `Você tem certeza que deseja excluir o cliente ${customer.firstName} ${customer.lastName}? Essa ação não pode ser desfeita.`;
        openModal(deleteConfirmationModal);
    };

    const handleDeleteConfirm = async () => {
        if (!currentCustomerId) return;
        try {
            await apiRequest(`/api/customers/${currentCustomerId}/`, 'DELETE');

            // Remove da UI e do cache
            customerCache = customerCache.filter(c => c.id !== currentCustomerId);
            renderCustomerList(customerCache);

            closeModal(deleteConfirmationModal);
            customerContent.classList.add('hidden');
            emptyState.classList.remove('hidden');
            currentCustomerId = null;
        } catch (error) {
            console.error("Falha ao excluir cliente:", error);
        }
    };


    // =================================================================================
    // MANIPULADORES DE EVENTOS (EVENT HANDLERS)
    // =================================================================================

    const handleSearchInput = (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = customerCache.filter(c =>
            c.fullName.toLowerCase().includes(searchTerm) ||
            (c.company && c.company.toLowerCase().includes(searchTerm))
        );
        renderCustomerList(filtered);
    };

    const handleCustomerSelect = (e) => {
        const row = e.target.closest('tr');
        if (row && row.dataset.customerId) {
            displayCustomerDetails(parseInt(row.dataset.customerId, 10));
        }
    };

    const handleServiceSelect = async (e) => {
        if (e.target.matches('.status-select')) return; // Ignora cliques no dropdown

        const row = e.target.closest('tr');
        if (row && row.dataset.serviceId) {
            const customer = await apiRequest(`/api/customers/${currentCustomerId}/`);
            const service = customer.services.find(s => s.id == row.dataset.serviceId);
            if (service) renderInvoicesForService(service);
        }
    };

    const handleStatusChange = async (e) => {
        if (!e.target.matches('.status-select')) return;

        const select = e.target;
        const newStatus = select.value;
        const entity = select.dataset.entity;
        const id = select.dataset.id;

        const url = entity === 'service' ? `/api/services/${id}/` : `/api/invoices/${id}/`;

        try {
            await apiRequest(url, 'PUT', { status: newStatus });
            select.className = `status-select status-${newStatus.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`;
            if (entity === 'service' && id == currentServiceId) {
                await displayCustomerDetails(currentCustomerId);
            }
        } catch (error) {
            console.error(`Falha ao atualizar status de ${entity}:`, error);
        }
    };

    const handleCustomerFormSubmit = async (e) => {
        e.preventDefault();
        const formData = new FormData(customerForm);
        const customerData = {
            firstName: formData.get('firstName'), lastName: formData.get('lastName'),
            email: formData.get('email'), phone: formData.get('phone'),
            address: formData.get('address'), company: formData.get('company'),
            position: formData.get('position'), photoUrl: formData.get('photoUrl'),
        };
        // Validação...

        try {
            const newCustomer = await apiRequest('/api/customers/', 'POST', customerData);
            customerCache.push(newCustomer);
            renderCustomerList(customerCache);
            await displayCustomerDetails(newCustomer.id);
            closeModal(customerModal);
            customerForm.reset();
        } catch (error) {
            console.error("Falha ao criar cliente:", error);
        }
    };

    const handleServiceFormSubmit = async (e) => {
        e.preventDefault();
        if (!currentCustomerId) return;

        const serviceData = {
            name: document.getElementById('serviceName').value,
            description: document.getElementById('serviceDescription').value,
            paymentType: paymentTypeSelect.value,
            firstPaymentDate: firstPaymentDateInput.value,
            totalValue: parseFloat(document.getElementById('serviceValue').value),
            entryValue: parseFloat(document.getElementById('serviceEntryValue').value) || 0,
            installments: parseInt(document.getElementById('serviceInstallments').value, 10),
            interest: parseFloat(document.getElementById('serviceInterest').value) || 0,
        };
        if (!serviceData.firstPaymentDate) return showAlert('Por favor, informe a data do primeiro pagamento.');

        try {
            await apiRequest(`/api/customers/${currentCustomerId}/services/`, 'POST', serviceData);
            await displayCustomerDetails(currentCustomerId);
            closeModal(serviceModal);
            serviceForm.reset();
        } catch (error) {
            console.error("Falha ao adicionar serviço:", error);
        }
    };

    const handlePaymentTypeChange = (e) => {
        const isParcelado = e.target.value === 'parcelado';
        entryValueGroup.classList.toggle('hidden', !isParcelado);
        parcelamentoGroup.classList.toggle('hidden', !isParcelado);
    };

    // =================================================================================
    // INICIALIZAÇÃO E EVENT LISTENERS
    // =================================================================================
    const setupEventListeners = () => {
        searchInput.addEventListener('input', handleSearchInput);
        customerListTbody.addEventListener('click', handleCustomerSelect);
        detailTabs.addEventListener('click', (e) => e.target.matches('.tab-link') && switchTab(e.target.dataset.tab));
        servicesTbody.addEventListener('click', handleServiceSelect);
        servicesTbody.addEventListener('change', handleStatusChange);
        invoicesTbody.addEventListener('change', handleStatusChange);

        editCustomerBtn.addEventListener('click', enterEditMode);
        saveCustomerBtn.addEventListener('click', handleSaveChanges);
        cancelEditBtn.addEventListener('click', () => exitEditMode(false));

        deleteCustomerBtn.addEventListener('click', handleDeleteRequest);
        deleteConfirmBtn.addEventListener('click', handleDeleteConfirm);

        addNewCustomerBtn.addEventListener('click', () => {
            customerForm.reset();
            openModal(customerModal);
        });
        addNewServiceBtn.addEventListener('click', () => {
            if (currentCustomerId) {
                serviceForm.reset();
                openModal(serviceModal);
            } else showAlert('Selecione um cliente primeiro.');
        });

        customerForm.addEventListener('submit', handleCustomerFormSubmit);
        serviceForm.addEventListener('submit', handleServiceFormSubmit);
        paymentTypeSelect.addEventListener('change', handlePaymentTypeChange);

        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.matches('.close-button') || e.target.matches('.cancel-btn') || e.target.matches('.ok-btn')) {
                    if (isEditMode && modal.id !== 'delete-confirmation-modal' && modal.id !== 'alert-modal') {
                        exitEditMode(false);
                    }
                    closeModal(modal);
                }
            });
        });
    };

    const loadAndStoreCustomers = async () => {
        try {
            // Busca os dados simplificados dos clientes para a lista e a busca
            customerCache = await apiRequest('/api/customers/');
            // A lista inicial já foi renderizada pelo Django, mas isso garante que o cache está populado.
            // Para garantir consistência, podemos re-renderizar.
            renderCustomerList(customerCache);
        } catch (error) {
            console.error("Falha ao carregar lista inicial de clientes:", error);
        }
    };

    const init = () => {
        setupEventListeners();
        loadAndStoreCustomers();
    };

    init();
});