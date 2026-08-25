from rest_framework import serializers
from .models import Rayon

class RayonSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rayon
        fields = "__all__"


class RayonUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Rayon
        fields = ["name", "region"]