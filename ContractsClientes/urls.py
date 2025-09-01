from django.urls import path
from . import views

app_name = 'ContractsClientes'
urlpatterns = [
    path('', views.contract_list, name='ContractsClientes'),
    path('create/', views.create_contract, name='create'),
    path('sign/<uuid:signature_link_id>/', views.sign_contract, name='sign'),
    path('signing-complete/', views.signing_complete, name='signing_complete'),
    path('view-pdf/<int:contract_id>/', views.view_signed_pdf, name='view_pdf'),
    path('api/services-by-client/<int:client_id>/', views.get_services_by_client, name='api_services_by_client'),
]