import json
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from model.model_cliente import modelCliente
from Clientes.models import Customer

class updateCliente:
    def __init__(self, request:dict):
        self.request:dict = request
        self.strErr:str = ''
        
    def _updateCliente(self, customer_id:int):
        try:
            if self.request is None:
                self.strErr = '[updateCliente] - Não foram encontrados campos para atualizar o cliente'
                return False
            
            clienteModelUpdate: modelCliente = modelCliente(**self.request)
            
            campos_cliente = {
                'first_name': clienteModelUpdate.nome,
                'last_name': clienteModelUpdate.sobrenome,
                'email': clienteModelUpdate.email,
                'phone': clienteModelUpdate.telefone,
                'address': clienteModelUpdate.endereco,
                'company': clienteModelUpdate.empresa,
                'position': clienteModelUpdate.position,
                'photo_url': clienteModelUpdate.photo_url,
            }
            
            dados_cliente_autalizar = {k: v for k, v in campos_cliente.items() if v not in [None, '', 'null']}

            if len(dados_cliente_autalizar) <=0:
                self.strErr = '[updateCliente] - Nenhum campo com valor para autalizar o cliente.'
                return False

 
            Customer.objects.filter(pk=customer_id).update(**dados_cliente_autalizar)
            return True
        
        except json.JSONDecodeError:
            self.strErr = 'não foi possível decodificar o JSON'
            return False
        except Customer.DoesNotExist:
            self.strErr = 'Cliente não encontrado'
            return False
        except Exception as e: 
            self.strErr = '[updateCliente] erro ao atualizar o cliente: ' + str(e)
            return False        
        
