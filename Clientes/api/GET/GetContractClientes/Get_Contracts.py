    


from django.http import HttpRequest
from django.urls import reverse
from Clientes.models import Customer
from ContractsClientes.models import Contract

class ApiContractCustomer:
    def __init__(self, customer_id: int, request: HttpRequest):
        self.costumer_id:int =  customer_id
        self.request: HttpRequest =  request
        self.contratos:list[dict] = []
        
    def _GetContractsCostumer(self): 
        try:
            
            cliente = Customer.objects.get(pk=self.costumer_id)
            Lista_contratos = Contract.objects.filter(
                client=cliente
            ).select_related('client', 'template').order_by('-created_at')
            
            
            for contrato  in Lista_contratos:
                url_assinatura = reverse('ContractsClientes:sign', args=[contrato.signature_link_id])
                pdf_url = reverse('ContractsClientes:view_pdf', args=[contrato.id])

                self.contratos.append({
                    'id': contrato.id,
                    'template': contrato.template.title if contrato.template else 'Modelo Removido',
                    'status': contrato.get_status_display(),
                    'statusCode': contrato.status,           
                    'signingUrl': self.request.build_absolute_uri(url_assinatura),
                    'pdfUrl': self.request.build_absolute_uri(pdf_url) if pdf_url else None,
                    'createdAt': contrato.created_at.strftime('%d/%m/%Y'),
                })

            return True
                    
        except Customer.DoesNotExist:
               self.StrErr +=  'Cliente não encontrado.'
               return False
        except Exception as e:
            self.StrErr += 'Erro [ApicontractCustomer] :'  + str(e.args)
            return False    