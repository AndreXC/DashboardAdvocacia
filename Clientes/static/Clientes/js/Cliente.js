document.addEventListener('DOMContentLoaded', () => {

    let currentCustomerId = null;
    let currentServiceId = null;
    let isEditMode = false;
    let customerCache = [];


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



    const newContractFormCliente = document.getElementById('create-contract-form');
    const newContractBtn = document.getElementById('add-new-contract-btn');
    const newContractModal = document.getElementById('create-contract-modal');
    const newContractTemplateSelect = document.getElementById('id_template_select');
    const newContractServiceSelect = document.getElementById('id_service_select');
    const closeNewContractModalBtn = document.getElementById('cancel-new-contract-btn');
    const cancelNewContractBtn = document.querySelector('.cancel-btn');
    const SelectClientEstrutura = document.getElementById('id_client_select');
    const TituloAddNewContrato = document.getElementById('TituloAddContractCliente');

    const ButtonSUbmitModalAddNewContract = document.getElementById('ButtonSubmitModalAddNewContract');



    function updateSubmitButtonState() {
        const hasService = newContractServiceSelect.options.length > 1;
        const hasTemplate = newContractTemplateSelect.options.length > 1;

        ButtonSUbmitModalAddNewContract.disabled = !(hasService && hasTemplate);
    }


    function closeNewContractModal() {
        newContractModal.style.display = 'none';
    }

    function openNewContractModal(costumer) {
        newContractModal.style.display = 'flex';
        if (costumer) {
            TituloAddNewContrato.textContent = `Gerar Novo Contrato para ${costumer.firstName} ${costumer.lastName}`;
            SelectClientEstrutura.innerHTML = `<option value="${costumer.id}">${costumer.firstName} ${costumer.lastName}</option>`;
            SelectClientEstrutura.value = costumer.id;

            loadNewContractServices(costumer.id);
            LoadModelContracts();
        }
    }



    closeNewContractModalBtn.addEventListener('click', closeNewContractModal);
    cancelNewContractBtn.addEventListener('click', closeNewContractModal);

    window.onclick = function (event) {
        if (event.target == newContractModal) {
            closeNewContractModal();
        }
    };



    function LoadModelContracts() {
        newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
        newContractTemplateSelect.disabled = true;

        const url = `Contract/api/get_model_templates/`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta da rede: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Selecione um modelo</option>';

                if (data.templates && data.templates.length > 0) {
                    data.templates.forEach(template => {
                        newContractTemplateSelect.innerHTML += `<option value="${template.id}">${template.title}</option>`;
                    });
                    newContractTemplateSelect.disabled = false;
                } else {
                    newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Nenhum modelo encontrado</option>';
                }

                updateSubmitButtonState();
            })
            .catch(error => {
                showToast('error', 'Erro ao buscar modelos:' + error);
                newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar modelos</option>';
                updateSubmitButtonState();
            });
    }

    function loadNewContractServices(clientId) {
        newContractServiceSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
        newContractServiceSelect.disabled = true;

        const url = `/ContractsClientes/api/services-by-client/${clientId}/`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Erro na resposta da rede: ' + response.statusText);
                }
                return response.json();
            })
            .then(data => {
                newContractServiceSelect.innerHTML = '<option value="" disabled selected>Selecione um Protocolo de Serviço</option>';

                if (data.services && data.services.length > 0) {
                    data.services.forEach(service => {
                        newContractServiceSelect.innerHTML += `<option value="${service.id}">${service.text}</option>`;
                    });
                    newContractServiceSelect.disabled = false;
                } else {
                    newContractServiceSelect.innerHTML = '<option value="" disabled selected>Nenhum serviço ativo encontrado</option>';
                }

                updateSubmitButtonState();
            })
            .catch(error => {
                showToast('error', 'Erro ao buscar serviços:' + error);
                newContractServiceSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar serviços</option>';
                updateSubmitButtonState();
            });
    }

    async function submitNewContractForm(event) {
        event.preventDefault();
        const clientId = SelectClientEstrutura.value;
        const serviceId = newContractServiceSelect.value;
        const templateId = newContractTemplateSelect.value;

        const formData = {
            client: clientId,
            service: serviceId,
            template: templateId,
        };


        const url = '/ContractsClientes/create/';
        const csrfToken = getCsrfToken();
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                showToast('success', 'Contrato Criado com sucesso!');
                closeNewContractModal();
            } else {
                const errorDiv = document.getElementById('form-errors');
                errorDiv.innerHTML = '';
                for (const field in data.errors) {
                    data.errors[field].forEach(error => {
                        const p = document.createElement('p');
                        p.textContent = `${field}: ${error.message}`;
                        errorDiv.appendChild(p);
                    });
                }
            }
        } catch (error) {
            showToast('error', 'Não foi possivel Gerar o contrato. Tente novamente mais tarde.');
        }
    }

    newContractFormCliente.addEventListener('submit', submitNewContractForm);


    const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
    const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });
    const getCsrfToken = () => document.querySelector('[name=csrfmiddlewaretoken]').value;



    const openModal = (modal) => modal.classList.add('show');
    const closeModal = (modal) => modal.classList.remove('show');



    const apiRequest = async (url, method = 'GET', body = null) => {
        const options = {
            method,
            headers: {
                'X-CSRFToken': getCsrfToken(),
            },
        };

        if (body) {
            if (body instanceof FormData) {
                options.body = body;
            } else {
                options.headers['Content-Type'] = 'application/json';
                options.body = JSON.stringify(body);
            }
        }

        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ error: `Erro HTTP! Status: ${response.status}` }));
                throw new Error(errorData.error || `Erro desconhecido`);
            }
            if (response.status === 204) {
                return null;
            }
            return response.json();
        } catch (error) {
            showToast('error:', error.message);
            throw error;
        }
    };

    const renderCustomerList = (customers) => {
        customerListTbody.innerHTML = '';

        if (!customers || customers.length === 0) {
            customerListTbody.innerHTML = '<tr><td colspan="2">Nenhum cliente encontrado.</td></tr>';
            return;
        }

        customers.forEach(customer => {
            const row = document.createElement('tr');
            row.dataset.customerId = customer.id;
            row.className = customer.id === currentCustomerId ? 'selected' : '';


            row.innerHTML = `
            <td>
                <div class="profile-cell">
                    <img src="${customer.image_url}" alt="Foto de ${customer.fullName}">
                    <span>${customer.fullName}</span>
                </div>
            </td>
            <td>${customer.company || '-'}</td>
        `;

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
            row.dataset.serviceId = service.id;
            row.className = service.id === currentServiceId ? 'selected' : '';
            const statusClass = service.status.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            row.innerHTML = `
                <td class="service-name-cell">${service.nomeServico}</td>
                <td>${service.protocolo || '-'}</td> 
                <td>${service.areaDireito || '-'}</td>
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
            containerMainCustomer = document.getElementById('customer-detail-view');
            const customer = await apiRequest(`/api/customers/${customerId}/`);
            if (!customer) return;



            if (isEditMode) await exitEditMode(false, customer);
            currentCustomerId = customer.id;


            containerMainCustomer.classList.add('fade-in-start');

            if (containerMainCustomer.classList.contains('fade-in-end')) {
                containerMainCustomer.classList.remove('fade-in-end');
            }

            const contracts = await apiRequest(`/api/customers/${customerId}/contracts/`);


            document.querySelectorAll('#customer-list-tbody tr').forEach(row => {
                row.classList.toggle('selected', row.dataset.customerId == customer.id);
            });

            document.getElementById('customer-photo').src = customer.photoUrl || 'https://cdn-icons-png.flaticon.com/512/149/149071.png';
            document.getElementById('customer-fullname').textContent = `${customer.firstName} ${customer.lastName}`;


            renderInfoFields(customer, false);
            renderServicesList(customer.services);
            renderContractsList(contracts);
            newContractBtn.addEventListener('click', () => {
                openNewContractModal(customer);
            });

            switchTab('info');
            serviceInvoicesSection.classList.add('hidden');
            currentServiceId = null;
            emptyState.classList.add('hidden');
            customerContent.classList.remove('hidden');

            setTimeout(() => {
                containerMainCustomer.classList.add('fade-in-end');
            }, 300);

        } catch (error) {
            showToast('error', "Falha ao buscar detalhes do cliente:" + error)

        }
    };

    const switchTab = (tabId) => {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
        document.getElementById(`tab-content-${tabId}`).classList.add('active');
        document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');
    };



    const renderContractsList = (contracts) => {
        const contractsTbody = document.getElementById('contracts-tbody');
        contractsTbody.innerHTML = '';

        if (contracts && contracts.length > 0) {
            contracts.forEach(contract => {
                const row = document.createElement('tr');
                row.dataset.contractId = contract.id;

                let actionsHtml = '';
                if (contract.statusCode === 'PENDING' && contract.signingUrl) {
                    actionsHtml = `<a href="${contract.signingUrl}" class="button-primary" target="_blank">Assinar</a>`;
                } else if (contract.statusCode === 'SIGNED' && contract.pdfUrl) {
                    actionsHtml = `<a href="${contract.pdfUrl}" class="button-secondary" target="_blank">Ver PDF</a>`;
                } else {
                    actionsHtml = '<span>-</span>';
                }

                row.innerHTML = `
                    <td>${contract.template}</td>
                    <td>${contract.status}</td>
                    <td>${contract.createdAt}</td>
                    <td>${actionsHtml}</td>
                `;
                contractsTbody.appendChild(row);
            });
        } else {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4" style="text-align: center;">Nenhum contrato encontrado.</td>`;
            contractsTbody.appendChild(row);
        }
    };


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

        try {
            await apiRequest(`/api/customers/${currentCustomerId}/`, 'PUT', customerData);
            await exitEditMode(true);
            await displayCustomerDetails(currentCustomerId);
            await loadAndStoreCustomers();
        } catch (error) {
            showToast('error', "Falha ao atualizar cliente:" + error);
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

            customerCache = customerCache.filter(c => c.id !== currentCustomerId);
            renderCustomerList(customerCache);

            closeModal(deleteConfirmationModal);
            customerContent.classList.add('hidden');
            emptyState.classList.remove('hidden');
            currentCustomerId = null;
        } catch (error) {
            showToast('error', "Falha ao excluir cliente:" + error);
        }
    };


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
        document.getElementById('customer-detail-view').classList.add('fade-in-start');


        if (row && row.dataset.customerId) {
            displayCustomerDetails(parseInt(row.dataset.customerId, 10));
        }

    };

    const handleServiceSelect = async (e) => {
        if (e.target.matches('.status-select')) return;
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
            showToast('error', `Falha ao atualizar status de ${entity}:` + error);
        }
    };



    const handleCustomerFormSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData(customerForm);

        if (!formData.get('firstName') || !formData.get('email')) {
            showToast('warning', 'Nome e E-mail são obrigatórios.');
            return;
        }

        try {
            const newCustomer = await apiRequest('/api/customers/', 'POST', formData);

            customerCache.push(newCustomer);
            renderCustomerList(customerCache);
            await displayCustomerDetails(newCustomer.id);
            closeModal(customerModal);
            customerForm.reset();
            resetDragDropComponent();

        } catch (error) {
            showToast('error', "Falha ao criar cliente:" + error);
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
            protocolo: document.getElementById('ServiceProtocolo').value,
            area_direito: parseInt(document.getElementById('AreaDireitoAdmin').value, 10) || null,
            totalValue: parseFloat(document.getElementById('serviceValue').value),
            entryValue: parseFloat(document.getElementById('serviceEntryValue').value) || 0,
            installments: parseInt(document.getElementById('serviceInstallments').value, 10),
            interest: parseFloat(document.getElementById('serviceInterest').value) || 0,
        };
        if (!serviceData.firstPaymentDate) {
            return showToast('warning', 'Por favor, informe a data do 1º pagamento do serviço.');
        }

        try {
            await apiRequest(`/api/customers/${currentCustomerId}/services/`, 'POST', serviceData);
            await displayCustomerDetails(currentCustomerId);
            closeModal(serviceModal);
            serviceForm.reset();
        } catch (error) {
            showToast("error", "Falha ao adicionar serviço:", error);
        }
    };

    const handlePaymentTypeChange = (e) => {
        const isParcelado = e.target.value === 'parcelado';
        entryValueGroup.classList.toggle('hidden', !isParcelado);
        parcelamentoGroup.classList.toggle('hidden', !isParcelado);
    };

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

            console.log('teste')
            customerForm.reset();
            openModal(customerModal);
        });
        addNewServiceBtn.addEventListener('click', () => {
            if (currentCustomerId) {
                serviceForm.reset();
                openModal(serviceModal);
            } else showToast('warning', 'Selecione um cliente primeiro.');
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
            customerCache = await apiRequest('/api/customers/');
            renderCustomerList(customerCache);
        } catch (error) {
            showToast("error", "Falha ao carregar lista inicial de clientes:" + error);
        }
    };

    const init = () => {
        setupEventListeners();
        loadAndStoreCustomers();
    };

    init();
});