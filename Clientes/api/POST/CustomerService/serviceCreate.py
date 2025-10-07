
import secrets
import sys
import os
import json
from datetime import date, timedelta
from django.http import JsonResponse,HttpRequest
from django.views.decorators.http import require_http_methods

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..")))

from Clientes.models import Customer, Service, Invoice, AreaDireito
from validator.formService.form_add_service import ValidatorFormAddService
from model.model_addService import addService

class CustomerService:
    def __init__(self, customer_id: int, request: HttpRequest):
        self.customer_id = customer_id
        self.request = request
        self.StrErr:str = ''
        self.protocolo: str = ''
        self.validatorFormAddService:dict = {}


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
            formularioAddService = json.loads(self.request.body)
            if not formularioAddService:
                self.StrErr = 'Dados do formulário de serviço estão vazios.'
                return False

            instanceValidFormularioAddService = ValidatorFormAddService(formularioAddService)
            if not instanceValidFormularioAddService.is_valid():
                self.validatorFormAddService = instanceValidFormularioAddService.validated_errors
                return False
            

            instanceAddService = addService(**formularioAddService)
            cliente = Customer.objects.get(pk=self.customer_id)
            area_direito_instance = AreaDireito.objects.get(pk=instanceAddService.area_direito)
            
            if not self.generate_protocolo():
                return False

            self.StrErr = 'Erro ao criar o serviço.'
            service = Service.objects.create(
                customer=cliente,
                nome_servico=instanceAddService.nome_servico,
                protocolo=self.protocolo,
                area_direito=area_direito_instance,
                total_value=instanceAddService.valor_total_servico,
                status=Service.StatusChoices.ACTIVE
            )
            
            self.StrErr = 'Erro ao criar a estrutura de parcelamento.'
            if instanceAddService.tipo_pagamento == 'avista':
                Invoice.objects.create(
                    service=service,
                    description='Pagamento Único',
                    due_date=date.fromisoformat(instanceAddService.data_primeiro_pagamento),
                    value=service.total_value,
                    status=Invoice.StatusChoices.PENDING
                )
            else: # Parcelado
                self.StrErr = 'Erro ao criar invoice.'
                installments = int(instanceAddService.numero_parcelas)
                installment_value = service.total_value / installments
                for i in range(installments):
                    self.StrErr += f'Erro ao criar invoice item {i}'
                    due_date = date.fromisoformat(instanceAddService.data_primeiro_pagamento) + timedelta(days=30 * i)
                    Invoice.objects.create(
                        service=service,
                        description=f"Parcela {i+1}/{installments}",
                        due_date=due_date,
                        value=installment_value,
                        status=Invoice.StatusChoices.PENDING
                    )
                    
            return True
                    
                
                    
        except Customer.DoesNotExist:
               self.StrErr +=  ' Cliente não encontrado.'
               return False

        except AreaDireito.DoesNotExist:
            self.StrErr +=  ' Área do direito não encontrada.'
            return False
        
        except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
            self.StrErr += ' :'  + str(e.args)
            return False

        except Exception as e:
            self.StrErr += ' :'  + str(e.args)
            return False

