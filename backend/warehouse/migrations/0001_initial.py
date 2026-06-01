from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="InventoryRecord",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("school", models.CharField(choices=[("primary", "小学"), ("middle", "中学")], max_length=20, verbose_name="学校类型")),
                ("record_type", models.CharField(choices=[("in", "入库"), ("out", "出库")], max_length=10, verbose_name="记录类型")),
                ("item_name", models.CharField(max_length=100, verbose_name="物品名称")),
                ("category", models.CharField(blank=True, max_length=60, verbose_name="类别")),
                ("quantity", models.DecimalField(decimal_places=2, max_digits=10, verbose_name="数量")),
                ("unit", models.CharField(default="kg", max_length=20, verbose_name="单位")),
                ("supplier", models.CharField(blank=True, max_length=100, verbose_name="供应商/领用人")),
                ("operator", models.CharField(blank=True, max_length=50, verbose_name="经办人")),
                ("occurred_at", models.DateField(verbose_name="发生日期")),
                ("remark", models.TextField(blank=True, verbose_name="备注")),
                ("created_at", models.DateTimeField(auto_now_add=True, verbose_name="创建时间")),
                ("updated_at", models.DateTimeField(auto_now=True, verbose_name="更新时间")),
            ],
            options={"ordering": ["-occurred_at", "-id"]},
        ),
    ]
