import json
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from Clientes.models import Service


class ServiceStatusUpdate:
    def __init__(self, request, pk):
        self.request = request
        self.pk = pk

    @require_http_methods(["PUT"])
    def service_detail_api(self):
        data = json.loads(self.request.body)
        try:
            service = Service.objects.get(pk=self.pk)
            service.status = data.get('status')
            service.save()
            return JsonResponse({'status': service.status})
        except Service.DoesNotExist:
            return JsonResponse({'error': 'Serviço não encontrado'}, status=404)