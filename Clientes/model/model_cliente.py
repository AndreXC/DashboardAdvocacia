from pydantic import BaseModel

class modelCliente(BaseModel):
    nome: str
    sobrenome: str
    email: str
    telefone: str
    endereco: str
    empresa: str
    position :str
    photo_url: str