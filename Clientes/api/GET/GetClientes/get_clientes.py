
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from Clientes.models import Customer


class GetClientes:
    def __init__(self, costumer_id:int):
        self.costumer_id = costumer_id
        self.strErr:str = ''
        self.cliente:dict = {}
        
        
    def _GetCliente(self):
        try:
            cliente = Customer.objects.prefetch_related(
                    'services__invoices', 
                    'services__area_direito'
            ).get(pk=self.costumer_id)
            
            services = []
            for service in cliente.services.all():
                invoices_data = [{
                    'id': i.id,
                    'description': i.description,
                    'dueDate': i.due_date,
                    'value': i.value,
                    'status': i.status,
                } for i in service.invoices.all().order_by('due_date')]
                
                
                if service.status == 'Ativo':
                    services.append({
                        'id': service.id,
                        'nomeServico': service.nome_servico,
                        'status': service.status,
                        'totalValue': service.total_value,
                        'invoices': invoices_data,
                        'protocolo': service.protocolo,
                        'areaDireito': service.area_direito.nome
                    })
                

            self.cliente = {
                'id': cliente.id,
                'firstName': cliente.first_name,
                'cpf': cliente.cpf,
                'lastName': cliente.last_name,
                'email': cliente.email,
                'phone': cliente.phone,
                'address': cliente.address,
                'company': cliente.company,
                'position': cliente.position,
                'photoUrl': cliente.photo_url,
                'services': services
            }
            
            return True
        
        except Customer.DoesNotExist:
            self.strErr += 'Cliente não encontrado.'
            return False
        
        except Exception as e:
            self.strErr += '[GetClientes] :'  + str(e.args)
            return False
        
        