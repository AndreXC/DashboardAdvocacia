
import json
from datetime import date, timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Customer, Service, Invoice, AreaDireito, CategoriaServico


# View para renderizar a página principal
def customer_dashboard(request):
    #categorias
    direitos = AreaDireito.objects.all()
    return render(request, 'Clientes/Clientes.html', {'direitos': direitos})


@require_http_methods(["GET", "POST"])
def customer_list_create_api(request):
    if request.method == "GET":
        customers = Customer.objects.all().order_by('first_name')
        data = [{
            'id': c.id,
            'fullName': c.full_name,
            'company': c.company,
        } for c in customers]
        return JsonResponse(data, safe=False)

    elif request.method == "POST":
        data = json.loads(request.body)
        customer = Customer.objects.create(
            first_name=data.get('firstName'),
            last_name=data.get('lastName'),
            email=data.get('email'),
            phone=data.get('phone'),
            address=data.get('address'),
            company=data.get('company'),
            position=data.get('position'),
            photo_url=data.get('photoUrl') or 'https://via.placeholder.com/80'
        )
        return JsonResponse({'id': customer.id, 'fullName': customer.full_name, 'company': customer.company}, status=201)

@require_http_methods(["GET", "PUT", "DELETE"])
def customer_detail_api(request, pk):
    try:
        customer = Customer.objects.get(pk=pk)
    except Customer.DoesNotExist:
        return JsonResponse({'error': 'Cliente não encontrado'}, status=404)

    if request.method == "GET":
        services_data = []
        for service in customer.services.all():
            invoices_data = [{
                'id': i.id,
                'description': i.description,
                'dueDate': i.due_date,
                'value': i.value,
                'status': i.status,
            } for i in service.invoices.all().order_by('due_date')]
            
            services_data.append({
                'id': service.id,
                'name': service.name,
                'status': service.status,
                'totalValue': service.total_value,
                'invoices': invoices_data
            })

        data = {
            'id': customer.id,
            'firstName': customer.first_name,
            'lastName': customer.last_name,
            'email': customer.email,
            'phone': customer.phone,
            'address': customer.address,
            'company': customer.company,
            'position': customer.position,
            'photoUrl': customer.photo_url,
            'services': services_data
        }
        return JsonResponse(data)

    elif request.method == "PUT":
        data = json.loads(request.body)
        # Atualiza os campos do cliente
        for key, value in data.items():
            setattr(customer, key, value)
        customer.save()
        return JsonResponse({'message': 'Cliente atualizado com sucesso'})

    elif request.method == "DELETE":
        customer.delete()
        return JsonResponse({}, status=204) # 204 No Content

@require_http_methods(["POST"])
def service_create_api(request, customer_pk):
    try:
        customer = Customer.objects.get(pk=customer_pk)
        data = json.loads(request.body)
        
        service = Service.objects.create(
            customer=customer,
            name=data.get('name'),
            total_value=data.get('totalValue')
        )

        # Lógica de criação de faturas movida para o backend
        first_due_date = date.fromisoformat(data.get('firstPaymentDate'))
        
        if data.get('paymentType') == 'avista':
            Invoice.objects.create(
                service=service,
                description='Pagamento Único',
                due_date=first_due_date,
                value=service.total_value,
                status=Invoice.StatusChoices.PENDING
            )
        else: # Parcelado
            installments = int(data.get('installments'))
            # A lógica de juros e valor da entrada pode ser adicionada aqui
            # Simplificando para parcelas iguais por enquanto
            installment_value = service.total_value / installments
            for i in range(installments):
                due_date = first_due_date + timedelta(days=30 * i)
                Invoice.objects.create(
                    service=service,
                    description=f"Parcela {i+1}/{installments}",
                    due_date=due_date,
                    value=installment_value,
                    status=Invoice.StatusChoices.PENDING
                )
        
        return JsonResponse({'message': 'Serviço adicionado com sucesso'}, status=201)
        
    except Customer.DoesNotExist:
        return JsonResponse({'error': 'Cliente não encontrado'}, status=404)

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