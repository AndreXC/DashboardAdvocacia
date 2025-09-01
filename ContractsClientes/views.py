import base64
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.files.base import ContentFile
# from weasyprint import HTML
from .models import Contract
from .forms import CreateContractForm
from pathlib import Path 
from django.http import JsonResponse
import base64
import io
from django.template import Context, Template
from xhtml2pdf import pisa                    
from django.http import JsonResponse
from Clientes.models import Service, Customer
import json



def contract_list(request):
    contracts = Contract.objects.all().select_related('client', 'template').order_by('-created_at')
    form = CreateContractForm()
    return render(request, 'ContractsClientes/ContratoClientes.html', {'contracts': contracts, 'form': form})

# def create_contract(request):
#     if request.method == 'POST':
#         form = CreateContractForm(request.POST)
#         if form.is_valid():
#             form.save()
#             return redirect('ContractsClientes:list')
#     else:
#         form = CreateContractForm()
#     return render(request, 'ContractsClientes/create_contract_form.html', {'form': form})


def create_contract(request):
    if request.method == 'POST':
        
        data= request.POST if request.POST else json.loads(request.body) 
        form = CreateContractForm(data)

        if form.is_valid():
            form.save()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({'success': False, 'errors': form.errors.get_json_data()}, status=400)
       

def sign_contract(request, signature_link_id):
    contract = get_object_or_404(Contract, signature_link_id=signature_link_id)

    if contract.status == 'SIGNED':
        return redirect('ContractsClientes:signing_complete')
    
    # Usando a data atual formatada.
    # A data de hoje é 31 de Agosto de 2025.
    today = timezone.localdate().strftime('%d de %B de %Y')

    # --- MELHORIA SUGERIDA: Usando o motor de templates do Django ---
    # Em vez de usar .replace(), criamos um template a partir do conteúdo HTML do banco de dados
    # e o renderizamos com um contexto. É mais seguro e flexível.
    template_engine = Template(contract.template.content_html)
    context = Context({
        'nome_cliente': contract.client.full_name,
        'email_cliente': contract.client.email,
        'cpf_cliente': str(contract.client.cpf),
        'data_assinatura': today,
    })
    content_with_data = template_engine.render(context)
    # ---------------------------------------------------------------

    if request.method == 'POST':
        signature_data_url = request.POST.get('signature')
        
        if signature_data_url and 'data:image' in signature_data_url:
            format, imgstr = signature_data_url.split(';base64,')
            ext = format.split('/')[-1]
            data = ContentFile(base64.b64decode(imgstr), name=f'{contract.id}.{ext}')
            contract.signature_image.save(f'signature_{contract.id}.{ext}', data, save=True)

        # A lógica para obter a URI da imagem permanece a mesma.
        # xhtml2pdf também funciona bem com URIs de arquivos locais.
        signature_filesystem_path = contract.signature_image.path
        signature_uri = Path(signature_filesystem_path).as_uri()

        # Renderizamos o template final que irá para o PDF
        html_string = render_to_string('ContractsClientes/pdf_template.html', {
            'content': content_with_data,
            'signature_uri': signature_uri,
            'client_name': contract.client.full_name,
            'client_cpf': contract.client.cpf,
            'protocol_number': contract.service.protocolo,
            'signed_date': today,
        })
        
        # --- TROCA DA GERAÇÃO DE PDF: DE WEASYPRINT PARA XHTML2PDF ---
        # 1. Criamos um buffer em memória para receber os bytes do PDF
        pdf_buffer = io.BytesIO()

        # 2. Chamamos a função do pisa para criar o PDF
        pisa_status = pisa.CreatePDF(
            html_string,       # O HTML que queremos converter
            dest=pdf_buffer)   # Onde o PDF será escrito (no nosso buffer)

        # 3. Verificamos se houve algum erro na criação
        if pisa_status.err:
            # Você pode tratar o erro de forma mais robusta aqui
            return render(request, 'error_page.html', {'error': 'Erro ao gerar o PDF.'})

        # 4. Pegamos o conteúdo do buffer
        pdf_file_bytes = pdf_buffer.getvalue()
        pdf_buffer.close()
        # ---------------------------------------------------------------

        # A lógica para salvar o PDF no modelo continua a mesma
        contract.signed_pdf_file.save(f'contract_{contract.id}.pdf', ContentFile(pdf_file_bytes), save=True)

        contract.status = 'SIGNED'
        contract.signed_at = timezone.now()
        contract.save()

        return redirect('ContractsClientes:signing_complete')

    return render(request, 'ContractsClientes/sign_contract.html', {
        'contract_content': content_with_data,
        'contract': contract
    })


# def sign_contract(request, signature_link_id):
#     contract = get_object_or_404(Contract, signature_link_id=signature_link_id)

#     if contract.status == 'SIGNED':
#         return redirect('ContractsClientes:signing_complete')

#     # Usando a data atual com fuso horário para ser mais preciso
#     today = timezone.localdate().strftime('%d/%m/%Y')
#     content_with_data = contract.template.content_html.replace('{{nome_cliente}}', contract.client.full_name)
#     content_with_data = content_with_data.replace('{{email_cliente}}', contract.client.email)
#     content_with_data = content_with_data.replace('{{cpf_cliente}}', str(contract.client.cpf))
#     content_with_data = content_with_data.replace('{{data_assinatura}}', today)

#     if request.method == 'POST':
#         signature_data_url = request.POST.get('signature')
        
#         if signature_data_url and 'data:image' in signature_data_url:
#             format, imgstr = signature_data_url.split(';base64,')
#             ext = format.split('/')[-1]
#             data = ContentFile(base64.b64decode(imgstr), name=f'{contract.id}.{ext}')
#             contract.signature_image.save(f'signature_{contract.id}.{ext}', data, save=True)

#         # --- A MÁGICA ACONTECE AQUI ---
#         # 1. Pegamos o caminho absoluto do arquivo no disco
#         signature_filesystem_path = contract.signature_image.path
        
#         # 2. Convertemos o caminho do sistema operacional em uma URI padronizada (file:///...)
#         signature_uri = Path(signature_filesystem_path).as_uri()


#         html_string = render_to_string('ContractsClientes/pdf_template.html', {
#             'content': content_with_data,
#             'signature_uri': signature_uri, # Passamos a URI para o template
#             'client_name': contract.client.full_name,
#             'client_cpf': contract.client.cpf,
#             'signed_date': today,
#         })
        
#         base_url = Path(__file__).resolve().parent
#         html = HTML(string=html_string, base_url=str(base_url))
#         pdf_file = html.write_pdf()

#         contract.signed_pdf_file.save(f'contract_{contract.id}.pdf', ContentFile(pdf_file), save=True)

#         contract.status = 'SIGNED'
#         contract.signed_at = timezone.now()
#         contract.save()

#         return redirect('ContractsClientes:signing_complete')


#     print("Content with data:", content_with_data)  # Debugging line
#     print("Contract ID:") 
#     return render(request, 'ContractsClientes/sign_contract.html', {
#         'contract_content': content_with_data,
#         'contract': contract
#     })





def signing_complete(request):
    return render(request, 'ContractsClientes/signing_complete.html')

def view_signed_pdf(request, contract_id):
    contract = get_object_or_404(Contract, id=contract_id)
    if not contract.signed_pdf_file:
        return HttpResponse("Este contrato ainda não foi assinado ou o PDF não foi gerado.", status=404)
    
    try:
        return HttpResponse(contract.signed_pdf_file.read(), content_type='application/pdf')
    except FileNotFoundError:
        return HttpResponse("Arquivo PDF não encontrado.", status=404)
    
    


def get_services_by_client(request, client_id):
    """
    Retorna uma lista de serviços ativos de um cliente específico.
    """
    try:
        # Garante que o cliente existe
        customer = Customer.objects.get(pk=client_id)
        
        # Filtra os serviços com base no cliente e no status 'Ativo'
        active_services = Service.objects.filter(
            customer=customer, 
            status=Service.StatusChoices.ACTIVE
        ).values('id', 'protocolo', 'nome_servico').order_by('protocolo')

        # Formata a lista para o formato JSON
        services_list = []
        for service in active_services:
            services_list.append({
                'id': service['id'],
                'text': f"Protocolo: {service['protocolo']} - {service['nome_servico']}"
            })
        
        return JsonResponse({'services': services_list})

    except Customer.DoesNotExist:
        return JsonResponse({'services': []}, status=404)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)