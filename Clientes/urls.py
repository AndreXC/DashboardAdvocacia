from django.urls import path
from . import views
from . import imports as imp

app_name = 'Clientes'

urlpatterns = [
    # A página principal
    path('', views.customer_dashboard, name='dashboard'),
    # API para criar um novo Clientes
    path('api/customers/', views.customer_list_create_api, name='api_customer_list_create'),
    path('api/cliente/<int:pk>/',views.customer_detail_api , name='api_customer_detail'),
   
   
    # API para Serviços
    path('api/customers/<int:customer_pk>/services/', imp.service_create_api, name='api_service_create'),
    path('api/customers/<int:customer_id>/contracts/', imp.contract_list_api, name='api_contract_list'),
    path('api/services/<int:pk>/', views.service_detail_api, name='api_service_detail'),
    # API para Faturas (apenas para atualizar status)
    path('api/invoices/<int:pk>/', views.invoice_detail_api, name='api_invoice_detail'),
    
]

# {% include "includes/menuNotificationWindows.html" %}