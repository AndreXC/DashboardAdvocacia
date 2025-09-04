
import json
from datetime import date, timedelta
from django.shortcuts import render
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from .models import Customer, Service, Invoice, AreaDireito, CategoriaServico
from ContractsClientes.models import Contract
from django.shortcuts import render, get_object_or_404
from django.urls import reverse
from django.conf import settings
import os
import uuid


# View para renderizar a página principal
def customer_dashboard(request):
    #categorias
    direitos = AreaDireito.objects.all()
    return render(request, 'Clientes/Clientes.html', {'direitos': direitos})

def contract_list_api(request, customer_id):
    # O get_object_or_404 está correto para garantir que o cliente exista.
    customer = get_object_or_404(Customer, id=customer_id)
    
    # Busca os contratos desse cliente usando a query otimizada que você sugeriu.
    contracts_list = Contract.objects.filter(
        client=customer
    ).select_related('client', 'template').order_by('-created_at')
    
    # 1. Preparamos uma lista vazia para armazenar os dados dos contratos.
    data = []

    # 2. Iteramos sobre a queryset de contratos.
    for contract in contracts_list:
         
        # signing_url = reverse('ContractsClientes:sign_contract', args=[contract.signature_link_id])
        signing_url = reverse('ContractsClientes:sign', args=[contract.signature_link_id])
        pdf_url = reverse('ContractsClientes:view_pdf', args=[contract.id])

        data.append({
            'id': contract.id,
            'template': contract.template.title if contract.template else 'Modelo Removido',
            'status': contract.get_status_display(),
            'statusCode': contract.status,           
            'signingUrl': request.build_absolute_uri(signing_url), # URL completa para assinar
            'pdfUrl': request.build_absolute_uri(pdf_url) if pdf_url else None, # URL completa do PDF
            'createdAt': contract.created_at.strftime('%d/%m/%Y'),
        })
    
    return JsonResponse(data, safe=False)


# @require_http_methods(["GET", "POST"])
# def customer_list_create_api(request):
#     if request.method == "GET":
#         customers = Customer.objects.all().order_by('first_name')
#         data = [{
#             'id': c.id,
#             'fullName': c.full_name,
#             'company': c.company,
#         } for c in customers]
#         return JsonResponse(data, safe=False)

#     elif request.method == "POST":
#         data = json.loads(request.body)
#         customer = Customer.objects.create(
#             first_name=data.get('firstName'),
#             last_name=data.get('lastName'),
#             email=data.get('email'),
#             phone=data.get('phone'),
#             address=data.get('address'),
#             company=data.get('company'),
#             position=data.get('position'),
#             photo_url=data.get('photoUrl') or 'https://via.placeholder.com/80'
#         )
#         return JsonResponse({'id': customer.id, 'fullName': customer.full_name, 'company': customer.company}, status=201)


@require_http_methods(["GET", "POST"])
def customer_list_create_api(request):
    if request.method == "GET":
        customers = Customer.objects.all().order_by('first_name')
        data = [{
            'id': c.id,
            'fullName': c.full_name,
            'company': c.company,
            'image_url': c.photo_url
        } for c in customers]
        return JsonResponse(data, safe=False)

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
                'nomeServico': service.nome_servico,
                'status': service.status,
                'totalValue': service.total_value,
                'invoices': invoices_data,
                'protocolo': service.protocolo,
                'areaDireito': service.area_direito.nome
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

# @require_http_methods(["POST"])
# def service_create_api(request, customer_pk):
#     try:
#         customer = Customer.objects.get(pk=customer_pk)
#         data = json.loads(request.body)
        
#         service = Service.objects.create(
#             customer=customer,
#             name=data.get('name'),
#             protocolo=data.get('protocolo'),
#             area_direito=data.get('area_direito'),
#             total_value=data.get('totalValue')
#         )

#         # Lógica de criação de faturas movida para o backend
#         first_due_date = date.fromisoformat(data.get('firstPaymentDate'))
        
#         if data.get('paymentType') == 'avista':
#             Invoice.objects.create(
#                 service=service,
#                 description='Pagamento Único',
#                 due_date=first_due_date,
#                 value=service.total_value,
#                 status=Invoice.StatusChoices.PENDING
#             )
#         else: # Parcelado
#             installments = int(data.get('installments'))
#             # A lógica de juros e valor da entrada pode ser adicionada aqui
#             # Simplificando para parcelas iguais por enquanto
#             installment_value = service.total_value / installments
#             for i in range(installments):
#                 due_date = first_due_date + timedelta(days=30 * i)
#                 Invoice.objects.create(
#                     service=service,
#                     description=f"Parcela {i+1}/{installments}",
#                     due_date=due_date,
#                     value=installment_value,
#                     status=Invoice.StatusChoices.PENDING
#                 )
        
#         return JsonResponse({'message': 'Serviço adicionado com sucesso'}, status=201)
        
#     except Customer.DoesNotExist:
#         return JsonResponse({'error': 'Cliente não encontrado'}, status=404)


# @require_http_methods(["POST"])
# def service_create_api(request, customer_pk):
#     try:
#         customer = Customer.objects.get(pk=customer_pk)
#         data = json.loads(request.body)
        
#         service = Service.objects.create(
#             customer=customer,
#             name=data.get('name'),
#             protocolo=data.get('protocolo'),
#             area_direito=data.get('area_direito'),
#             # Corrigido: usando a chave 'totalValue' do frontend
#             total_value=data.get('totalValue') 
#         )

#         # Corrigido: usando a chave 'firstPaymentDate' do frontend
#         first_due_date = date.fromisoformat(data.get('firstPaymentDate'))
        
#         if data.get('paymentType') == 'avista':
#             Invoice.objects.create(
#                 service=service,
#                 description='Pagamento Único',
#                 due_date=first_due_date,
#                 value=service.total_value,
#                 status=Invoice.StatusChoices.PENDING
#             )
#         else: # Parcelado
#             # Corrigido: usando a chave 'installments' do frontend
#             installments = int(data.get('installments')) 
#             installment_value = service.total_value / installments
#             for i in range(installments):
#                 due_date = first_due_date + timedelta(days=30 * i)
#                 Invoice.objects.create(
#                     service=service,
#                     description=f"Parcela {i+1}/{installments}",
#                     due_date=due_date,
#                     value=installment_value,
#                     status=Invoice.StatusChoices.PENDING
#                 )
        
#         return JsonResponse({'message': 'Serviço adicionado com sucesso'}, status=201)
        
#     except Customer.DoesNotExist:
#         return JsonResponse({'error': 'Cliente não encontrado'}, status=404)
#     except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
#         return JsonResponse({'error': f'Dados inválidos: {e}'}, status=400)

@require_http_methods(["POST"])
def service_create_api(request, customer_pk):
    try:
        # 1. Busca a instância do cliente
        customer = Customer.objects.get(pk=customer_pk)
        
        # 2. Carrega os dados JSON da requisição
        data = json.loads(request.body)
        
        # 3. Processa a Área do Direito
        area_direito_id = data.get('area_direito')
        area_direito_instance = None 

        if area_direito_id:
            try:
                # Busca a instância da Área do Direito com base no ID
                area_direito_instance = AreaDireito.objects.get(pk=area_direito_id)
            except AreaDireito.DoesNotExist:
                return JsonResponse({'error': 'Área de Direito não encontrada.'}, status=404)
        
        # 4. Cria a instância do Serviço, passando a instância da Área do Direito
        service = Service.objects.create(
            customer=customer,
            nome_servico=data.get('name'),
            protocolo=data.get('protocolo'),
            area_direito=area_direito_instance,
            total_value=data.get('totalValue')
        )

        # 5. Lógica para criar as faturas (invoices)
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
        
        return JsonResponse({'message': 'Serviço adicionado com sucesso.'}, status=201)
        
    except Customer.DoesNotExist:
        return JsonResponse({'error': 'Cliente não encontrado.'}, status=404)
    except (json.JSONDecodeError, KeyError, TypeError, ValueError) as e:
        # Captura erros de formato de dados e campos ausentes
        return JsonResponse({'error': f'Dados inválidos: {e}'}, status=400)
    except Exception as e:
        return JsonResponse({'error': f'Erro interno: {e}'}, status=500)

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