
import json
from django.http import JsonResponse
from django.views import View
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from ....models import Customer 


@method_decorator(csrf_exempt, name='dispatch')
class CustomerDetailAPI(View):
    """
    API para gerenciar os detalhes de um cliente específico (GET, PUT, DELETE).
    """
    
    ALLOWED_UPDATE_FIELDS = {
        'first_name', 'last_name', 'email', 'phone', 
        'address', 'company', 'position', 'photo_url'
    }

    def dispatch(self, request, *args, **kwargs):
        """
        Este método é executado antes de qualquer outro (get, put, etc.).
        Ideal para buscar o objeto e tratar exceções comuns.
        """
        try:
            self.customer = Customer.objects.prefetch_related(
                'services__invoices', 
                'services__area_direito'
            ).get(pk=kwargs.get('pk'))
        except Customer.DoesNotExist:
            return JsonResponse({'error': 'Cliente não encontrado'}, status=404)
        
        return super().dispatch(request, *args, **kwargs)

    def get(self, request, *args, **kwargs):
        """
        Retorna os detalhes completos de um cliente.
        """
        services_data = []
        for service in self.customer.services.all():
            invoices_data = [{
                'id': i.id,
                'description': i.description,
                'dueDate': i.due_date,
                'value': i.value,
                'status': i.status,
            } for i in service.invoices.all().order_by('due_date')]
            
            services_data.append({
                'id': service.id,
                'nomeServico': service.nome_servico,
                'status': service.status,
                'totalValue': service.total_value,
                'invoices': invoices_data,
                'protocolo': service.protocolo,
                'areaDireito': service.area_direito.nome
            })

        data = {
            'id': self.customer.id,
            'firstName': self.customer.first_name,
            'lastName': self.customer.last_name,
            'email': self.customer.email,
            'phone': self.customer.phone,
            'address': self.customer.address,
            'company': self.customer.company,
            'position': self.customer.position,
            'photoUrl': self.customer.photo_url,
            'services': services_data
        }
        
        return JsonResponse(data)

    def put(self, request, *args, **kwargs):
        """
        Atualiza os dados de um cliente existente.
        """
        try:
            data = json.loads(request.body)
        except json.JSONDecodeError:
            return JsonResponse({'error': 'JSON inválido'}, status=400)

        for key, value in data.items():
            if key in self.ALLOWED_UPDATE_FIELDS:
                setattr(self.customer, key, value)
        
        self.customer.save()
        return JsonResponse({'message': 'Cliente atualizado com sucesso'})

    def delete(self, request, *args, **kwargs):
        """
        Exclui um cliente.
        """
        self.customer.delete()
        return JsonResponse({}, status=204)