from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Blueprint
    path('api/v1/', include('accounts.urls')),        # All identity/login traffic
    # path('api/v1/practice/', include('questions.urls')), # All FSRS/questions traffic

    # DRF Spectacular Docs
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API v2 blueprint
    # planned to include other apps
    path('silk/', include('silk.urls', namespace='silk')),
]