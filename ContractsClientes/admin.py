from django.contrib import admin
from .models import Contract 

# Register your models here.

admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    list_display = ('title', 'client', 'status', 'created_at')
    search_fields = ('title', 'client__full_name')
    list_filter = ('status', 'created_at')

    def client(self, obj):
        return obj.client.full_name if obj.client else 'N/A'
    
    client.short_description = 'Client Name'