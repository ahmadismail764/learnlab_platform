from django.urls import path, include
from . import views
from .api import HelloAPI, router as api_router

app_name = 'users'

urlpatterns = [
    path('', views.index, name='index'),
    path('hello/', views.hello, name='hello'),
    path('json/', views.json_test, name='json_test'),
    path('api/hello/', HelloAPI.as_view(), name='api-hello'),
    path('api/', include(api_router.urls)),
]
