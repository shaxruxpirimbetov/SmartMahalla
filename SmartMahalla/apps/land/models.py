from django.core.validators import MinLengthValidator
from django.db import models

from apps.mahalla.models import Mahalla
from apps.rayon.models import Rayon


class Farmer(models.Model):
    mahalla = models.ForeignKey(Mahalla, on_delete=models.CASCADE, related_name="farmer_mahalla")
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)], verbose_name="Name")
    owner = models.CharField(max_length=200, default="", verbose_name="Owner")
    crop = models.CharField(max_length=100, default="", verbose_name="Crop")
    area_hectares = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name="Area (ha)")
    description = models.TextField(default="", blank=True, verbose_name="Description")
    photo = models.ImageField(upload_to="farmer_images/", null=True, blank=True, verbose_name="Photo")
    plot = models.JSONField(default=dict, null=True, blank=True, verbose_name="Plot")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Farmer"
        verbose_name_plural = "Farmers"
        ordering = ["-created_at"]


class Road(models.Model):
    ASPHALT = "asphalt"
    GRAVEL = "gravel"
    DIRT = "dirt"
    CONDITION_CHOICES = [
        (ASPHALT, "Asfalt"),
        (GRAVEL, "Shagʻal"),
        (DIRT, "Tuproq"),
    ]

    rayon = models.ForeignKey(Rayon, on_delete=models.CASCADE, related_name="road_rayon")
    name = models.CharField(max_length=200, validators=[MinLengthValidator(3)], verbose_name="Name")
    condition = models.CharField(max_length=20, choices=CONDITION_CHOICES, default=ASPHALT, verbose_name="Condition")
    path = models.JSONField(default=dict, null=True, blank=True, verbose_name="Path")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Created at")

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = "Road"
        verbose_name_plural = "Roads"
        ordering = ["-created_at"]
