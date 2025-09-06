

from ....models import Customer, Service, Invoice
from django.http import HttpRequest, JsonResponse
import json
from ...comuns.Getareaservice import get_area_direito
from datetime import date, timedelta

class CustomerService:
    def __init__(self, customer_id: int, request: HttpRequest):
        self.customer_id = customer_id
        self.request = request
        self.StrErr:str = ''

    def _create_service(self):
        try:
            cliente = Customer.objects.get(pk=self.customer_id)

            self.StrErr = 'Erro ao decodificar dados do json Service.'
            # Lógica para criar o serviço
            body_request_service = json.loads(self.request.body)
            
            # Obtendo a instância de AreaDireito
            self.StrErr = 'Área de Direito não encontrada.'
            id_area_direito = body_request_service.get('area_direito')


            self.strErr = 'Erro ao buscar a Área de Direito.'
            instanceAreaDireito = get_area_direito(id_area_direito) if id_area_direito else None

            #criando Seriço no banco de dados
            self.StrErr = 'Erro ao criar o serviço.'
            service = Service.objects.create(
                customer=cliente,
                nome_servico=body_request_service.get('name'),
                protocolo=body_request_service.get('protocolo'),
                area_direito=instanceAreaDireito,
                total_value=body_request_service.get('totalValue')
            )
            
            # Lógica para criar as faturas (invoices)
            self.StrErr = 'Erro ao criar as faturas.'
            DiaprimeiroPagamento = date.fromisoformat(body_request_service.get('firstPaymentDate'))
            if body_request_service.get('paymentType') == 'avista':
                Invoice.objects.create(
                    service=service,
                    description='Pagamento Único',
                    due_date=DiaprimeiroPagamento,
                    value=service.total_value,
                    status=Invoice.StatusChoices.PENDING
                )
            else: # Parcelado
                self.StrErr = 'Erro ao criar invoice.'
                installments = int(body_request_service.get('installments'))
                installment_value = service.total_value / installments
                for i in range(installments):
                    self.StrErr = f'Erro ao criar invoice item {i}'
                    due_date = DiaprimeiroPagamento + timedelta(days=30 * i)
                    Invoice.objects.create(
                        service=service,
                        description=f"Parcela {i+1}/{installments}",
                        due_date=due_date,
                        value=installment_value,
                        status=Invoice.StatusChoices.PENDING
                    )
                    
            return True, ''
                    
        except Customer.DoesNotExist:
               self.StrErr +=  'Cliente não encontrado.'
               return False, self.StrErr
           
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            # Captura erros de formato de dados e campos ausentes
            self.StrErr += ' :'  + str(e.args)
            return False, self.StrErr

        except Exception as e:
            self.StrErr += ' :'  + str(e.args)
            return False, self.StrErr
