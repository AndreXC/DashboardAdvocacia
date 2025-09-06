
from ...models import AreaDireito
def get_area_direito(area_direito_id: int): 
    try:
        area_direito_instance = AreaDireito.objects.get(pk=area_direito_id)
        return area_direito_instance
    except AreaDireito.DoesNotExist:
        return None