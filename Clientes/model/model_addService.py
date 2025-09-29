from pydantic import BaseModel
from datetime import date

class addService(BaseModel):
    nome_servico: str
    descricao: str
    tipo_pagamento: str
    data_primeiro_pagamento: date
    area_direito: int
    valor_total_servico: float
    valor_entrada_servico: float = 0  
    numero_parcelas: int | None = None 
    juros_mensal: float = 0
