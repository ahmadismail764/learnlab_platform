from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Blueprint
    path('auth/', include('accounts.urls')),        # All identity/login traffic
    path('practice/', include('practice.urls')),   # All practice-related traffic
    path('topics/', include('topics.urls')),       # All topic and subtopic related traffic
    path('analytics/', include('analytics.urls')), # Analytics traffic
    
    # DRF Spectacular Docs
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # API v2 blueprint
    # planned to include other apps
    path('silk/', include('silk.urls', namespace='silk')),
]