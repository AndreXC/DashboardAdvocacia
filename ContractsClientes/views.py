import base64
from django.shortcuts import render, redirect, get_object_or_404
from django.http import HttpResponse
from django.template.loader import render_to_string
from django.utils import timezone
from django.core.files.base import ContentFile

from .models import Contract
from .forms import CreateContractForm
from pathlib import Path 
from django.http import JsonResponse, HttpResponseBadRequest
import base64
import io
from django.template import Context, Template
from xhtml2pdf import pisa                    
from django.http import JsonResponse
from Clientes.models import Service, Customer
import json

from .utils.ReplaceContractClient.replace_contract_client import ContractExtractor



def contract_list(request):
    contracts = Contract.objects.all().select_related('client', 'template').order_by('-created_at')
    form = CreateContractForm()
    return render(request, 'ContractsClientes/ContratoClientes.html', {'contracts': contracts, 'form': form})


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
    instanceContrato:ContractExtractor = ContractExtractor(signature_link_id= signature_link_id) 
    
    if not instanceContrato.get_corrected_contract():
        if instanceContrato.status == 'SIGNED':
            return redirect('ContractsClientes:signing_complete')
        return JsonResponse({'error': instanceContrato.strErr}, status=400)
        
             
    Model_html_pdf = render_to_string('ContractsClientes/pdf_template_render.html', {
        'title': instanceContrato.title,
        'content': instanceContrato.ConteudoContrato,
    })
    
    pdf_buffer = io.BytesIO()
    pisa_status = pisa.CreatePDF(
        Model_html_pdf, 
        dest=pdf_buffer)

    if pisa_status.err:
        return render(request, 'ContractsClientes/pdf_error.html', {'error': 'Erro ao gerar o PDF.'})

    pdf_data_binary = pdf_buffer.getvalue()

    pdf_base64 = base64.b64encode(pdf_data_binary).decode('utf-8')

    return render(request, 'ContractsClientes/sign_contract.html', {
        'pdf_data_base64': pdf_base64,
        'document_name': f"Contrato - {instanceContrato.clienteFullname}.pdf", 
        'title': instanceContrato.title,
        'signature_link_id' : signature_link_id
    })
    
    
def save_contract(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)

            id_contrato = data.get('idcontrato')
            assinatura_base64 = data.get('signature', '')
            assinatura_foto_base64 = data.get('real_photo_base64', '')
            
            if not id_contrato:
                return JsonResponse({'error': 'ID do contrato não fornecido.'}, status=400)

            if not assinatura_base64:
                return JsonResponse({'error': 'Assinatura digital não fornecido.'}, status=400)
                 
            instanceContrato:ContractExtractor = ContractExtractor(signature_link_id= id_contrato) 
           
            if not instanceContrato._save_assinatura_digital(assinatura_base64):         
                return JsonResponse({'error': instanceContrato.strErr}, status=400)
            
    
            # if assinatura_foto_base64:
            #     photo_data_url = f"data:image/png;base64,{assinatura_foto_base64}"
            
            
            
            if not instanceContrato._generate_payload():
                return JsonResponse({'error': instanceContrato.strErr}, status=400)
            
            1
            corpoHtmlpdfCompleto = render_to_string('ContractsClientes/pdf_template_completo.html', instanceContrato.payload_contrato)
            
            if not (instanceContrato._savePdfContractAndFinish(corpoHtmlpdfCompleto)):
                return JsonResponse({'error': instanceContrato.strErr}, status=400)


            return redirect('ContractsClientes:signing_complete')

             
        except Exception as e:
            return JsonResponse({'error': 'Ocorreu um erro interno ao processar sua assinatura: erro ->' + e}, status=500)
    
    return JsonResponse({'error': 'Operação invalida'}, status=405)
        


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
    try:
        customer = Customer.objects.get(pk=client_id)
        
        active_services = Service.objects.filter(
            customer=customer, 
            status=Service.StatusChoices.ACTIVE
        ).values('id', 'protocolo', 'nome_servico').order_by('protocolo')

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