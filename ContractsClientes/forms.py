# contracts/forms.py (ou o arquivo onde seu formulário está)
from django import forms
from .models import Contract
from Clientes.models import Service # Importe o modelo Service

class CreateContractForm(forms.ModelForm):
    class Meta:
        model = Contract
        fields = ['client', 'template', 'service'] # Adicione 'service' aqui
        widgets = {
            'client': forms.Select(attrs={'class': 'form-select'}),
            'template': forms.Select(attrs={'class': 'form-select'}),
            'service': forms.Select(attrs={'class': 'form-select'})
        }