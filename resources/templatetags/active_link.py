# resources/templatetags/active_link.py
from django import template

register = template.Library()

@register.simple_tag(takes_context=True)
def active_link(context, url_name_with_namespace):
  
    request = context.get("request")
    if not request:
        return ""

    resolver_match = request.resolver_match
    if not resolver_match:
        return ""

    # Recupera namespace e url_name atuais
    current_namespace = resolver_match.namespace
    current_url_name = resolver_match.url_name

    # Se o parâmetro contém namespace, separa
    if ":" in url_name_with_namespace:
        ns, name = url_name_with_namespace.split(":", 1)
    else:
        ns, name = None, url_name_with_namespace

    # Verifica se bate com o namespace e url_name atuais
    if current_url_name == name and (ns == current_namespace or ns is None):
        return "active"
    return ""
