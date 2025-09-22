// cliente.js
import { apiRequest, openModal, closeModal } from './requestApi.js';
import { renderServicesList } from './servico.js';
import { renderContractsList, openNewContractModal } from './contrato.js';

let currentCustomerId = null;       
let customerCache = [];
let isEditMode = false;

const DOMElements = {};

const initializeCustomerElements = (elements) => {
    Object.assign(DOMElements, elements);
};

const switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-content-${tabId}`).classList.add('active');
    document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');
};

const renderCustomerList = (customers) => {
    DOMElements.customerListTbody.innerHTML = '';

    if (!customers || customers.length === 0) {
        DOMElements.customerListTbody.innerHTML = '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>';
        return;
    }

    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.dataset.customerId = customer.id;
        row.className = customer.id === currentCustomerId ? 'selected' : '';

        row.innerHTML = `
            <td>  
                <div class="profile-cell">
                <img src="${customer.image_url}" alt="Foto_${customer.fullName}">
                </div>
            </td>
            <td>
                <span>${customer.fullName}</span>
            </td>
            <td> 
                ${customer.cpf || 'Não Cadastrada'}
            </td>
            <td>${customer.company || 'Não Cadastrada'}</td>
        `;

        DOMElements.customerListTbody.appendChild(row);
    });
};

const renderInfoFields = (customer, inEditMode = false) => {
    const fields = [
        { label: 'Nome', key: 'firstName', value: customer.firstName }, { label: 'Sobrenome', key: 'lastName', value: customer.lastName },
        { label: 'E-mail', key: 'email', value: customer.email, type: 'email' }, { label: 'Telefone', key: 'phone', value: customer.phone, type: 'tel' },
        { label: 'Endereço', key: 'address', value: customer.address }, { label: 'Empresa', key: 'company', value: customer.company },
        { label: 'Cargo', key: 'position', value: customer.position },
    ];
    DOMElements.tabContentInfo.innerHTML = '<div class="info-grid"></div>';
    const infoGrid = DOMElements.tabContentInfo.querySelector('.info-grid');
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

const exitEditMode = async (shouldSaveChanges, customerData = null) => {
    if (!shouldSaveChanges) {
        const customer = customerData || await apiRequest(`/api/customers/${currentCustomerId}/`);
        renderInfoFields(customer, false);
    }

    isEditMode = false;
    DOMElements.editCustomerBtn.classList.remove('hidden');
    DOMElements.deleteCustomerBtn.classList.remove('hidden');
    DOMElements.saveCustomerBtn.classList.add('hidden');
    DOMElements.cancelEditBtn.classList.add('hidden');
};

const displayCustomerDetails = async (customerId) => {
    try {
        const containerMainCustomer = document.getElementById('customer-detail-view');
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
        DOMElements.newContractBtn.onclick = () => {
            openNewContractModal(customer);
        };

        switchTab('info');
        DOMElements.serviceInvoicesSection.classList.add('hidden');
        DOMElements.currentServiceId = null;
        DOMElements.emptyState.classList.add('hidden');
        DOMElements.customerContent.classList.remove('hidden');

        setTimeout(() => {
            containerMainCustomer.classList.add('fade-in-end');
        }, 300);

    } catch (error) {
        showToast('error', "Falha ao buscar detalhes do cliente:" + error)
    }
};

const loadAndStoreCustomers = async () => {
    try {
        customerCache = await apiRequest('/api/customers/');
        renderCustomerList(customerCache);
    } catch (error) {
        showToast("error", "Falha ao carregar lista inicial de clientes:" + error);
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

const enterEditMode = async () => {
    const customer = await apiRequest(`/api/customers/${currentCustomerId}/`);
    if (!customer) return;

    isEditMode = true;
    renderInfoFields(customer, true);
    DOMElements.editCustomerBtn.classList.add('hidden');
    DOMElements.deleteCustomerBtn.classList.add('hidden');
    DOMElements.saveCustomerBtn.classList.remove('hidden');
    DOMElements.cancelEditBtn.classList.remove('hidden');
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

    DOMElements.deleteModalText.textContent = `Você tem certeza que deseja excluir o cliente ${customer.firstName} ${customer.lastName}? Essa ação não pode ser desfeita.`;
    openModal(DOMElements.deleteConfirmationModal);
};

const handleDeleteConfirm = async () => {
    if (!currentCustomerId) return;
    try {
        await apiRequest(`/api/customers/${currentCustomerId}/`, 'DELETE');

        customerCache = customerCache.filter(c => c.id !== currentCustomerId);
        renderCustomerList(customerCache);

        closeModal(DOMElements.deleteConfirmationModal);
        DOMElements.customerContent.classList.add('hidden');
        DOMElements.emptyState.classList.remove('hidden');
        currentCustomerId = null;
    } catch (error) {
        showToast('error', "Falha ao excluir cliente:" + error);
    }
};

function cleanError(inputElement) {
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        formGroup.classList.remove('has-error');
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
    }
}

function displayError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('has-error');

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('error-message');
        errorMessage.textContent = message;

        inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);

        const firstErrorInput = document.querySelector('.form-group.has-error input');

        if (firstErrorInput === inputElement) {
            inputElement.focus();
        }
    }
}

function validateCustomerForm(formData, formElement) {
    let isValid = true;
    
    const validationRules = { 
        'firstName': { required: true, requiredMessage: "O Nome é obrigatório." },
        'email': { required: true, requiredMessage: "O E-mail é obrigatório.", regex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, regexMessage: "Formato de E-mail inválido." },
        'cpf': { required: true, requiredMessage: "O CPF é obrigatório.", regex: /^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, regexMessage: "CPF inválido." },
        'address': { required: true, requiredMessage: "O Endereço é obrigatório." }
    };
    
    const inputsWithErrors = []; 

    for (const name in validationRules) {
        const rules = validationRules[name];
        const value = formData.get(name);
        const inputElement = formElement.querySelector(`#${name}`);
        
        if (!inputElement) continue;

        if (rules.required && (!value || !value.trim())) {
            inputsWithErrors.push({ element: inputElement, message: rules.requiredMessage });
            isValid = false;
        } 

        else if (value.trim() && rules.regex) {
            const finalValue = (name === 'cpf') ? value.replace(/[^\d]/g, '') : value;
            if (!rules.regex.test(finalValue)) {
                inputsWithErrors.push({ element: inputElement, message: rules.regexMessage });
                isValid = false;
            }
        }
    }
    
    return { isValid, inputsWithErrors };
}

function checkFormValidityCliente() {
    DOMElements.customerForm.querySelectorAll('.form-group input').forEach(input => cleanError(input));

    const formData = new FormData(DOMElements.customerForm);
    const { isValid, inputsWithErrors } = validateCustomerForm(formData, DOMElements.customerForm);
    
    document.getElementById('save-customer-btn-form').disabled = !isValid;

    if (!isValid) {
        let firstErrorInput = null;
        
        inputsWithErrors.forEach(error => {
            displayError(error.element, error.message);
            if (!firstErrorInput) {
                firstErrorInput = error.element;
            }
        });
    }
}

const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();
    const saveButton = document.getElementById('save-customer-btn');
    saveButton.disabled = true;

    const formData = new FormData(DOMElements.customerForm);
    const validationResult = validateCustomerForm(formData, DOMElements.customerForm);
    if (!validationResult.isValid) {
        validationResult.inputsWithErrors.forEach(error => displayError(error.element, error.message));
        saveButton.disabled = false;
        return;
    }

    try {
        const newCustomer = await apiRequest('/api/customers/', 'POST', formData);

        customerCache.push(newCustomer);
        renderCustomerList(customerCache);
        await displayCustomerDetails(newCustomer.id);
        closeModal(DOMElements.customerModal);
        DOMElements.customerForm.reset();
        resetDragDropComponent(); // Assumindo que essa função existe globalmente
    } catch (error) {
        showToast('error', "Falha ao criar cliente:" + error);
    } finally {
        saveButton.disabled = false;
    }
};

export {
    initializeCustomerElements,
    displayCustomerDetails,
    loadAndStoreCustomers,
    handleSearchInput,
    handleCustomerSelect,
    enterEditMode,
    handleSaveChanges,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleCustomerFormSubmit,
    exitEditMode,
    switchTab,
    checkFormValidityCliente,
    currentCustomerId,
    isEditMode,
};