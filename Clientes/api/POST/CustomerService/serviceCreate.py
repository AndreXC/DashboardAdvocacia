
import secrets
from ....models import Customer, Service, Invoice
from django.http import HttpRequest
import json
from ...comuns.Getareaservice import get_area_direito
from datetime import date, timedelta
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

class CustomerService:
    def __init__(self, customer_id: int, request: HttpRequest):
        self.customer_id = customer_id
        self.request = request
        self.StrErr:str = ''
        self.protocolo: str = ''


    def generate_protocolo(self) -> bool:
        def _random_digits(n: int) -> str:
            """Gera uma string com n dígitos aleatórios (0-9)."""
            return ''.join(str(secrets.randbelow(10)) for _ in range(n))

        def calculate_mod97_checksum(base_digits: str) -> str:
            """
            Calcula checksum mod 97 para a string numérica base_digits.
            Retorna 2 dígitos (padded com zero à esquerda se necessário).
            Fórmula: checksum = (97 - (int(base_digits) % 97)) % 97
            """
            rem = int(base_digits) % 97
            checksum = (97 - rem) % 97
            return f"{checksum:02d}"

        def generate_protocol_17() -> str:
            """
            Gera protocolo de 17 dígitos:
            - 15 dígitos aleatórios
            - 2 dígitos de checksum mod 97
            Retorna a string completa com 17 caracteres numéricos.
            """
            base = _random_digits(15)
            chk = calculate_mod97_checksum(base)
            return base + chk
        try:
            while True:
                protocolo:str = generate_protocol_17()
                if not Service.objects.filter(protocolo__exact=protocolo).exists():
                    self.protocolo = protocolo
                    break
                continue
        
            return True
        except Exception as e:
            self.StrErr += 'Erro ao gerar protocolo: ' + str(e)
            return False

    def _create_service(self) -> bool: 
        try:
            cliente = Customer.objects.get(pk=self.customer_id)

            self.StrErr = 'Erro ao decodificar dados do json Service.'
            body_request_service = json.loads(self.request.body)
            
            self.StrErr = 'Área de Direito não encontrada.'
            id_area_direito = body_request_service.get('area_direito')


            self.StrErr = 'Erro ao buscar a Área de Direito.'
            instanceAreaDireito = get_area_direito(id_area_direito) if id_area_direito else None

            if not self.generate_protocolo():
                return False

            #criando Seriço no banco de dados
            self.StrErr = 'Erro ao criar o serviço.'
            service = Service.objects.create(
                customer=cliente,
                nome_servico=body_request_service.get('name'),
                protocolo=self.protocolo,
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
                    self.StrErr += f'Erro ao criar invoice item {i}'
                    due_date = DiaprimeiroPagamento + timedelta(days=30 * i)
                    Invoice.objects.create(
                        service=service,
                        description=f"Parcela {i+1}/{installments}",
                        due_date=due_date,
                        value=installment_value,
                        status=Invoice.StatusChoices.PENDING
                    )
                    
            return True
                    
        except Customer.DoesNotExist:
               self.StrErr +=  'Cliente não encontrado.'
               return False

        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            # Captura erros de formato de dados e campos ausentes
            self.StrErr += ' :'  + str(e.args)
            return False

        except Exception as e:
            self.StrErr += ' :'  + str(e.args)
            return False




@require_http_methods(["POST"])
def service_create_api(request, customer_pk) -> JsonResponse:
    InstanceCustomerService = CustomerService(customer_pk, request)
    status =  InstanceCustomerService._create_service()
    if not status:
        return JsonResponse({'error': InstanceCustomerService.StrErr}, status=500)
    return JsonResponse({'message': 'Serviço criado com sucesso.'}, status=201)
