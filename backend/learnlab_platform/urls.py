from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView
from django.conf import settings


api_v1_patterns = [
    path('auth/', include('accounts.urls')),        # All identity/login traffic
    path('practice/', include('practice.urls')),   # All practice-related traffic
    path('analytics/', include('analytics.urls')), # Analytics traffic
    path('', include('topics.urls')),   # Topics, subtopics, mastery, and leaderboard endpoints
    path('admin/', include('accounts.admin_urls')), # Admin-only operational endpoints
]

url_patterns = [
    path('api/v1/', include(api_v1_patterns)),
    path('admin/', admin.site.urls),
]

development_url_patterns = [
    path('silk/', include('silk.urls', namespace='silk')),
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]

if settings.DEBUG:
    url_patterns.extend(development_url_patterns)

