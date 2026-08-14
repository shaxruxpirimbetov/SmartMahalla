from rest_framework import generics
from .serializers import RayonSerializer, RayonUpdateSerializer
from .models import Rayon


class RayonListCreateAPIView(generics.ListCreateAPIView):
    queryset = Rayon.objects.all()
    serializer_class = RayonSerializer


class RayonDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Rayon.objects.all()

    def get_serializer_class(self):
        if self.request.method == 'GET':
            return RayonSerializer
        return RayonUpdateSerializer