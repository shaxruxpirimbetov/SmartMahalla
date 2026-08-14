from rest_framework import generics
from .models import Mahalla, AholiVaBandlik, InfratuzulmaTaxlili, Tadbirkorlar
from .serializers import (
    MahallaSerializer, AholiVaBandlikSerializer, InfratuzulmaTaxliliSerializer,
    TadbirkorlarSerializer,
)


class MahallaListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = MahallaSerializer

    def get_queryset(self):
        rayon = self.request.GET.get('rayon')
        if rayon:
            return Mahalla.objects.filter(rayon=rayon)
        return Mahalla.objects.all()


class MahallaDetailAPIView(generics.RetrieveDestroyAPIView):
    queryset = Mahalla.objects.all()
    serializer_class = MahallaSerializer


class InfratuzulmaTaxliliListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = InfratuzulmaTaxliliSerializer

    def get_queryset(self):
        mahalla = self.request.GET.get('mahalla')
        rayon = self.request.GET.get('rayon')

        if mahalla:
            return InfratuzulmaTaxlili.objects.filter(mahalla=mahalla)
        if rayon:
            return InfratuzulmaTaxlili.objects.filter(rayon=rayon)
        return InfratuzulmaTaxlili.objects.all()


class InfratuzulmaDetailAPIView(generics.RetrieveAPIView):
    queryset = InfratuzulmaTaxlili.objects.all()
    serializer_class = InfratuzulmaTaxliliSerializer


class AholiVaBandlikListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = AholiVaBandlikSerializer

    def get_queryset(self):
        mahalla = self.request.GET.get('mahalla')
        rayon = self.request.GET.get('rayon')

        if mahalla:
            return AholiVaBandlik.objects.filter(mahalla=mahalla)
        if rayon:
            return AholiVaBandlik.objects.filter(rayon=rayon)
        return AholiVaBandlik.objects.all()


class AholiVaBandlikDetailAPIView(generics.RetrieveAPIView):
    queryset = AholiVaBandlik.objects.all()
    serializer_class = AholiVaBandlikSerializer


class TadbirkorlarListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = TadbirkorlarSerializer

    def get_queryset(self):
        mahalla = self.request.GET.get('mahalla')
        if mahalla:
            return Tadbirkorlar.objects.filter(mahalla=mahalla)
        return Tadbirkorlar.objects.all()


class TadbirkorlarDetailAPIView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Tadbirkorlar.objects.all()
    serializer_class = TadbirkorlarSerializer