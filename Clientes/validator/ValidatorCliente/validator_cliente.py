import os
import sys
from ..FieldValidator.field_validator import fieldValidator

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from model.model_cliente import modelCliente
from Clientes.models import Customer


class validatorCLiente:
    def __init__(self, form:dict):
        self.form = form
        self.validated_errors = {}
            
    def is_valid(self):
        try:
            cliente_dados_update:modelCliente =  modelCliente(**self.form)
            
            
            # if Customer.objects.filter(cpfCnpj=cpf_cnpj).exists():
                
            # instancefieldValidator:fieldValidator =fieldValidator(cliente_dados_update.cpf)
           
            # if not instancefieldValidator.checkCpf.isValid():
            #     self.validated_errors['edit-cpf'] = 'CPF inválido'
            
            # cliente: Customer = Customer.objects.get(id=cliente_dados_update.id_cliente)
            
            # if not cliente_dados_update.cpf ==  cliente.cpf:
            #     cpf_exists = Customer.objects.filter(cpf=cliente_dados_update.cpf).exists()
            #     if cpf_exists:
            #         self.validated_errors['edit-cpf'] = 'CPF já cadastrado'
                    
            # if not instancefieldValidator.checkEmail.isValid():
            #     self.validated_errors['edit-email'] = 'E-mail inválido'
                
                
        except Exception as e:
            return False
        
        