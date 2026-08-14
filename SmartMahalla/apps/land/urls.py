from django.urls import path
from . import views

urlpatterns = [
    path("farmer/", views.FarmerListCreateAPIView.as_view()),
    path("farmer/<int:pk>/", views.FarmerDetailAPIView.as_view()),

    path("road/", views.RoadListCreateAPIView.as_view()),
    path("road/<int:pk>/", views.RoadDetailAPIView.as_view()),
]
