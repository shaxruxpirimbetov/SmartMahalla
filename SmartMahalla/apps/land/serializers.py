import json

from rest_framework import serializers

from .models import Farmer, Road


# Same reasoning as apps/mahalla/serializers.py FlexibleJSONField: Farmer
# now takes an uploaded `photo` file, which forces multipart/form-data
# (see SmartMahalla/settings.py DEFAULT_PARSER_CLASSES), under which `plot`
# (a GeoJSON object) arrives as a raw string rather than pre-parsed.
class FlexibleJSONField(serializers.JSONField):
    def to_internal_value(self, data):
        if isinstance(data, str):
            try:
                return json.loads(data)
            except (TypeError, ValueError):
                self.fail('invalid')
        return super().to_internal_value(data)


class FarmerSerializer(serializers.ModelSerializer):
    plot = FlexibleJSONField(required=False)

    class Meta:
        model = Farmer
        fields = '__all__'


class RoadSerializer(serializers.ModelSerializer):
    class Meta:
        model = Road
        fields = '__all__'
