from django.shortcuts import render
from django.views import View
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.mahalla.models import AholiVaBandlik, InfratuzulmaTaxlili
from apps.mahalla.serializers import AholiVaBandlikSerializer, InfratuzulmaTaxliliSerializer

from google.genai.errors import ClientError, ServerError
from utils import ai
import json

class AnalysAPIView(APIView):
    def get(self, request, *args, **kwargs):
        avb = AholiVaBandlikSerializer(AholiVaBandlik.objects.all(), many=True).data
        infra = InfratuzulmaTaxliliSerializer(InfratuzulmaTaxlili.objects.all(), many=True).data
        try:
            data = ai.ask_analysis(avb, infra).replace("```json", "").replace("```", "")
            return Response({"data": json.loads(data), "images": ["media/img.png", "media/img_1.png", "media/img_2.png", "media/img_3.png"]})
        except ClientError as e:
            print("ClientError", e)
            return Response({"error": e.message}, status=e.response.status_code)

        except ServerError as e:
            print("ServerError", e)
            return Response({"error": e.message}, status=e.response.status_code)
        except Exception as e:
            return Response({"error": str(e)}, status=500)


class IndexView(APIView):
    def get(self, request, *args, **kwargs):
        return render(request, "index.html")


def custom_404(request, exception):
    return render(request, "index.html", status=200)

# class DashboardView(APIView):
#     def get(self, request, *args, **kwargs):
#         return render(request, "react_index.html")