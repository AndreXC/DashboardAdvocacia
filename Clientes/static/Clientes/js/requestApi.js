// requestApi.js
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

const formatCurrency = (amount) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
const formatDate = (dateString) => new Date(dateString).toLocaleDateString('pt-BR', { timeZone: 'UTC' });

export { apiRequest, openModal, closeModal, formatCurrency, formatDate, getCsrfToken };