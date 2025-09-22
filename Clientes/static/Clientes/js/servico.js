// servico.js
import { apiRequest, formatCurrency, formatDate, closeModal } from './requestApi.js';
import { displayCustomerDetails } from './clientes.js';

let currentServiceId = null;
let currentCustomerId = null; 

const DOMElements = {};

const initializeServiceElements = (elements, customerIdRef) => {
    Object.assign(DOMElements, elements);
    currentCustomerId = customerIdRef; // Recebe a referência da variável de cliente
};

const renderServicesList = (services) => {
    DOMElements.servicesTbody.innerHTML = '';
    if (!services || services.length === 0) {
        DOMElements.servicesTbody.innerHTML = '<tr><td colspan="5">Nenhum serviço contratado.</td></tr>';
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
        DOMElements.servicesTbody.appendChild(row);
    });
};

const renderInvoicesForService = (service) => {
    DOMElements.invoicesTbody.innerHTML = '';
    currentServiceId = service.id;

    document.querySelectorAll('#services-tbody tr').forEach(row => {
        row.classList.toggle('selected', row.dataset.serviceId == service.id);
    });

    if (!service.invoices || service.invoices.length === 0) {
        DOMElements.invoicesTbody.innerHTML = '<tr><td colspan="4">Nenhuma fatura para este serviço.</td></tr>';
        DOMElements.totalInvoicesAmountEl.textContent = formatCurrency(0);
        DOMElements.serviceInvoicesSection.classList.add('hidden');
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
        DOMElements.invoicesTbody.appendChild(row);
    });

    DOMElements.totalInvoicesAmountEl.textContent = formatCurrency(service.totalValue);
    DOMElements.serviceInvoicesSection.classList.remove('hidden');
};

const handleServiceSelect = async (e) => {
    if (e.target.matches('.status-select')) return;
    const row = e.target.closest('tr');
    if (row && row.dataset.serviceId) {
        const customer = await apiRequest(`/api/customers/${currentCustomerId.currentCustomerId}/`);
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
            await displayCustomerDetails(currentCustomerId.currentCustomerId);
        }
    } catch (error) {
        showToast('error', `Falha ao atualizar status de ${entity}:` + error);
    }
};




function displayError(inputElement, message) {
    const formGroup = inputElement.closest('.form-group');
    if (formGroup) {
        formGroup.classList.add('has-error');

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('error-message');
        errorMessage.textContent = message;

        inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);

    }

}

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


function validateServiceForm(formData, formElement) {
    let isValid = true;
    const inputsWithErrors = []; 

    const paymentType = formData.get('paymentType');

    const validationRules = { 
        'serviceName': { required: true, requiredMessage: "O Nome do serviço é obrigatório." },
        'paymentType': { required: true, requiredMessage: "O Tipo de pagamento é obrigatório.", isSelect: true },
        'serviceValue': { required: true, regex: /^\d+(\.\d{1,2})?$/, requiredMessage: "O Valor total do serviço é obrigatório.", regexMessage: "O Valor total deve ser um número válido (ex: 1000.00)." },
        
        'serviceEntryValue': { 
            required: (paymentType === 'parcelado'), 
            regex: /^\d+(\.\d{1,2})?$/, 
            requiredMessage: "O Valor de entrada é obrigatório para parcelamento.", 
            regexMessage: "O Valor de entrada deve ser um número válido (ex: 1000.00)." 
        },
        
        'serviceInstallments': { 
            required: (paymentType === 'parcelado'), 
            regex: /^\d+$/, 
            requiredMessage: "A quantidade de parcelas é obrigatória para parcelamento.", 
            regexMessage: "O número de parcelas deve ser um número inteiro." 
        },
        
        'serviceInterest': { required: false, regex: /^\d+(\.\d{1,2})?$/, regexMessage: "A taxa de juros deve ser um número válido (ex: 5.00)." },
    };
    
    for (const name in validationRules) {
        const rules = validationRules[name];
        const value = formData.get(name);
        const inputElement = formElement.querySelector(`#${name}`);
        
        if (!inputElement) continue;

        const isRequired = rules.required;
        const isEmpty = !value || !String(value).trim() || (rules.isSelect && value === '');

        if (isRequired && isEmpty) {
            inputsWithErrors.push({ element: inputElement, message: rules.requiredMessage });
            isValid = false;
            continue;
        } 

        else if (value && rules.regex) {
            let finalValue = value;
            
            if (inputElement.type === 'number' || ['serviceValue', 'serviceEntryValue', 'serviceInterest'].includes(name)) {
                 finalValue = finalValue.replace(/\./g, '').replace(',', '.');
            }
            
            if (!rules.regex.test(finalValue)) {
                inputsWithErrors.push({ element: inputElement, message: rules.regexMessage });
                isValid = false;
            }
        }
    }
    
    return { isValid, inputsWithErrors };
}

function CheckFormValidityService() {
    DOMElements.serviceForm.querySelectorAll('.form-group input, .form-group select, .form-group textarea').forEach(element => cleanError(element)); 
    
    const formData = new FormData(DOMElements.serviceForm);
    const { isValid, inputsWithErrors } = validateServiceForm(formData, DOMElements.serviceForm);

    document.getElementById('save-service-btn_form').disabled = !isValid;
    
    if (!isValid) {
        inputsWithErrors.forEach(error => {
            displayError(error.element, error.message);
        });
    }
}

const handleServiceFormSubmit = async (e) => {
    e.preventDefault();
    if (!currentCustomerId.currentCustomerId) return;

    const formData = new FormData(DOMElements.serviceForm);
    const validationServiceResult = validateServiceForm(formData, DOMElements.serviceForm);
    if (!validationServiceResult.isValid) {
        validationServiceResult.inputsWithErrors.forEach(error => displayError(error.element, error.message));
        saveButton.disabled = false;
        return;
    }

    const serviceData = {
        name: document.getElementById('serviceName').value,
        description: document.getElementById('serviceDescription').value,
        paymentType: DOMElements.paymentTypeSelect.value,
        firstPaymentDate: DOMElements.firstPaymentDateInput.value,
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
        await apiRequest(`/api/customers/${currentCustomerId.currentCustomerId}/services/`, 'POST', serviceData);
        await displayCustomerDetails(currentCustomerId.currentCustomerId);
        closeModal(DOMElements.serviceModal);
        DOMElements.serviceForm.reset();
    } catch (error) {
        showToast("error", "Falha ao adicionar serviço:", error);
    }
};

const handlePaymentTypeChange = (e) => {
    const isParcelado = e.target.value === 'parcelado';
    DOMElements.entryValueGroup.classList.toggle('hidden', !isParcelado);
    DOMElements.parcelamentoGroup.classList.toggle('hidden', !isParcelado);
};

export {
    initializeServiceElements,
    renderServicesList,
    renderInvoicesForService,
    handleServiceSelect,
    handleStatusChange,
    handleServiceFormSubmit,
    handlePaymentTypeChange,
    CheckFormValidityService,
    currentServiceId,
};