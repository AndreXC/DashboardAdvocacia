from django.db import models
from django.utils import timezone



class Customer(models.Model):
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    cpf = models.CharField(max_length=14, unique=True, verbose_name="CPF", default='')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=255, blank=True, null=True)
    company = models.CharField(max_length=100, blank=True, null=True)
    position = models.CharField(max_length=100, blank=True, null=True)
    photo_url = models.URLField(max_length=500, blank=True, null=True, default='https://cdn-icons-png.flaticon.com/512/149/149071.png')
    created_at = models.DateTimeField(default=timezone.now) 
    
    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

class AreaDireito(models.Model):
    id = models.AutoField(primary_key=True, unique=True)
    nome = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Área do Direito"
    )

    def __str__(self):
        return self.nome
    
    

class Service(models.Model):
    class StatusChoices(models.TextChoices):
        ACTIVE = 'Ativo', 'Ativo'
        FINISHED = 'Finalizado', 'Finalizado'
        CANCELED = 'Cancelado', 'Cancelado'

    customer = models.ForeignKey(Customer, on_delete=models.CASCADE, related_name='services')
    nome_servico = models.CharField(max_length=200)
    protocolo = models.CharField(max_length=100, unique=True, default='')
   
    # category = models.ForeignKey(CategoriaServico, on_delete=models.SET_NULL, null=True, blank=True)
    area_direito = models.ForeignKey(AreaDireito, on_delete=models.SET_NULL, null=True, blank=True)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.ACTIVE)
    total_value = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        # A nova lógica para exibir o protocolo no dropdown
        return f"Protocolo: {self.protocolo} - {self.nome_servico}"

    class Meta:
        # Ordene por protocolo para facilitar a busca visual
        ordering = ['protocolo']

class Invoice(models.Model):
    class StatusChoices(models.TextChoices):
        PENDING = 'pendente', 'Pendente'
        PAID = 'pago', 'Pago'
        OVERDUE = 'vencido', 'Vencido'

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='invoices')
    description = models.CharField(max_length=255)
    due_date = models.DateField()
    value = models.DecimalField(max_digits=10, decimal_places=2)
    status = models.CharField(max_length=20, choices=StatusChoices.choices, default=StatusChoices.PENDING)

    def __str__(self):
        return f"Fatura para {self.service.customer.full_name} - {self.description}"
    
    

class CategoriaServico(models.Model):
    nome = models.CharField(
        max_length=100,
        unique=True,
        verbose_name="Categoria do Serviço"
    )

    def __str__(self):
        return self.nome
