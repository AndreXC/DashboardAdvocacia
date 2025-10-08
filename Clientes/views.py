
import json
from datetime import date, timedelta
from django.shortcuts import render
from django.http import HttpRequest, JsonResponse
from django.views.decorators.http import require_http_methods

from .api.PUT.updateCliente.update_cliente import updateCliente

from .api.GET.GetContractClientes.Get_Contracts import ApiContractCustomer
from .models import Customer, Service, Invoice, AreaDireito, CategoriaServico
from ContractsClientes.models import Contract
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.conf import settings
import os
import uuid
from .api.POST.CustomerService.service_create import CustomerService
from api.GET.GetClientes.get_clientes import GetClientes


def customer_dashboard(request):
    direitos = AreaDireito.objects.all()
    return render(request, 'Clientes/Clientes.html', {'direitos': direitos})



@require_http_methods(["GET", "POST"])
def customer_list_create_api(request):
    if request.method == "GET":
        customers = Customer.objects.all().order_by('first_name')
        clientes_lista = []
        
        for c in customers:
            clientes_lista.append({
            'id': c.id,
            'fullName': c.full_name,
            'company': c.company,
            'image_url': c.photo_url,
            'cpf': c.cpf,
        })
        
        return JsonResponse(clientes_lista, safe=False)

    elif request.method == "POST":
        data = request.POST
        photo_file = request.FILES.get('photoUpload')
        
        image_url_to_save = 'https://via.placeholder.com/80' # URL Padrão

        # --- NOVA LÓGICA PARA SALVAR A IMAGEM ---
        if photo_file:
            try:
                # 1. Gerar um nome de arquivo único para evitar colisões
                file_extension = os.path.splitext(photo_file.name)[1]
                unique_filename = f"{uuid.uuid4()}{file_extension}"

                # 2. Definir o caminho completo para salvar o arquivo
                # Assumindo que você tem uma pasta 'static' na raiz do projeto
                save_path_dir = os.path.join(settings.BASE_DIR, 'static', 'imgusers')
                
                # Cria o diretório se ele não existir
                os.makedirs(save_path_dir, exist_ok=True)
                
                file_path = os.path.join(save_path_dir, unique_filename)

                # 3. Salvar o arquivo no disco
                with open(file_path, 'wb+') as destination:
                    for chunk in photo_file.chunks():
                        destination.write(chunk)

                # 4. Construir a URL para salvar no banco de dados
                image_url_to_save = f"{settings.STATIC_URL}imgusers/{unique_filename}"

            except Exception as e:
                # Se algo der errado no salvamento do arquivo, retorna um erro
                return JsonResponse({'error': f'Erro ao salvar a imagem: {str(e)}'}, status=500)

        # --- CRIAÇÃO DO CLIENTE NO BANCO DE DADOS ---
        try:
            customer = Customer.objects.create(
                first_name=data.get('firstName'),
                last_name=data.get('lastName'),
                email=data.get('email'),
                phone=data.get('phone'),
                address=data.get('address'),
                company=data.get('company'),
                position=data.get('position'),
                photo_url=image_url_to_save  # Salva a URL gerada
            )
            
            response_data = {
                'id': customer.id,
                'fullName': customer.full_name,
                'company': customer.company,
                'photoUrl': customer.photo_url # Retorna a URL salva
            }
            return JsonResponse(response_data, status=201)

        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
        
        
        
def customer_detail_api(request, pk):
    match request.method:
        case "GET":
            instanceCliente:GetClientes= GetClientes(costumer_id=pk)
            if not instanceCliente._GetCliente():
                return JsonResponse({'error': instanceCliente.strErr}, status=400)
            
            return JsonResponse(instanceCliente.cliente, status=200)
        case "PUT":
            instanceUpdateCliente:updateCliente = updateCliente(request, pk)
            if not instanceUpdateCliente._updateCliente():
                return JsonResponse({'error': instanceUpdateCliente.strErr}, status =400)
            return JsonResponse({'messagem': 'Cliente autalizado com sucesso'}, status=200)
        
            
    

@require_http_methods(["PUT"])
def service_detail_api(request, pk):
    data = json.loads(request.body)
    try:
        service = Service.objects.get(pk=pk)
        service.status = data.get('status')
        service.save()
        return JsonResponse({'status': service.status})
    except Service.DoesNotExist:
        return JsonResponse({'error': 'Serviço não encontrado'}, status=404)

@require_http_methods(["PUT"])
def invoice_detail_api(request, pk):
    data = json.loads(request.body)
    try:
        invoice = Invoice.objects.get(pk=pk)
        invoice.status = data.get('status')
        invoice.save()
        return JsonResponse({'status': invoice.status})
    except Invoice.DoesNotExist:
        return JsonResponse({'error': 'Fatura não encontrada'}, status=404)
    
    
    
@require_http_methods(["POST"])
def service_create_api(request, customer_pk: int) -> JsonResponse:
    InstanceCustomerService = CustomerService(customer_pk, request)
    if not  InstanceCustomerService._create_service():
        return JsonResponse({'error': InstanceCustomerService.StrErr, 'formError': InstanceCustomerService.validatorFormAddService}, status=400)
    return JsonResponse({'message': 'Serviço criado com sucesso.'}, status=201)


@require_http_methods(['GET'])
def contract_list_api(request, customer_id) -> JsonResponse:
    instanceApiContratoList = ApiContractCustomer(request=request, customer_id=customer_id)
    if not instanceApiContratoList._GetContractsCostumer():
        return JsonResponse({'error': str(instanceApiContratoList.StrErr)}, status=400)
    return JsonResponse(instanceApiContratoList.contratos, safe=False)
    
    