from django.contrib import admin
from unfold.admin import ModelAdmin
from notifications.models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(ModelAdmin):
    list_display = ('user', 'kind', 'channel', 'sent_date', 'created_at')
    list_filter = ('kind', 'channel', 'sent_date')
    search_fields = ('user__email', 'user__username')
    readonly_fields = ('id', 'created_at')
    ordering = ('-created_at',)
