from Clientes.models import Customer


class delete_Cliente():
    def __init__(self, customer_id:int):
        self.customer_id:int = customer_id
        self.strErr:str = ''
    
    def _delete(self):
        try:
            cliente = Customer.objects.get(pk=self.customer_id)
            cliente.delete()
            
            return True
        except Customer.DoesNotExist:
            self.strErr = '[delete_Cliente] - Cliente não encontrado'  
            return False
        except Exception as e:
            self.strErr = '[delete_Cliente] - Erro ao deletar o cliente: ' + str(e)
            return False