# resources/templatetags/active_link.py
from django import template

register = template.Library()

@register.simple_tag(takes_context=True)
def active_link(context, *url_names_with_namespace):
    """
    Verifica se a URL atual corresponde a qualquer um dos nomes de URL fornecidos.
    Aceita múltiplos nomes de URL como argumentos.
    Uso no template: {% active_link 'namespace:url_name' 'outro_ns:outra_url' %}
    """
    request = context.get("request")
    if not request:
        return ""

    resolver_match = request.resolver_match
    if not resolver_match:
        return ""

    # Recupera namespace e url_name atuais
    current_namespace = resolver_match.namespace
    current_url_name = resolver_match.url_name

    # Itera sobre todos os nomes de URL passados para a tag
    for url_name_with_namespace in url_names_with_namespace:
        # Se o parâmetro contém namespace, separa
        if ":" in url_name_with_namespace:
            ns, name = url_name_with_namespace.split(":", 1)
        else:
            ns, name = None, url_name_with_namespace

        # Verifica se bate com o namespace e url_name atuais
        # Se encontrar uma correspondência, retorna 'active' imediatamente
        if current_url_name == name and (ns == current_namespace or ns is None):
            return "active"
            
    # Se o loop terminar sem nenhuma correspondência, retorna uma string vazia
    return ""