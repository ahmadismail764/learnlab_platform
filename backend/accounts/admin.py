from django.contrib import admin
from django.contrib.auth import get_user_model
from django.contrib.auth.admin import UserAdmin
from .models import Learner

User = get_user_model()

class CustomUserAdmin(UserAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'date_joined')
    search_fields = ('username', 'email')

@admin.register(Learner)
class LearnerAdmin(admin.ModelAdmin):
    list_display = ('user', 'total_xp', 'streak_count', 'last_practice_date')
    search_fields = ('user__username', 'user__email')

admin.site.register(User, CustomUserAdmin)
