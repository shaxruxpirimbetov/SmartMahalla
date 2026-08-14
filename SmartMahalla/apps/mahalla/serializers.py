import json

from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Mahalla, InfratuzulmaTaxlili, AholiVaBandlik, Tadbirkorlar


# Tadbirkorlar (Business) now takes an uploaded `image` file, which forces
# the request through multipart/form-data instead of a plain JSON body (see
# SmartMahalla/settings.py DEFAULT_PARSER_CLASSES) - under multipart, every
# non-file field (including `location`, a GeoJSON object) arrives as a raw
# string, not pre-parsed. Plain `serializers.JSONField` only handles that
# with `binary=True`, which then breaks the normal JSON-body request path
# (there `location` already arrives as a parsed dict, and `json.loads(dict)`
# raises). This accepts either shape.
class FlexibleJSONField(serializers.JSONField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                return json.loads(data)
            except (TypeError, ValueError):
                self.fail('invalid')
        return super().to_internal_value(data)


class MahallaSerializer(serializers.ModelSerializer):
    # blank=True on the model already makes this optional, but that's a
    # ManyToManyField (Django ignores null=True on M2M - there's no column
    # to be null, it's a through table row that just doesn't exist), so it's
    # spelled out here too rather than relying on ModelSerializer's
    # auto-derivation from the model field.
    staff = serializers.PrimaryKeyRelatedField(
        queryset=User.objects.all(), many=True, required=False
    )

    class Meta:
        model = Mahalla
        fields = '__all__'


class InfratuzulmaTaxliliSerializer(serializers.ModelSerializer):
    class Meta:
        model = InfratuzulmaTaxlili
        fields = '__all__'


class AholiVaBandlikSerializer(serializers.ModelSerializer):
    class Meta:
        model = AholiVaBandlik
        fields = '__all__'


class TadbirkorlarSerializer(serializers.ModelSerializer):
    location = FlexibleJSONField(required=False)

    class Meta:
        model = Tadbirkorlar
        fields = '__all__'