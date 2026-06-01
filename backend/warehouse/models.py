from django.db import models


class WarehouseItem(models.Model):
    name = models.CharField("物品名称", max_length=100, unique=True)
    unit = models.CharField("默认单位", max_length=20, default="kg")
    unit_price = models.DecimalField("单价", max_digits=10, decimal_places=2, default=0)
    is_active = models.BooleanField("启用", default=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class InventoryRecord(models.Model):
    SCHOOL_PRIMARY = "primary"
    SCHOOL_MIDDLE = "middle"
    SCHOOL_CHOICES = [
        (SCHOOL_PRIMARY, "小学"),
        (SCHOOL_MIDDLE, "中学"),
    ]

    TYPE_IN = "in"
    TYPE_OUT = "out"
    TYPE_CHOICES = [
        (TYPE_IN, "入库"),
        (TYPE_OUT, "出库"),
    ]

    school = models.CharField("学校类型", max_length=20, choices=SCHOOL_CHOICES)
    record_type = models.CharField("记录类型", max_length=10, choices=TYPE_CHOICES)
    item = models.ForeignKey(WarehouseItem, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="物品")
    item_name = models.CharField("物品名称", max_length=100)
    category = models.CharField("类别", max_length=60, blank=True)
    quantity = models.DecimalField("数量", max_digits=10, decimal_places=2)
    unit = models.CharField("单位", max_length=20, default="kg")
    supplier = models.CharField("供应商/领用人", max_length=100, blank=True)
    operator = models.CharField("经办人", max_length=50, blank=True)
    occurred_at = models.DateField("发生日期")
    remark = models.TextField("备注", blank=True)
    created_at = models.DateTimeField("创建时间", auto_now_add=True)
    updated_at = models.DateTimeField("更新时间", auto_now=True)

    class Meta:
        ordering = ["-occurred_at", "-id"]

    def __str__(self):
        return f"{self.get_school_display()} {self.get_record_type_display()} {self.item_name}"
