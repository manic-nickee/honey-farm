from rest_framework.response import Response


def to_response(result):
    return Response(result.data, status=result.status_code)