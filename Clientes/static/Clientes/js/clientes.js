// cliente.js
import { apiRequest, openModal, closeModal } from './requestApi.js';
import { renderServicesList } from './servico.js';
import { renderContractsList, openNewContractModal } from './contrato.js';

let currentCustomerId = null;
let isEditMode = false;

const DOMElements = {};

const initializeCustomerElements = (elements) => {
    Object.assign(DOMElements, elements);
};


const disabledButton = (elementButton, disblad) => {
    elementButton.disabled = disblad
}

const switchTab = (tabId) => {
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.querySelectorAll('.tab-link').forEach(l => l.classList.remove('active'));
    document.getElementById(`tab-content-${tabId}`).classList.add('active');
    document.querySelector(`.tab-link[data-tab="${tabId}"]`).classList.add('active');
};

const renderCustomerList = async () => {
    DOMElements.customerListTbody.innerHTML = '';
    try {
        const { status, result } = await apiRequest('/api/clientes/');

        if (!status == 200) {
            throw new Error(result.error);
        }


        if (result.clientes.length === 0) {
            DOMElements.customerListTbody.innerHTML = '<tr><td colspan="4">Nenhum cliente encontrado.</td></tr>';
            return;
        }

        result.clientes.forEach(customer => {
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
                    ${customer.cpf || 'Indefinido'}
                </td>
                <td>${customer.company || 'Indefinido'}</td>
            `;

            DOMElements.customerListTbody.appendChild(row);
        });

    } catch (error) {
        showToast('error', "Falha ao carregar lista de clientes:" + error);
    }
};

const renderInfoFields = (customer, inEditMode = false) => {

    const fields = [
        { label: 'Nome', key: 'firstName', value: customer.firstName },
        { label: 'Sobrenome', key: 'lastName', value: customer.lastName },
        { label: 'Cpf', key: 'cpf', value: customer.cpf },
        { label: 'E-mail', key: 'email', value: customer.email, type: 'email' },
        { label: 'Telefone', key: 'phone', value: customer.phone, type: 'tel' },
        { label: 'Endereço', key: 'address', value: customer.address },
        { label: 'Empresa', key: 'company', value: customer.company },
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

const exitEditMode = async (shouldSaveChanges) => {
    try {
        if (!shouldSaveChanges) {
            const { status, result } = await apiRequest(`api/cliente/${currentCustomerId}/`);
            if (!status == 200) {
                throw new Error(result.error);
            }
            renderInfoFields(result, false);
        }


        isEditMode = false;
        DOMElements.editCustomerBtn.classList.remove('hidden');
        DOMElements.deleteCustomerBtn.classList.remove('hidden');
        DOMElements.saveCustomerBtn.classList.add('hidden');
        DOMElements.cancelEditBtn.classList.add('hidden');
    } catch (e) {
        showToast('error', "Falha ao salvar alterações:" + e.message)
    }
};

const displayCustomerDetails = async (customerId) => {
    try {
        const containerMainCustomer = document.getElementById('customer-detail-view');
        const { status: status_customer, result: resultCustomer } = await apiRequest(`/api/cliente/${customerId}/`);

        if (status_customer != 200) return;

        const { status: status_contracts, result: resultContracts } = await apiRequest(`/api/customers/${customerId}/contracts/`);

        if (status_contracts != 200) return;

        if (isEditMode) await exitEditMode(false);
        currentCustomerId = resultCustomer.id;

        containerMainCustomer.classList.add('fade-in-start');
        if (containerMainCustomer.classList.contains('fade-in-end')) {
            containerMainCustomer.classList.remove('fade-in-end');
        }

        document.querySelectorAll('#customer-list-tbody tr').forEach(row => {
            row.classList.toggle('selected', row.dataset.customerId == resultCustomer.id);
        });

        document.getElementById('customer-photo').src = resultCustomer.photoUrl;
        document.getElementById('customer-fullname').textContent = `${resultCustomer.firstName} ${resultCustomer.lastName}`;

        renderInfoFields(resultCustomer, false);
        renderServicesList(resultCustomer.services);
        renderContractsList(resultContracts);
        DOMElements.newContractBtn.onclick = () => {
            openNewContractModal(resultCustomer);
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
    try {
        const { status, result } = await apiRequest(`api/cliente/${currentCustomerId}/`);

        if (!status == 200) {
            throw new Error(result.error);
        }

        isEditMode = true;
        renderInfoFields(result, true);
        DOMElements.editCustomerBtn.classList.add('hidden');
        DOMElements.deleteCustomerBtn.classList.add('hidden');
        DOMElements.saveCustomerBtn.classList.remove('hidden');
        DOMElements.cancelEditBtn.classList.remove('hidden');



    } catch (e) {
        showToast('error', "erro ao tentar editar informações do cliente:" + e.message);
    }
};

const handleSaveChanges = async () => {
    disabledButton(DOMElements.saveCustomerBtn, true);
    const customerData = {
        id_cliente: currentCustomerId,
        nome: document.getElementById('edit-firstName').value,
        sobrenome: document.getElementById('edit-lastName').value,
        cpf: document.getElementById('edit-cpf').value,
        email: document.getElementById('edit-email').value,
        telefone: document.getElementById('edit-phone').value,
        endereco: document.getElementById('edit-address').value,
        empresa: document.getElementById('edit-company').value,
        position: document.getElementById('edit-position').value,
    };

    try {
        const { status, result } = await apiRequest(`api/cliente/${currentCustomerId}/`, 'PUT', customerData);
        if (!status == 200) {
            throw new Error(result.error);
        }

        await exitEditMode(true);
        await displayCustomerDetails(currentCustomerId);
        disabledButton(DOMElements.saveCustomerBtn, false);
    } catch (e) {
        disabledButton(DOMElements.saveCustomerBtn, false);
        showToast('error', "Falha ao atualizar cliente:" + e.message);
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
        await apiRequest(`api/customers/${currentCustomerId}/`, 'DELETE');

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



const handleCustomerFormSubmit = async (e) => {
    e.preventDefault();
    const nome = document.getElementById('firstName');
    const sobrenome = document.getElementById('lastName');
    const email = document.getElementById('email');
    const comboTipoPessoaSelect = document.getElementById('combotipoPessoa');
    const cpfCnpjInput = document.getElementById('cpfcnpj');
    const telefoneinput = document.getElementById('phone');
    const enderecoinput = document.getElementById('address');
    const empresa = document.getElementById('company');
    const positionInput = document.getElementById('position');
    const photoUploadInput = document.getElementById('photoUpload');

    const formData = {
        nome: nome.value,
        sobrenome: sobrenome.value,
        email: email.value,
        tipoPessoa: comboTipoPessoaSelect.value,
        cpfcnpj: cpfCnpjInput.value,
        telefone: telefoneinput.value,
        endereco: enderecoinput.value,
        empresa: empresa.value,
        position: positionInput.value,
        photo_url: photoUploadInput.files.length > 0 ? photoUploadInput.files[0] : ''
    };

    try {
        const { status, result } = await apiRequest('api/clientes/', 'POST', formData);

        if (!status == 200) {
            throw new Error(result.error);
        }

        renderCustomerList();
        await displayCustomerDetails(newCustomer.id);
        closeModal(DOMElements.customerModal);
        DOMElements.customerForm.reset();
        resetDragDropComponent();

    } catch (error) {
        showToast('error', "Falha ao criar cliente:" + error);
    }
}


export {
    initializeCustomerElements,
    displayCustomerDetails,
    renderCustomerList,
    handleSearchInput,
    handleCustomerSelect,
    enterEditMode,
    handleSaveChanges,
    handleDeleteRequest,
    handleDeleteConfirm,
    handleCustomerFormSubmit,
    exitEditMode,
    switchTab,
    currentCustomerId,
    isEditMode,
};