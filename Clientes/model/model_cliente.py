from pydantic import BaseModel

class modelCliente(BaseModel):
    id_cliente: int = None
    nome: str
    sobrenome: str
    tipoPessoa: str
    cpfcnpj: str
    email: str
    telefone: str
    endereco: str
    empresa: str
    position :str
    photo_url: str = None
    
    
  