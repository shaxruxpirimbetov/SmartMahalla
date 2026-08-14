from django.contrib.auth.models import User
from django.core.validators import MinLengthValidator
from django.db import models

class Rayon(models.Model):
    creator = models.ForeignKey(User, on_delete=models.CASCADE, related_name="rayon_creator")
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)], verbose_name="Rayon")
    region = models.CharField(max_length=200, validators=[MinLengthValidator(3)], default="Qoraqalpogʻiston", verbose_name="Region")
    is_active = models.BooleanField(default=True, verbose_name="Active")
    plot = models.JSONField(default=dict, verbose_name="Plot", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="Updated at")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Rayon"
        verbose_name_plural = "Rayon's"
        ordering = ["-created_at"]

    def deactivate(self):
        self.is_active = False
        self.save(update_fields=["is_active"])

    def activate(self):
        self.is_active = True
        self.save(update_fields=["is_active"])
