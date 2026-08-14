from django.urls import path
from . import views

urlpatterns = [
    path("", views.RayonListCreateAPIView.as_view()),
    path("<int:pk>/", views.RayonDetailAPIView.as_view()),
]