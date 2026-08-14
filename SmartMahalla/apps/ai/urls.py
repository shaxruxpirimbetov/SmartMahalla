from django.urls import path
from . import views

urlpatterns = [
    path("", views.AnalysAPIView.as_view()),
]