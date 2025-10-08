import json
import sys
import os
from django.http import HttpRequest

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../..')))
from model.model_cliente import modelCliente
from Clientes.models import Customer


class updateCliente:
    def __init__(self, request:HttpRequest, customer_id:int):
        self.request:HttpRequest = request
        self.strErr:str = ''
        self.cliente_id:int =  customer_id
        
    def _updateCliente(self):
        try:

            dados_clientes = json.loads(self.request.body)

            


            clienteModelUpdate: modelCliente = modelCliente(**dados_clientes)
            campos_cliente = {
                'first_name': clienteModelUpdate.nome,
                'last_name': clienteModelUpdate.sobrenome,
                'cpf': clienteModelUpdate.cpf, 
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

            Customer.objects.filter(id=self.cliente_id).update(**dados_cliente_autalizar)
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
        
