"""
Excepciones de requests, con la jerarquía de la librería real.

En requests, MissingSchema, InvalidSchema e InvalidURL también heredan de
ValueError, y JSONDecodeError hereda a la vez de RequestException y de
json.JSONDecodeError. Skulpt no admite esa doble herencia de excepciones
nativas: JSONDecodeError hereda solo de json.JSONDecodeError, así que se
captura con except requests.exceptions.JSONDecodeError, except
json.JSONDecodeError y except ValueError, como en la librería real.
"""

import json as _json


class RequestException(IOError):
    """Algo falló al hacer la petición."""

    def __init__(self, *args, **kwargs):
        IOError.__init__(self, *args)
        self.response = kwargs.get("response")
        self.request = kwargs.get("request")


class HTTPError(RequestException):
    """El servidor respondió con un código de error (4xx o 5xx)."""


class ConnectionError(RequestException):
    """No se pudo conectar con el servidor."""


class Timeout(RequestException):
    """El servidor tardó demasiado en responder."""


class ConnectTimeout(ConnectionError, Timeout):
    pass


class ReadTimeout(Timeout):
    pass


class URLRequired(RequestException):
    pass


class TooManyRedirects(RequestException):
    pass


class MissingSchema(RequestException):
    """La URL no empieza por http:// o https://."""


class InvalidSchema(RequestException):
    pass


class InvalidURL(RequestException):
    pass


class InvalidJSONError(RequestException):
    """No se pudo convertir a JSON lo que se pasó en json=."""


class JSONDecodeError(_json.JSONDecodeError):
    """La respuesta no es JSON válido (lo lanza Response.json())."""

    def __init__(self, msg, doc, pos, response=None):
        _json.JSONDecodeError.__init__(self, msg, doc, pos)
        self.response = response
        self.request = None
