import os
# DRF Imports
from drf_spectacular.utils import extend_schema, inline_serializer
from rest_framework import generics, status, serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
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
from accounts.models import User
from accounts.serializers import (
    UserSerializer, 
    UserDetailSerializer, 
    CustomTokenObtainPairSerializer
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