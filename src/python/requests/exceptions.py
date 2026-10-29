"""
Excepciones de requests, con la jerarquía de la librería real.

En requests, MissingSchema, InvalidSchema e InvalidURL también heredan de
ValueError; Skulpt no admite esa doble herencia de excepciones nativas.
"""


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
