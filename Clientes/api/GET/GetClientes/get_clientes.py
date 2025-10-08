import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from Clientes.models import Customer


class GetClientes:
    def __init__(self, filter_by:str ='first_name'):
        self.filter_by:str = filter_by
        self.strErr:str = ''
        self.clientes:list = []

    def _GetClientes(self):
        try:
            customers = Customer.objects.all().order_by(self.filter_by)
            for cliente in customers:
                self.clientes.append({
                    'id': cliente.id,
                    'fullName': cliente.full_name,
                    'tipoPessoa': cliente.tipo_pessoa,
                    'company': cliente.company,
                    'image_url': cliente.photo_url,
                    'cpf': cliente.cpfCnpj,
                })
                
            return True
        except Exception as e:
            self.strErr = 'erro ao tentar extrair clientes: ' + str(e)
            return False