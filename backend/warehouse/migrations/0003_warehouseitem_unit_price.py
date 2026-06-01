from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ("warehouse", "0002_warehouseitem_inventoryrecord_item"),
    ]

    operations = [
        migrations.AddField(
            model_name="warehouseitem",
            name="unit_price",
            field=models.DecimalField(decimal_places=2, default=0, max_digits=10, verbose_name="单价"),
        ),
    ]
