from django.db import migrations, models
import django.db.models.deletion


DEFAULT_ITEMS = [
    ("大米", "kg"),
    ("面粉", "kg"),
    ("食用油", "L"),
    ("鸡蛋", "个"),
    ("猪肉", "kg"),
    ("牛肉", "kg"),
    ("鸡肉", "kg"),
    ("土豆", "kg"),
    ("白菜", "kg"),
    ("胡萝卜", "kg"),
    ("西红柿", "kg"),
    ("黄瓜", "kg"),
    ("盐", "袋"),
    ("酱油", "瓶"),
    ("醋", "瓶"),
]


def seed_items(apps, schema_editor):
    item_model = apps.get_model("warehouse", "WarehouseItem")
    record_model = apps.get_model("warehouse", "InventoryRecord")

    for name, unit in DEFAULT_ITEMS:
        item_model.objects.get_or_create(name=name, defaults={"unit": unit})

    for record in record_model.objects.filter(item__isnull=True):
        if not record.item_name:
            continue
        item, _ = item_model.objects.get_or_create(
            name=record.item_name,
            defaults={"unit": record.unit or "kg"},
        )
        record.item = item
        record.save(update_fields=["item"])


class Migration(migrations.Migration):
    dependencies = [
        ("warehouse", "0001_initial"),
    ]

    operations = [
        migrations.CreateModel(
            name="WarehouseItem",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("name", models.CharField(max_length=100, unique=True, verbose_name="物品名称")),
                ("unit", models.CharField(default="kg", max_length=20, verbose_name="默认单位")),
                ("is_active", models.BooleanField(default=True, verbose_name="启用")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="创建时间")),
            ],
            options={"ordering": ["name"]},
        ),
        migrations.AddField(
            model_name="inventoryrecord",
            name="item",
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to="warehouse.warehouseitem", verbose_name="物品"),
        ),
        migrations.RunPython(seed_items, migrations.RunPython.noop),
    ]
