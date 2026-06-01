from django.contrib import admin

from .models import InventoryRecord, WarehouseItem


@admin.register(WarehouseItem)
class WarehouseItemAdmin(admin.ModelAdmin):
    list_display = ("name", "unit", "unit_price", "is_active", "created_at")
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.register(InventoryRecord)
class InventoryRecordAdmin(admin.ModelAdmin):
    list_display = ("school", "record_type", "item_name", "quantity", "unit", "occurred_at", "operator")
    list_filter = ("school", "record_type", "occurred_at")
    search_fields = ("item_name", "category", "supplier", "operator")
