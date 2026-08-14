from rest_framework import generics

from .models import Farmer, Road
from .serializers import FarmerSerializer, RoadSerializer


class FarmerListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = FarmerSerializer

    def get_queryset(self):
        mahalla = self.request.GET.get('mahalla')
        if mahalla:
            return Farmer.objects.filter(mahalla=mahalla)
        return Farmer.objects.all()


class FarmerDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Farmer.objects.all()
    serializer_class = FarmerSerializer


class RoadListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = RoadSerializer

    def get_queryset(self):
        rayon = self.request.GET.get('rayon')
        if rayon:
            return Road.objects.filter(rayon=rayon)
        return Road.objects.all()


class RoadDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Road.objects.all()
    serializer_class = RoadSerializer
