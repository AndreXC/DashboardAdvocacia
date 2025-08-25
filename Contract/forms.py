# templates_app/forms.py
from django import forms
from .models import ContractTemplate

class ContractTemplateForm(forms.ModelForm):
    class Meta:
        model = ContractTemplate
        fields = ['title', 'content_html']
        widgets = {
            'title': forms.TextInput(
                attrs={
                    'class': 'form-control'
                }
            ),
            'content_html': forms.Textarea(
                attrs={
                    'class': 'form-control',
                    'id': 'editor' 
                }
            ),
        }
        labels = {
            'title': 'Título do Modelo',
            'content_html': 'Conteúdo do Contrato',
        }