from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from unfold.admin import ModelAdmin
from unfold.forms import AdminPasswordChangeForm, UserChangeForm, UserCreationForm
from accounts.models import User


@admin.register(User)
class UserAdmin(ModelAdmin, BaseUserAdmin):
    form = UserChangeForm
    add_form = UserCreationForm
    change_password_form = AdminPasswordChangeForm

    list_display = (
        "username", "email", "first_name", "last_name",
        "current_xp", "streak_count", "last_practice_date",
        "is_staff", "is_active",
    )
    list_filter = ("is_staff", "is_superuser", "is_active")
    search_fields = ("username", "email", "first_name", "last_name")
    ordering = ("-current_xp",)
    readonly_fields = ("id", "last_login", "date_joined")

    fieldsets = (
        (None, {"fields": ("id", "username", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "email")}),
        ("LearnLab Progress", {
            "fields": ("current_xp", "streak_count", "last_practice_date"),
            "classes": ["tab"],
        }),
        ("Permissions", {
            "fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions"),
            "classes": ["tab"],
        }),
        ("Important Dates", {
            "fields": ("last_login", "date_joined"),
            "classes": ["tab"],
        }),
    )

    add_fieldsets = (
        (None, {
            "fields": ("username", "email", "password1", "password2"),
        }),
        ("Role", {
            "fields": ("is_staff", "is_superuser"),
        }),
    )
