// contrato.js
import { apiRequest } from './requestApi.js';

const DOMElements = {};

const initializeContractElements = (elements) => {
    Object.assign(DOMElements, elements);
};

const updateSubmitButtonState = () => {
    const hasService = DOMElements.newContractServiceSelect.options.length > 1;
    const hasTemplate = DOMElements.newContractTemplateSelect.options.length > 1;

    DOMElements.ButtonSUbmitModalAddNewContract.disabled = !(hasService && hasTemplate);
};


const closeNewContractModal = () => {
    DOMElements.newContractModal.style.display = 'none';
};

const LoadModelContracts = async () => {
    DOMElements.newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
    DOMElements.newContractTemplateSelect.disabled = true;

    const url = `Contract/api/get_model_templates/`;

    try {
        const data = await apiRequest(url);
        
        DOMElements.newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Selecione um modelo</option>';

        if (data.templates && data.templates.length > 0) {
            data.templates.forEach(template => {
                DOMElements.newContractTemplateSelect.innerHTML += `<option value="${template.id}">${template.title}</option>`;
            });
            DOMElements.newContractTemplateSelect.disabled = false;
        } else {
            DOMElements.newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Nenhum modelo encontrado</option>';
        }

        updateSubmitButtonState();
    } catch (error) {
        // A função apiRequest já chama showToast, mas ajustamos a mensagem.
        showToast('error', 'Erro ao buscar modelos.');
        DOMElements.newContractTemplateSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar modelos</option>';
        updateSubmitButtonState();
    }
};

const loadNewContractServices = async (clientId) => {
    DOMElements.newContractServiceSelect.innerHTML = '<option value="" disabled selected>Carregando...</option>';
    DOMElements.newContractServiceSelect.disabled = true;

    const url = `/ContractsClientes/api/services-by-client/${clientId}/`;

    try {
        const data = await apiRequest(url);

        DOMElements.newContractServiceSelect.innerHTML = '<option value="" disabled selected>Selecione um Protocolo de Serviço</option>';

        if (data.services && data.services.length > 0) {
            data.services.forEach(service => {
                DOMElements.newContractServiceSelect.innerHTML += `<option value="${service.id}">${service.text}</option>`;
            });
            DOMElements.newContractServiceSelect.disabled = false;
        } else {
            DOMElements.newContractServiceSelect.innerHTML = '<option value="" disabled selected>Nenhum serviço ativo encontrado</option>';
        }

        updateSubmitButtonState();
    } catch (error) {
        // A função apiRequest já chama showToast, mas ajustamos a mensagem.
        showToast('error', 'Erro ao buscar serviços.');
        DOMElements.newContractServiceSelect.innerHTML = '<option value="" disabled selected>Erro ao carregar serviços</option>';
        updateSubmitButtonState();
    }
};

const openNewContractModal = (costumer) => {
    DOMElements.newContractModal.style.display = 'flex';
    if (costumer) {
        DOMElements.TituloAddNewContrato.textContent = `Gerar Novo Contrato para ${costumer.firstName} ${costumer.lastName}`;
        DOMElements.SelectClientEstrutura.innerHTML = `<option value="${costumer.id}">${costumer.firstName} ${costumer.lastName}</option>`;
        DOMElements.SelectClientEstrutura.value = costumer.id;

        loadNewContractServices(costumer.id);
        LoadModelContracts();
    }
};

async function submitNewContractForm(event) {
    event.preventDefault();
    const clientId = DOMElements.SelectClientEstrutura.value;
    const serviceId = DOMElements.newContractServiceSelect.value;
    const templateId = DOMElements.newContractTemplateSelect.value;

    const formData = {
        client: clientId,
        service: serviceId,
        template: templateId,
    };


    const url = '/ContractsClientes/create/';
    try {
        const data = await apiRequest(url, 'POST', formData);

        if (data.success) {
            showToast('success', 'Contrato Criado com sucesso!');
            closeNewContractModal();
        } else {
            const errorDiv = document.getElementById('form-errors');
            errorDiv.innerHTML = '';
            // Processa erros de validação retornados pela API
            for (const field in data.errors) {
                data.errors[field].forEach(error => {
                    const p = document.createElement('p');
                    p.textContent = `${field}: ${error.message}`;
                    errorDiv.appendChild(p);
                });
            }
        }
    } catch (error) {
        showToast('error', 'Não foi possível Gerar o contrato. Tente novamente mais tarde.');
    }
}

const renderContractsList = (contracts) => {
    DOMElements.contractsTbody.innerHTML = '';

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
            DOMElements.contractsTbody.appendChild(row);
        });
    } else {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" style="text-align: center;">Nenhum contrato encontrado.</td>`;
        DOMElements.contractsTbody.appendChild(row);
    }
};


export {
    initializeContractElements,
    openNewContractModal,
    closeNewContractModal,
    submitNewContractForm,
    renderContractsList,
    updateSubmitButtonState,
};