from django.urls import path
import Clientes.views as route

app_name = 'Clientes'
urlpatterns = [
    # A página principal
    path('', route.customer_dashboard, name='dashboard'),
    # API para criar um novo Clientes
    path('api/customers/', route.customer_list_create_api, name='api_customer_list_create'),
    path('api/cliente/<int:pk>/',route.customer_detail_api , name='api_customer_detail'),
   
   
    # API para Serviços
    path('api/customers/<int:customer_pk>/services/', route.service_create_api, name='api_service_create'),
    path('api/customers/<int:customer_id>/contracts/', route.contract_list_api, name='api_contract_list'),
    path('api/services/<int:pk>/', route.service_detail_api, name='api_service_detail'),
    # API para Faturas (apenas para atualizar status)
    path('api/invoices/<int:pk>/', route.invoice_detail_api, name='api_invoice_detail'),
    
]