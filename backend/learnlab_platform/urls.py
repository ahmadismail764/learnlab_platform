from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # API v1 Blueprint
    path('api/v1/auth/', include('users.urls')),        # All identity/login traffic
    path('api/v1/practice/', include('questions.urls')), # All FSRS/questions traffic
    path('api/v1/analytics/', include('analytics.urls')), # All admin metrics traffic

    # API v2 blueprint
    # planned to include other apps

]#