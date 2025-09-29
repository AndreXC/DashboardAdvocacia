from datetime import date
import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from model.model_addService import addService 

class ValidatorFormAddService:
    def __init__(self, form: dict):
        self.form = form
        self.validated_errors = {}
    def is_valid(self):
        instanceAddService = addService(**self.form)
        
        if instanceAddService.nome_servico == '':
            self.validated_errors['nome_servico'] = 'O campo "Nome do servico" é obrigatório.'
            
        if instanceAddService.tipo_pagamento not in ['avista', 'parcelado']:
            self.validated_errors['tipo_pagamento'] = 'Tipo de pagamento inválido. Deve ser "avista" ou "parcelado".'
        
        if instanceAddService.data_primeiro_pagamento == '':
            self.validated_errors['data_primeiro_pagamento'] = 'O campo "Data do primeiro pagamento" é obrigatório.'
                
        if not (instanceAddService.data_primeiro_pagamento > date.today()):
            self.validated_errors['data_primeiro_pagamento'] = 'A data do primeiro precisa ser maior que o dia de hoje.'
            
        if instanceAddService.area_direito <= 0:
            self.validated_errors['area_direito'] = 'Área do direito inválida.'
        
        if instanceAddService.valor_total_servico <= 0:
            self.validated_errors['valor_total_servico'] = 'O valor total do serviço deve ser maior que zero.'
            
        if instanceAddService.tipo_pagamento == 'parcelado':
            if instanceAddService.numero_parcelas is None or instanceAddService.numero_parcelas <= 0:
                self.validated_errors['numero_parcelas'] = 'Número de parcelas inválido ou não fornecido para pagamento parcelado.'
            
            if instanceAddService.valor_entrada_servico < 0:
                self.validated_errors['valor_entrada_servico'] = 'O valor de entrada não pode ser negativo.'
            
            if instanceAddService.valor_entrada_servico >= instanceAddService.valor_total_servico:
                self.validated_errors['valor_entrada_servico'] = 'O valor de entrada deve ser menor que o valor total do serviço.'
            
            if instanceAddService.juros_mensal < 0:
                self.validated_errors['juros_mensal'] = 'O valor de juros mensal não pode ser negativo.'
            
            
            
        if len(self.validated_errors) > 0:
            return False
        
        return True 
        
            