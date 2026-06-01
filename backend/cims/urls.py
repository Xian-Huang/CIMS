from django.contrib import admin
from django.urls import path

from warehouse import views


urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/items/", views.items, name="items"),
    path("api/items/<int:item_id>/", views.item_detail, name="item_detail"),
    path("api/records/", views.records, name="records"),
    path("api/records/<int:record_id>/", views.record_detail, name="record_detail"),
    path("api/summary/", views.summary, name="summary"),
    path("api/export/", views.export_records, name="export_records"),
    path("api/import/", views.import_records, name="import_records"),
]
