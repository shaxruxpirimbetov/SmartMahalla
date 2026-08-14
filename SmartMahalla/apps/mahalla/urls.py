from django.urls import path
from . import views

urlpatterns = [
    path("", views.MahallaListCreateAPIView.as_view()),
    path("<int:pk>/", views.MahallaDetailAPIView.as_view()),

    path("avb/", views.AholiVaBandlikListCreateAPIView.as_view()),
    path("avb/<int:pk>/", views.AholiVaBandlikDetailAPIView.as_view()),
    
    path("infra/", views.InfratuzulmaTaxliliListCreateAPIView.as_view()),
    path("infra/<int:pk>/", views.InfratuzulmaDetailAPIView.as_view()),

    path("tadbirkorlar/", views.TadbirkorlarListCreateAPIView.as_view()),
    path("tadbirkorlar/<int:pk>/", views.TadbirkorlarDetailAPIView.as_view()),
]