from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import viewsets
from rest_framework.routers import DefaultRouter


class HelloAPI(APIView):
    def get(self, request):
        name = request.query_params.get('name', 'friend')
        return Response({'message': f'Hello, {name}!'})


class DummyViewSet(viewsets.ViewSet):
    def list(self, request):
        return Response({'status': 'ok', 'detail': 'dummy list'})


router = DefaultRouter()
router.register(r'dummy', DummyViewSet, basename='dummy')
