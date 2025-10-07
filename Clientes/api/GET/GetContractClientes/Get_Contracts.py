    


from django.http import HttpRequest, JsonResponse
from django.urls import reverse
from Clientes.models import Customer
from ContractsClientes.models import Contract
from django.views.decorators.http import require_http_methods

class ApiContractCustomer:
    def __init__(self, customer_id: int, request: HttpRequest):
        self.costumer_id:int =  customer_id
        self.request: HttpRequest =  request
        
    def _GetContractsCostumer(self): 
        try:
            
            cliente = Customer.objects.get(pk=self.costumer_id)
            contracts_list = Contract.objects.filter(
                client=cliente
            ).select_related('client', 'template').order_by('-created_at')
            
            contratos  = []
            
            for contract  in contracts_list:
                signing_url = reverse('ContractsClientes:sign', args=[contract.signature_link_id])
                pdf_url = reverse('ContractsClientes:view_pdf', args=[contract.id])

                contratos.append({
                    'id': contract.id,
                    'template': contract.template.title if contract.template else 'Modelo Removido',
                    'status': contract.get_status_display(),
                    'statusCode': contract.status,           
                    'signingUrl': self.request.build_absolute_uri(signing_url),
                    'pdfUrl': self.request.build_absolute_uri(pdf_url) if pdf_url else None,
                    'createdAt': contract.created_at.strftime('%d/%m/%Y'),
                })
    
            return True, '', contratos if len(contratos) > 1 else {}
                    
        except Customer.DoesNotExist:
               self.StrErr +=  'Cliente não encontrado.'
               return False, self.StrErr, []
        except Exception as e:
            self.StrErr += ' :'  + str(e.args)
            return False, self.StrErr, []
        
        

@require_http_methods(['GET'])
def contract_list_api(request, customer_id) -> JsonResponse:
    instanceApiContratoList = ApiContractCustomer(request=request, customer_id=customer_id)
    result, StrErr, contratos = instanceApiContratoList._GetContractsCostumer()
    
    if not result:
        return JsonResponse({'error': str(StrErr)}, 400)
    

    return JsonResponse(contratos, safe=False)
    
    
    
    
    
    
    
    
        
        