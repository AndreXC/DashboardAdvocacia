import base64
import json
from django.utils import timezone   
from django.shortcuts import get_object_or_404
from ...models import Contract
from django.core.files.base import ContentFile
from django.conf import settings
from django.utils import timezone
import os
from weasyprint import HTML, CSS


class ContractExtractor:
    def __init__(self, signature_link_id):
        self.signature_link_id = signature_link_id
        self.contract = None
        self.title:str
        self.ConteudoContrato:str
        self.strErr = ''
        self.payload_contrato = {}
        self.status = '' 
        self.clienteFullname = ''
        self.assinaturaBase64 = ''
        
        
        self.formaterBase64 = lambda valueBase64: f"data:image/png;base64,{valueBase64}"
        
        
    def _getContratoModel(self):
        try:
            self.contract = get_object_or_404(Contract, signature_link_id=self.signature_link_id)
            self.status = self.contract.status
            self.clienteFullname = self.contract.client.full_name
            return True

        except Contract.DoesNotExist:
            self.strErr =  'Contrato não existe na base de dados'
            return False

        except Exception as e:
            self.strErr = 'erro inesperado ao extrair o contrato' + str(e)
            return False



    def _extract_contract_data(self):
        if self.contract:
            try:
                contract_model = json.loads(self.contract.template.content_html)
                self.title:str = contract_model[0]["title"]
                self.ConteudoContrato:str = contract_model[0]["content"]
            except (json.JSONDecodeError, IndexError, KeyError) as e:
                self.strErr = 'Erro ao tentar converter json string: ' + str(e)
                return  '', ''
            
            
    def _savePdfContractAndFinish(self, corpoHtmlpdfCompleto):
        if not self._getContratoModel():
            return False
        
        try:
            html = HTML(string=corpoHtmlpdfCompleto, base_url='/') 
            
            pdf_buffer = html.write_pdf()
            
            if not pdf_buffer:
                self.strErr = 'Erro ao tentar gerar o pdf com WeasyPrint'
                return False

            pdf_file_bytes = pdf_buffer
            
            self.contract.signed_pdf_file.save(
                f'Contrato_cliente_{self.contract.client.full_name}_protocolo_{self.contract.service.protocolo}.pdf', 
                ContentFile(pdf_file_bytes), 
                save=True
            )
            self.contract.status = 'SIGNED'
            self.contract.signed_at = timezone.now()
            self.contract.save()
            
            return True
        
        except Exception as e:
            self.strErr = 'Erro inesperado ao tentar salvar o Contrato e finalizar: ' + str(e)
            return False

            
    def _get_assinatura_base64(self):
        if self.contract.signature_image:
            try:
                image_path = os.path.join(settings.MEDIA_ROOT, str(self.contract.signature_image))
                
                with open(image_path, 'rb') as image_file:
                    encoded_string = base64.b64encode(image_file.read()).decode('utf-8')
                    
                file_extension = os.path.splitext(str(self.contract.signature_image))[1].lower()

                if file_extension in ['.jpg', '.jpeg']:
                    mime_type = 'image/jpeg'
                elif file_extension == '.png':
                    mime_type = 'image/png'
                else:
                    mime_type = 'image/png'  
                    
                self.assinaturaBase64 = f'data:{mime_type};base64,{encoded_string}'
                
                return True
            
            except Exception as e:
                self.strErr = 'erro ao converter a assinatura em base64: ' + str(e)
                return False
            
        
            
    def _generate_payload(self):
        if (not self._getContratoModel()):
            return False, {}
        
        try:
            # assinatura_uri = Path(self.contract.signature_image.url).as_uri()
            today = timezone.localdate().strftime('%d de %B de %Y')
            
            self._extract_contract_data()
            
            self._replace_placeholders()
            
            if not self._get_assinatura_base64():
                return False
            
            self.payload_contrato  =  {
                'content': self.ConteudoContrato,
                'signature_uri': self.assinaturaBase64,
                'client_name': self.contract.client.full_name,
                'client_cpf': self.contract.client.cpf,
                'protocol_number': self.contract.service.protocolo,
                'signed_date': today,
            }
            
            return True
            
        except Exception as e:
            self.strErr = 'Erroao retornar payload: ' + str(e)  
            return False, {}
        
            
    def _replace_placeholders(self):
        if self.ConteudoContrato and self.contract:
            
            placeholders = {
                '{{ nome_cliente }}': self.contract.client.full_name,
                '{{ email_cliente }}': self.contract.client.email,
                '{{ cpf_cliente }}': str(self.contract.client.cpf),
                '{{ protocolo_contrato }}': str(self.contract.service.protocolo)
            }
            
            for placeholder, value in placeholders.items():
                self.ConteudoContrato = self.ConteudoContrato.replace(placeholder, str(value))
                
                
    def _save_assinatura_digital(self, assinatura_base64: str):
        if (not self._getContratoModel()):
            return False

        try:
            format, imgstr = self.formaterBase64(assinatura_base64).split(';base64,')
            ext = format.split('/')[-1]
            
            data_file = ContentFile(base64.b64decode(imgstr), name=f'{self.contract.service.protocolo}.{ext}')
            self.contract.signature_image.save(f'assinatura_cliente_{self.contract.client.full_name}_protocolo_{self.contract.service.protocolo}.{ext}', data_file, save=True)
            
            return True
        
        except Exception as e:
            self.strErr = 'Erro ao converter assinatura em base64 e salvar:' +  str(e)
            return False


    def get_corrected_contract(self):
        try:
            if (not self._getContratoModel()):
                return False
       
            if self.contract.status == 'SIGNED':
                return False
            
            
            self._extract_contract_data()
            self._replace_placeholders()
             
            
            return True
        
        
        except Exception as e:
            self.strErr = 'Não foi possível carregar ou corrigir o contrato: ' + str(e)
            return False
