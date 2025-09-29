// init.js
import {
     openModal, closeModal
} from './requestApi.js';

import * as Cliente from './clientes.js';
import * as Servico from './servico.js';
import * as Contrato from './contrato.js';

// Variáveis de Estado (mantidas aqui para fácil acesso pelos módulos)
let currentCustomerId = null;
let currentServiceId = null;
let isEditMode = false;
let customerCache = [];

// Para permitir que os módulos acessem as variáveis de estado e elementos DOM.
const stateAndRefs = {
    get currentCustomerId() { return currentCustomerId; },
    set currentCustomerId(val) { currentCustomerId = val; },
    get currentServiceId() { return currentServiceId; },
    set currentServiceId(val) { currentServiceId = val; },
    get isEditMode() { return isEditMode; },
    set isEditMode(val) { isEditMode = val; },
    get customerCache() { return customerCache; },
    set customerCache(val) { customerCache = val; },
};


document.addEventListener('DOMContentLoaded', () => {

    // Referências dos Elementos DOM
    const DOMElements = {
        searchInput: document.getElementById('search-input'),
        customerListTbody: document.getElementById('customer-list-tbody'),
        emptyState: document.getElementById('empty-state'),
        customerContent: document.getElementById('customer-content'),
        detailTabs: document.querySelector('.detail-tabs'),
        tabContentInfo: document.getElementById('tab-content-info'),
        servicesTbody: document.getElementById('services-tbody'),
        contractsTbody: document.getElementById('contracts-tbody'),
        invoicesTbody: document.getElementById('invoices-tbody'),
        serviceInvoicesSection: document.getElementById('service-invoices-section'),
        totalInvoicesAmountEl: document.getElementById('total-invoices-amount'),
        customerModal: document.getElementById('customer-modal'),
        serviceModal: document.getElementById('service-modal'),
        deleteConfirmationModal: document.getElementById('delete-confirmation-modal'),
        alertModalText: document.getElementById('alert-modal-text'),
        customerForm: document.getElementById('customer-form'),
        serviceForm: document.getElementById('service-form'),
        entryValueGroup: document.getElementById('entry-value-group'),
        parcelamentoGroup: document.getElementById('parcelamento-group'),
        addNewCustomerBtn: document.getElementById('add-new-customer-btn'),
        addNewServiceBtn: document.getElementById('add-new-service-btn'),
        editCustomerBtn: document.getElementById('edit-customer-btn'),
        deleteCustomerBtn: document.getElementById('delete-customer-btn'),
        saveCustomerBtn: document.getElementById('save-customer-btn'),
        cancelEditBtn: document.getElementById('cancel-edit-btn'),
        deleteModalText: document.getElementById('delete-modal-text'),
        deleteConfirmBtn: document.getElementById('delete-confirm-btn'),

        // Contrato Elements
        newContractFormCliente: document.getElementById('create-contract-form'),
        newContractBtn: document.getElementById('add-new-contract-btn'),
        newContractModal: document.getElementById('create-contract-modal'),
        newContractTemplateSelect: document.getElementById('id_template_select'),
        newContractServiceSelect: document.getElementById('id_service_select'),
        closeNewContractModalBtn: document.getElementById('cancel-new-contract-btn'),
        cancelNewContractBtn: document.querySelector('#create-contract-modal .cancel-btn'),
        SelectClientEstrutura: document.getElementById('id_client_select'),
        TituloAddNewContrato: document.getElementById('TituloAddContractCliente'),
        ButtonSUbmitModalAddNewContract: document.getElementById('ButtonSubmitModalAddNewContract'),
    };
    
    // Inicializa os módulos com as referências dos elementos DOM
    Cliente.initializeCustomerElements(DOMElements);
    Servico.initializeServiceElements(DOMElements, Cliente); // Passa a referência do módulo Cliente para acessar currentCustomerId
    Contrato.initializeContractElements(DOMElements);


    const setupEventListeners = () => {
        DOMElements.searchInput.addEventListener('input', Cliente.handleSearchInput);
        DOMElements.customerListTbody.addEventListener('click', Cliente.handleCustomerSelect);
        DOMElements.detailTabs.addEventListener('click', (e) => e.target.matches('.tab-link') && Cliente.switchTab(e.target.dataset.tab));
        
        DOMElements.servicesTbody.addEventListener('click', Servico.handleServiceSelect);
        DOMElements.servicesTbody.addEventListener('change', Servico.handleStatusChange);
        DOMElements.invoicesTbody.addEventListener('change', Servico.handleStatusChange);

        DOMElements.editCustomerBtn.addEventListener('click', Cliente.enterEditMode);
        DOMElements.saveCustomerBtn.addEventListener('click', Cliente.handleSaveChanges);
        DOMElements.cancelEditBtn.addEventListener('click', () => Cliente.exitEditMode(false));

        DOMElements.deleteCustomerBtn.addEventListener('click', Cliente.handleDeleteRequest);
        DOMElements.deleteConfirmBtn.addEventListener('click', Cliente.handleDeleteConfirm);

        DOMElements.addNewCustomerBtn.addEventListener('click', () => {
            DOMElements.customerForm.reset();
            openModal(DOMElements.customerModal);
            document.getElementById('save-customer-btn-form').disabled = true;
        });
        DOMElements.addNewServiceBtn.addEventListener('click', () => {
            if (Cliente.currentCustomerId) {
                DOMElements.serviceForm.reset();
                openModal(DOMElements.serviceModal);
            } else showToast('warning', 'Selecione um cliente primeiro.');
        });

        DOMElements.customerForm.addEventListener('submit', Cliente.handleCustomerFormSubmit);
        DOMElements.customerForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('input', Cliente.checkFormValidityCliente);
        });

        DOMElements.serviceForm.addEventListener('submit', Servico.handleServiceFormSubmit);


        DOMElements.closeNewContractModalBtn.addEventListener('click', Contrato.closeNewContractModal);
        DOMElements.cancelNewContractBtn.addEventListener('click', Contrato.closeNewContractModal);
        DOMElements.newContractFormCliente.addEventListener('submit', Contrato.submitNewContractForm);
        window.onclick = function (event) {
            if (event.target == DOMElements.newContractModal) {
                Contrato.closeNewContractModal();
            }
        };

        // Modal close listeners
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                const isCloseButton = e.target.matches('.close-button') || e.target.matches('.cancel-btn') || e.target.matches('.ok-btn');
                if (e.target === modal || isCloseButton) {
                    if (Cliente.isEditMode && modal.id !== 'delete-confirmation-modal' && modal.id !== 'alert-modal') {
                        Cliente.exitEditMode(false);
                    }
                    closeModal(modal);
                }
            });
        });
    };

    const init = () => {
        setupEventListeners();
        Cliente.loadAndStoreCustomers();
    };

    init();
});