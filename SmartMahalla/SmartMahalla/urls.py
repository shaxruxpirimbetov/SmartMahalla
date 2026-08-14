from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from apps.ai.views import IndexView #, DashboardView

handler404 = 'apps.ai.views.custom_404'

urlpatterns = [
    path("django_admin/", admin.site.urls),
    path("api/user/", include("apps.user.urls")),
    path("api/rayon/", include("apps.rayon.urls")),
    path("api/mahalla/", include("apps.mahalla.urls")),
    path("api/land/", include("apps.land.urls")),
    path("api/ai/", include("apps.ai.urls")),
    path("", IndexView.as_view()),
    # path("dashboard/", DashboardView.as_view()),

    path("api/token/", TokenObtainPairView.as_view()),
    path("api/refresh/", TokenRefreshView.as_view()),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)