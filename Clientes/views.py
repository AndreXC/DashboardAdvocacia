
import json
from django.shortcuts import render
from django.http import  JsonResponse
from django.views.decorators.http import require_http_methods
from django.shortcuts import render

from .models import  Service, Invoice, AreaDireito

from .api.PUT.updateCliente.update_cliente import updateCliente
from .api.GET.GetContractClientes.Get_Contracts import ApiContractCustomer
from .api.POST.CustomerService.service_create import CustomerService
from .api.GET.GetCliente.get_cliente import GetCliente
from .api.GET.GetClientes.get_clientes import GetClientes
from .api.POST.CustomerCreate.customer_create import createCliente


def customer_dashboard(request):
    direitos = AreaDireito.objects.all()
    return render(request, 'Clientes/Clientes.html', {'direitos': direitos})



@require_http_methods(["GET", "POST"])
def customer_list_create_api(request):
    match request.method:
        case "GET":
            instanceGetClientes:GetClientes = GetClientes()
            if not instanceGetClientes._GetClientes():
                return JsonResponse({'error': instanceGetClientes.strErr}, status=400)
            return JsonResponse({'clientes':instanceGetClientes.clientes}, status=200)
        case "POST":
            instanceCreateCliente:createCliente = createCliente(request)
            if not instanceCreateCliente._createCliente():
                return JsonResponse({'error': instanceCreateCliente.strErr}, status=400)
            return JsonResponse({'message': 'Cliente criado com sucesso'}, status=200)
        case _:
            return JsonResponse({'error': 'Método não permitido'}, status=405)  
        
     
@require_http_methods(["GET", "POST"])   
def customer_detail_api(request, pk):
    match request.method:
        case "GET":
            instanceCliente:GetCliente= GetCliente(costumer_id=pk)
            if not instanceCliente._GetCliente():
                return JsonResponse({'error': instanceCliente.strErr}, status=400)
            
            return JsonResponse(instanceCliente.cliente, status=200)
        case "PUT":
            instanceUpdateCliente:updateCliente = updateCliente(request, pk)
            if not instanceUpdateCliente._updateCliente():
                return JsonResponse({'error': instanceUpdateCliente.strErr}, status =400)
            return JsonResponse({'messagem': 'Cliente autalizado com sucesso'}, status=200)
        case _:
            return JsonResponse({'error': 'Método não permitido'}, status=405)
    

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
    if request.method != 'POST':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    InstanceCustomerService = CustomerService(customer_pk, request)
    if not  InstanceCustomerService._create_service():
        return JsonResponse({'error': InstanceCustomerService.StrErr, 'formError': InstanceCustomerService.validatorFormAddService}, status=400)
    return JsonResponse({'message': 'Serviço criado com sucesso.'}, status=201)


@require_http_methods(['GET'])
def contract_list_api(request, customer_id) -> JsonResponse:
    if request.method != 'GET':
        return JsonResponse({'error': 'Método não permitido'}, status=405)
    
    instanceApiContratoList = ApiContractCustomer(request=request, customer_id=customer_id)
    if not instanceApiContratoList._GetContractsCostumer():
        return JsonResponse({'error': str(instanceApiContratoList.StrErr)}, status=400)
    return JsonResponse(instanceApiContratoList.contratos, safe=False)
    
    