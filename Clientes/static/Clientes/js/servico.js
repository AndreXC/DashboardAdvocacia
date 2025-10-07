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



const validatorFormAddService = (formError) => {
    const formElement = DOMElements.serviceForm;

    for (const name in formError) {
        const inputElement = formElement.querySelector(`#${name}`);

        if (!inputElement) continue;

        inputElement.closest('.form-group')?.classList.add('has-error');

        const errorMessage = document.createElement('p');
        errorMessage.classList.add('error-message');
        errorMessage.textContent = formError[name] ?? "Erro neste campo";

        inputElement.parentNode.insertBefore(errorMessage, inputElement.nextSibling);
    }

    const firstErrorInput = formElement.querySelector('.form-group.has-error input');
    if (firstErrorInput) {
        firstErrorInput.focus();
    }
};


const handleServiceFormSubmit = async (e) => {
    e.preventDefault();
    if (!currentCustomerId.currentCustomerId) return;

    const button = document.getElementById('save-service-btn_form');
    button.disabled = true;


    const serviceData = {
        nome_servico: document.getElementById('nomeService').value,
        descricao: document.getElementById('descricaoServico').value,
        tipo_pagamento: document.getElementById('tipoPagamento').value,
        data_primeiro_pagamento: document.getElementById('datePrimeiroPagamento').value,
        area_direito: parseInt(document.getElementById('areaDireitoAdmin').value, 10) || null,
        valor_total_servico: parseFloat(document.getElementById('valorTotalServico').value),
        valor_entrada_servico: parseFloat(document.getElementById('valorEntradaServico').value) || 0,
        numero_parcelas: parseInt(document.getElementById('numeroDeParcelas').value, 10),
        juros_mensal: parseFloat(document.getElementById('jurosMensal').value) || 0,
    };

    try {
        const { status, result } = await apiRequest(`/api/customers/${currentCustomerId.currentCustomerId}/services/`, 'POST', serviceData);
        if (status == 400) {
            validatorFormAddService(result.formError)
        }

        // return
        // }
        // await displayCustomerDetails(currentCustomerId.currentCustomerId);
        // closeModal(DOMElements.serviceModal);
        // DOMElements.serviceForm.reset();
    } catch (error) {
        console.log(error)
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
    currentServiceId,
};