# contracts/models.py
import uuid
from django.db import models
from Clientes.models import Customer
from Contract.models import ContractTemplate
from Clientes.models import Service

class Contract(models.Model):
    class ContractStatus(models.TextChoices):
        PENDING = 'PENDING', 'Pendente de Assinatura'
        SIGNED = 'SIGNED', 'Assinado'

    client = models.ForeignKey(Customer, on_delete=models.CASCADE, verbose_name="Cliente")
    template = models.ForeignKey(
        ContractTemplate, 
        on_delete=models.SET_NULL,  
        null=True,             
        verbose_name="Modelo Utilizado"
    )
    service = models.ForeignKey(Service, on_delete=models.CASCADE, verbose_name="Serviço")

    signature_link_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)
    status = models.CharField(max_length=10, choices=ContractStatus.choices, default=ContractStatus.PENDING)
    signature_image = models.ImageField(upload_to='signatures/', null=True, blank=True, verbose_name="Imagem da Assinatura")
    signed_pdf_file = models.FileField(upload_to='signed_contracts/', null=True, blank=True, verbose_name="PDF Assinado")
    created_at = models.DateTimeField(auto_now_add=True)
    signed_at = models.DateTimeField(null=True, blank=True, verbose_name="Data da Assinatura")

    def __str__(self):
        return f"Contrato de {self.client.full_name} ({self.get_status_display()})"

    class Meta:
        verbose_name = "Contrato"
        verbose_name_plural = "Contratos"