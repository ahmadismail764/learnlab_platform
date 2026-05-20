from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView
from topics.views import TopicViewSet, SubtopicViewSet, SubtopicMasteryViewSet
from rest_framework.routers import DefaultRouter

# Topics router — mounted directly under api/v1/ to avoid doubled prefix
topics_router = DefaultRouter()
topics_router.register(r'topics', TopicViewSet, basename='topic')
topics_router.register(r'subtopics', SubtopicViewSet, basename='subtopic')
topics_router.register(r'mastery', SubtopicMasteryViewSet, basename='subtopic-mastery')

api_v1_patterns = [
    path('auth/', include('accounts.urls')),        # All identity/login traffic
    path('practice/', include('practice.urls')),   # All practice-related traffic
    path('analytics/', include('analytics.urls')), # Analytics traffic
    path('', include(topics_router.urls)),          # Topics, subtopics, mastery
]

urlpatterns = [
    path('admin/', admin.site.urls),

    # API v1 Blueprint
    path('api/v1/', include(api_v1_patterns)),

    # DRF Spectacular Docs
    path('schema/', SpectacularAPIView.as_view(), name='schema'),
    path('docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),

    # Silk profiler (dev only)
    path('silk/', include('silk.urls', namespace='silk')),
]