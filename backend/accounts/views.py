import os
# DRF Imports
from drf_spectacular.utils import extend_schema, extend_schema_view, inline_serializer, OpenApiParameter
from drf_spectacular.types import OpenApiTypes
from rest_framework import generics, status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated, IsAdminUser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
# Core django imports
from django.template.loader import render_to_string
from django.core.mail import send_mail
from django.conf import settings
from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
# Our imports
from accounts.models import User, AuditLog
from accounts.serializers import (
    UserSerializer,
    UserDetailSerializer,
    UserPreferencesSerializer,
    AuditLogSerializer,
    CustomTokenObtainPairSerializer,
)

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [AllowAny]

class CurrentUserView(generics.RetrieveUpdateAPIView):
    queryset = User.objects.all()
    permission_classes = [IsAuthenticated]
    serializer_class = UserDetailSerializer

    def get_object(self):
        return self.request.user

class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer

class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        operation_id='auth_password_reset_request',
        description="Send a password reset link to the provided email address. Always returns 200 to avoid email enumeration.",
        request=inline_serializer(
            name='PasswordResetRequest',
            fields={'email': serializers.EmailField()},
        ),
        responses={
            200: inline_serializer(
                name='PasswordResetRequestResponse',
                fields={'message': serializers.CharField()},
            ),
            400: inline_serializer(
                name='PasswordResetRequestError',
                fields={'email': serializers.ListField(child=serializers.CharField())},
            ),
        },
    )
    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response(
                {'email': ['This field is required.']},
                status=status.HTTP_400_BAD_REQUEST
            )

        UserModel = get_user_model()
        user = UserModel.objects.filter(email__iexact=email).first()

        if user:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_link = f"{os.getenv('FRONTEND_URL', 'http://localhost:5173')}/reset-password?uid={uid}&token={token}"

            email_body = render_to_string('accounts/emails/password_reset.txt', {
                'first_name': user.first_name or user.username,
                'reset_link': reset_link,
            })

            send_mail(
                subject='LearnLab — Password Reset Request',
                message=email_body,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False,
            )

            if settings.DEBUG:
                print(f"--- PASSWORD RESET ---")
                print(f"User: {user.username}")
                print(f"Reset link: {reset_link}")
                print(f"----------------------")

        return Response(
            {'message': 'If an account with this email exists, a password reset link has been sent.'},
            status=status.HTTP_200_OK
        )

class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    @extend_schema(
        description="Confirm a password reset with a valid uid, token, and new password.",
        request=inline_serializer(
            name='PasswordResetConfirmRequest',
            fields={
                'uid': serializers.CharField(),
                'token': serializers.CharField(),
                'password': serializers.CharField(),
            }
        ),
        responses={
            200: inline_serializer(
                name='PasswordResetConfirmResponse',
                fields={
                    'message': serializers.CharField(),
                }
            ),
            400: inline_serializer(
                name='PasswordResetConfirmError',
                fields={
                    'error': serializers.CharField(),
                }
            )
        }
    )
    def post(self, request):
        uidb64 = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        if not uidb64 or not token or not password:
            return Response({'error': 'Missing fields'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            UserModel = get_user_model()
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = UserModel.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, UserModel.DoesNotExist):
            user = None

        if user is not None and default_token_generator.check_token(user, token):
            user.set_password(password)
            user.save()
            return Response({'message': 'Password reset successful.'}, status=status.HTTP_200_OK)
        
        return Response({'error': 'Invalid token or expired link.'}, status=status.HTTP_400_BAD_REQUEST)

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    @extend_schema(
        description="Log out a user by blacklisting their refresh token.",
        request=inline_serializer(
            name='LogoutRequest',
            fields={
                'refresh': serializers.CharField(),
            }
        ),
        responses={
            205: inline_serializer(
                name='LogoutResponse',
                fields={
                    'message': serializers.CharField(),
                }
            ),
            400: inline_serializer(
                name='LogoutError',
                fields={
                    'refresh': serializers.ListField(child=serializers.CharField(), required=False),
                    'error': serializers.CharField(required=False),
                }
            )
        }
    )
    def post(self, request):
        refresh_token = request.data.get('refresh')
        if not refresh_token:
            return Response({'refresh': ['This field is required.']}, status=status.HTTP_400_BAD_REQUEST)

        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response({'error': 'Invalid or expired token.'}, status=status.HTTP_400_BAD_REQUEST)

        return Response({'message': 'Logged out successfully.'}, status=status.HTTP_205_RESET_CONTENT)


class UserPreferencesView(APIView):
    """
    GET  /auth/users/me/preferences/ — retrieve the current user's preferences
    PATCH /auth/users/me/preferences/ — merge new keys into the stored preferences
    """
    permission_classes = [IsAuthenticated]

    @extend_schema(
        operation_id='auth_preferences_retrieve',
        description="Retrieve the authenticated user's persisted UI preferences (language, theme, notifications, etc.).",
        responses={200: UserPreferencesSerializer},
    )
    def get(self, request):
        serializer = UserPreferencesSerializer(request.user)
        return Response(serializer.data)

    @extend_schema(
        operation_id='auth_preferences_update',
        description="Merge the supplied key/value pairs into the user's preferences. Existing keys not present in the payload are preserved.",
        request=inline_serializer(
            name='PreferencesPatchRequest',
            fields={'preferences': serializers.DictField(child=serializers.JSONField())},
        ),
        responses={200: UserPreferencesSerializer},
    )
    def patch(self, request):
        user = request.user
        incoming = request.data if isinstance(request.data, dict) else {}
        user.preferences = {**user.preferences, **incoming}
        user.save(update_fields=['preferences'])

        AuditLog.objects.create(
            actor=user,
            action_type='preferences_updated',
            target_resource=f'User/{user.id}',
            metadata={'updated_keys': list(incoming.keys())},
        )

        return Response(UserPreferencesSerializer(user).data)


@extend_schema_view(
    get=extend_schema(
        operation_id='admin_audit_logs_list',
        description="Read-only paginated list of admin audit log entries. Filter by action_type, actor_id, or date range.",
        parameters=[
            OpenApiParameter('action_type', type=OpenApiTypes.STR, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter('actor_id', type=OpenApiTypes.UUID, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter('after', type=OpenApiTypes.DATETIME, location=OpenApiParameter.QUERY, required=False),
            OpenApiParameter('before', type=OpenApiTypes.DATETIME, location=OpenApiParameter.QUERY, required=False),
        ],
        responses={200: AuditLogSerializer(many=True)},
    )
)
class AuditLogView(generics.ListAPIView):
    permission_classes = [IsAdminUser]
    serializer_class = AuditLogSerializer

    def get_queryset(self):
        qs = AuditLog.objects.select_related('actor').all()
        params = self.request.query_params

        action_type = params.get('action_type')
        if action_type:
            qs = qs.filter(action_type=action_type)

        actor_id = params.get('actor_id')
        if actor_id:
            qs = qs.filter(actor_id=actor_id)

        after = params.get('after')
        if after:
            qs = qs.filter(timestamp__gte=after)

        before = params.get('before')
        if before:
            qs = qs.filter(timestamp__lte=before)

        return qs


class SystemHealthView(APIView):
    """
    GET /admin/system-health/
    Admin-only operational telemetry: CPU, memory, disk, DB connection, uptime, avg API latency.
    """
    permission_classes = [IsAdminUser]

    @extend_schema(
        operation_id='admin_system_health',
        description="Admin-only telemetry snapshot: CPU usage, memory, disk, database ping latency, server uptime, and average recent API latency (from Silk profiler if available).",
        responses={
            200: inline_serializer('SystemHealthResponse', fields={
                'cpu': inline_serializer('CpuInfo', fields={'percent': serializers.FloatField()}),
                'memory': inline_serializer('MemoryInfo', fields={
                    'total_mb': serializers.IntegerField(),
                    'used_mb': serializers.IntegerField(),
                    'percent': serializers.FloatField(),
                }),
                'disk': inline_serializer('DiskInfo', fields={
                    'total_gb': serializers.FloatField(),
                    'used_gb': serializers.FloatField(),
                    'percent': serializers.FloatField(),
                }),
                'database': inline_serializer('DbInfo', fields={
                    'status': serializers.CharField(),
                    'latency_ms': serializers.FloatField(allow_null=True),
                }),
                'uptime_seconds': serializers.IntegerField(),
                'avg_api_latency_ms': serializers.FloatField(allow_null=True),
            }),
        },
    )
    def get(self, request):
        import time
        from django.db import connection

        try:
            import psutil
            cpu_percent = psutil.cpu_percent(interval=0.2)
            mem = psutil.virtual_memory()
            try:
                disk = psutil.disk_usage('/')
                disk_data = {
                    'total_gb': round(disk.total / 1024 ** 3, 2),
                    'used_gb': round(disk.used / 1024 ** 3, 2),
                    'percent': disk.percent,
                }
            except Exception:
                disk_data = {'total_gb': None, 'used_gb': None, 'percent': None}

            uptime_seconds = int(time.time() - psutil.boot_time())
            memory_data = {
                'total_mb': round(mem.total / 1024 ** 2),
                'used_mb': round(mem.used / 1024 ** 2),
                'percent': mem.percent,
            }
        except ImportError:
            cpu_percent = None
            memory_data = {'total_mb': None, 'used_mb': None, 'percent': None}
            disk_data = {'total_gb': None, 'used_gb': None, 'percent': None}
            uptime_seconds = None

        db_status = 'ok'
        db_latency_ms = None
        try:
            t0 = time.monotonic()
            with connection.cursor() as cursor:
                cursor.execute('SELECT 1')
            db_latency_ms = round((time.monotonic() - t0) * 1000, 2)
        except Exception as exc:
            db_status = f'error: {exc}'

        avg_api_latency_ms = None
        try:
            from silk.models import Request as SilkRequest
            from django.db.models import Avg
            from django.utils import timezone as tz
            cutoff = tz.now() - tz.timedelta(hours=1)
            result = SilkRequest.objects.filter(start_time__gte=cutoff).aggregate(Avg('time_taken'))
            val = result.get('time_taken__avg')
            if val is not None:
                avg_api_latency_ms = round(val, 2)
        except Exception:
            pass

        return Response({
            'cpu': {'percent': cpu_percent},
            'memory': memory_data,
            'disk': disk_data,
            'database': {'status': db_status, 'latency_ms': db_latency_ms},
            'uptime_seconds': uptime_seconds,
            'avg_api_latency_ms': avg_api_latency_ms,
        })