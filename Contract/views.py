# from django.shortcuts import render, redirect, get_object_or_404
# from .models import ContractTemplate
from .forms import ContractTemplateForm
import json
from django.shortcuts import render, get_object_or_404, redirect
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt # Usaremos para a API
from django.forms.models import model_to_dict

from .models import ContractTemplate



def template_list(request):
    templates = ContractTemplate.objects.all().order_by('-id')
    return render(request, 'Contract/Contratos.html', {'templates': templates})




def create_template(request):
    form = ContractTemplateForm()
    contract = None
    contract_json = 'null' # Default para um novo contrato
    
    context = {
        'contract': contract,
        'contract_json': contract_json, # Passa os dados como JSON para o JavaScript
    }
    return render(request, 'Contract/FormContrato.html', context)


# seu_app/views.py

# View para CARREGAR a página do editor
def contract_editor_view(request, pk=None):
    contract = None
    contract_json = 'null' # Default para um novo contrato
    
    if pk:
        # Se um 'pk' (ID) for fornecido, estamos editando um contrato existente
        contract = get_object_or_404(ContractTemplate, pk=pk)
        # Converte o objeto do modelo para um dicionário e depois para JSON
        contract_data = model_to_dict(contract)
        contract_json = json.dumps(contract_data)

    context = {
        'contract': contract,
        'contract_json': contract_json, # Passa os dados como JSON para o JavaScript
    }
    return render(request, 'Contract/FormContrato.html', context) # Troque pelo caminho do seu template

# View da API para SALVAR o contrato
@csrf_exempt # Simplificando a proteção CSRF para a API
def save_contract_api(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            contract_id = data.get('id')
            title = data.get('title')
            # O conteúdo agora é um JSON stringificado do array 'pages'
            content_html_json = data.get('content_html')

            if not title:
                return JsonResponse({'status': 'error', 'message': 'O título é obrigatório.'}, status=400)

            if contract_id:
                # Atualiza um contrato existente
                contract = get_object_or_404(ContractTemplate, pk=contract_id)
                contract.title = title
                contract.content_html = content_html_json
                contract.save()
                message = 'Contrato atualizado com sucesso!'
            else:
                # Cria um novo contrato
                contract = ContractTemplate.objects.create(
                    title=title,
                    content_html=content_html_json
                )
                message = 'Contrato salvo com sucesso!'
            
            return JsonResponse({
                'status': 'success',
                'message': message,
                'contract_id': contract.id # Retorna o ID para o frontend
            })

        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)}, status=500)

    return JsonResponse({'status': 'error', 'message': 'Método inválido.'}, status=405)

# def create_template(request):
#     form = ContractTemplateForm()
#     return render(request, 'Contract/FormContrato.html', {'form': form})

# # Nova view para editar um modelo
def edit_template(request, pk):
    template = get_object_or_404(ContractTemplate, pk=pk)
    if request.method == 'POST':
        form = ContractTemplateForm(request.POST, instance=template)
        if form.is_valid():
            form.save()
            return redirect('Contract:list')
    else:
        form = ContractTemplateForm(instance=template)
    return render(request, 'Contract/FormContrato.html', {'form': form})

# Nova view para excluir um modelo
def delete_template(request, pk):
    template = get_object_or_404(ContractTemplate, pk=pk)
    if request.method == 'POST':
        template.delete()
        return redirect('Contract:list')
    # Use um template de confirmação para evitar exclusões acidentais
    return render(request, 'Contract/template_confirm_delete.html', {'template': template})