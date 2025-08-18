# Clientes_painel/urls.py
from django.urls import path
from . import views

app_name = 'Clientes_painel'

urlpatterns = [
    # A página principal
    path('', views.customer_dashboard, name='dashboard'),

    # API para Clientes
    path('api/customers/', views.customer_list_create_api, name='api_customer_list_create'),
    path('api/customers/<int:pk>/', views.customer_detail_api, name='api_customer_detail'),
    
    # API para Serviços
    path('api/customers/<int:customer_pk>/services/', views.service_create_api, name='api_service_create'),
    path('api/services/<int:pk>/', views.service_detail_api, name='api_service_detail'),
    
    # API para Faturas (apenas para atualizar status)
    path('api/invoices/<int:pk>/', views.invoice_detail_api, name='api_invoice_detail'),
]