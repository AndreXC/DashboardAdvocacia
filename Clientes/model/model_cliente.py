from pydantic import BaseModel

class modelCliente(BaseModel):
    id_cliente: int
    nome: str
    sobrenome: str
    cpf: str
    email: str
    telefone: str
    endereco: str
    empresa: str
    position :str
    photo_url: str = None