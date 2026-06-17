from django.urls import path
from accounts.views import AuditLogView, SystemHealthView

urlpatterns = [
    path('audit-logs/', AuditLogView.as_view(), name='admin-audit-logs'),
    path('system-health/', SystemHealthView.as_view(), name='admin-system-health'),
]
