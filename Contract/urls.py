from django.urls import path
from . import views


app_name = 'Contract' 
urlpatterns = [
    path('', views.template_list, name='Contract'),
    path('create/', views.create_template, name='ContractCreate'),
    path('edit/<int:pk>/', views.contract_editor_view, name='edit'),
    path('delete/<int:pk>/', views.delete_template, name='delete'),
    path('api/save_contract/', views.save_contract_api, name='save_contract_api'),
    path('api/get_model_templates/', views.GetModelTemplates, name='get_model_templates'),
]