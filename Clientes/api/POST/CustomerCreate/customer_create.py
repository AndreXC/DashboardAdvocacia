

import json
import uuid
from django.conf import settings
from django.http import HttpRequest, JsonResponse
import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '../../../..')))
from Clientes.models import Customer
from model.model_cliente import modelCliente


class createCliente:
    def __init__(self, request: HttpRequest):
        self.strErr:str =''
        self.request:HttpRequest = request
    
    def _createCliente(self) -> bool:
        try:   
            newCliente = json.loads(self.request.body)        
            cliente:modelCliente = modelCliente(**newCliente) 
                
            photo_file = self.request.FILES.get('photoUpload')

            if photo_file:
                file_extension = os.path.splitext(photo_file.name)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"
                save_path_dir = os.path.join(settings.BASE_DIR, 'static', 'imgusers')
                file_path = os.path.join(save_path_dir, unique_filename)

                with open(file_path, 'wb+') as destination:
                    for chunk in photo_file.chunks():
                        destination.write(chunk)

                image_url_to_save = f"{settings.STATIC_URL}imgusers/{unique_filename}"
                
                

            Customer.objects.create(
                first_name=cliente.nome,
                last_name=cliente.sobrenome,
                email=cliente.email,
                phone=cliente.telefone,
                address=cliente.endereco,
                company=cliente.empresa,
                position=cliente.position,
                photo_url=image_url_to_save if photo_file else 'https://cdn-icons-png.flaticon.com/512/149/149071.png',  
            )
            
            
            return True

        except Exception as e:
            self.strErr += 'Erro ao criar cliente: ' + str(e)
            return False