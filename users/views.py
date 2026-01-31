from django.http import HttpResponse, JsonResponse


def index(request):
    return HttpResponse("Users index — routing works.")


def hello(request):
    name = request.GET.get('name', 'friend')
    return HttpResponse(f"Hello, {name}!")


def json_test(request):
    return JsonResponse({"status": "ok", "message": "JSON route works"})