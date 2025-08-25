from django.db import models


class ContractTemplate(models.Model):
    title = models.CharField(max_length=200, verbose_name="Título do Modelo")
    content_html = models.TextField(
        verbose_name="Conteúdo (HTML)",
        help_text="Use variáveis como {{nome_cliente}}, {{email_cliente}}, {{cpf_cliente}}, {{data_assinatura}}."
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.title

    class Meta:
        verbose_name = "Modelo de Contrato"
        verbose_name_plural = "Modelos de Contratos"