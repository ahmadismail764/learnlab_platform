from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView


api_v1_patterns = [
    path('auth/', include('accounts.urls')),        # All identity/login traffic
    path('practice/', include('practice.urls')),   # All practice-related traffic
    path('analytics/', include('analytics.urls')), # Analytics traffic
    path('', include('topics.urls')),   # Topics, subtopics, mastery, and leaderboard endpoints
    path('admin/', include('accounts.admin_urls')), # Admin-only operational endpoints
]

urlpatterns = [
    # API v1 Blueprint
    # This is for the actual data we are supposed to serve
    # The other endpoints are mainly managerial
    path('api/v1/', include(api_v1_patterns)),

    # The django admin interface, pretty useful
    path('admin/', admin.site.urls),


    # DRF Spectacular Docs
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),

    # Silk profiler (dev only)
    path('silk/', include('silk.urls', namespace='silk')),
]