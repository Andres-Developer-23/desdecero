"""
Versión de requests para el simulador del curso.

Tiene la API de la librería real para peticiones GET (get, Session,
Response, raise_for_status...), pero solo visita la web de prácticas del
curso: los sitios .example. Cualquier otra dirección da un error que lo
explica.

Cada petición tarda 0,2 segundos en un reloj simulado y queda anotada
(URL, cabeceras, estado y hora) para que las comprobaciones de los
ejercicios puedan revisarla. Por el mismo motivo, al importar requests,
time.sleep() avanza ese reloj en lugar de esperar de verdad.
"""

import time as _time

import _web
from requests import exceptions
from requests.exceptions import (
    ConnectionError,
    ConnectTimeout,
    HTTPError,
    InvalidSchema,
    InvalidURL,
    MissingSchema,
    ReadTimeout,
    RequestException,
    Timeout,
    TooManyRedirects,
)

__version__ = "2.32.3"


def _sleep(seconds):
    """time.sleep() simulado: avanza el reloj de la web de prácticas."""
    seconds = float(seconds)
    if seconds < 0:
        raise ValueError("sleep length must be non-negative")
    _web.sleep(seconds)


_time.sleep = _sleep


class CaseInsensitiveDict:
    """Diccionario de cabeceras: "content-type" y "Content-Type" son la misma clave."""

    def __init__(self, data=None):
        self._store = {}
        if data:
            for key in data:
                self[key] = data[key]

    def __setitem__(self, key, value):
        self._store[key.lower()] = (key, value)

    def __getitem__(self, key):
        return self._store[key.lower()][1]

    def __delitem__(self, key):
        del self._store[key.lower()]

    def __contains__(self, key):
        return isinstance(key, str) and key.lower() in self._store

    def __iter__(self):
        return iter([pair[0] for pair in self._store.values()])

    def __len__(self):
        return len(self._store)

    def get(self, key, default=None):
        return self[key] if key in self else default

    def keys(self):
        return [pair[0] for pair in self._store.values()]

    def values(self):
        return [pair[1] for pair in self._store.values()]

    def items(self):
        return [pair for pair in self._store.values()]

    def update(self, other):
        for key in other:
            self[key] = other[key]

    def copy(self):
        return CaseInsensitiveDict(dict(self.items()))

    def __eq__(self, other):
        if not hasattr(other, "items"):
            return False
        mine = dict((key.lower(), value) for key, value in self.items())
        theirs = dict((key.lower(), value) for key, value in other.items())
        return mine == theirs

    def __repr__(self):
        return repr(dict(self.items()))


def _default_headers():
    return CaseInsensitiveDict(
        {
            "User-Agent": "python-requests/" + __version__,
            "Accept-Encoding": "gzip, deflate",
            "Accept": "*/*",
            "Connection": "keep-alive",
        }
    )


class PreparedRequest:
    """La petición tal como se envió: método, URL y cabeceras."""

    def __init__(self, method, url, headers):
        self.method = method
        self.url = url
        self.headers = headers

    def __repr__(self):
        return "<PreparedRequest [" + self.method + "]>"


class Response:
    """La respuesta del servidor."""

    def __init__(self, data, request):
        self.status_code = data["status"]
        self.reason = data["reason"]
        self.url = data["url"]
        self.text = data["body"]
        self.encoding = "utf-8"
        self.headers = CaseInsensitiveDict(
            {"Content-Type": data["type"], "Content-Length": str(len(data["body"].encode("utf-8")))}
        )
        self.request = request
        self.history = []
        self.elapsed = 0.2

    @property
    def ok(self):
        return self.status_code < 400

    @property
    def content(self):
        return self.text.encode("utf-8")

    @property
    def apparent_encoding(self):
        return "utf-8"

    def raise_for_status(self):
        """Lanza HTTPError si el servidor respondió con un error (4xx o 5xx)."""
        if 400 <= self.status_code < 500:
            kind = "Client Error"
        elif 500 <= self.status_code < 600:
            kind = "Server Error"
        else:
            return
        message = str(self.status_code) + " " + kind + ": " + self.reason + " for url: " + self.url
        raise HTTPError(message, response=self)

    def json(self, **kwargs):
        raise NotImplementedError(
            "El simulador del curso no lee JSON: los sitios de práctica solo tienen páginas HTML"
        )

    def iter_lines(self, decode_unicode=False):
        return iter(self.text.splitlines())

    def close(self):
        pass

    def __bool__(self):
        return self.ok

    def __repr__(self):
        return "<Response [" + str(self.status_code) + "]>"


def _encode_params(params):
    from urllib.parse import urlencode

    if isinstance(params, str):
        return params
    return urlencode(params, doseq=True)


def _prepare_url(url, params):
    if not isinstance(url, str):
        raise InvalidURL("Invalid URL " + repr(url) + ": la URL debe ser un texto")
    url = url.strip()
    if not url:
        raise MissingSchema("Invalid URL '': No scheme supplied. Perhaps you meant https://?")
    if "://" not in url:
        raise MissingSchema(
            "Invalid URL '" + url + "': No scheme supplied. Perhaps you meant https://" + url + "?"
        )
    scheme = url.split("://", 1)[0].lower()
    if scheme not in ("http", "https"):
        raise InvalidSchema("No connection adapters were found for '" + url + "'")
    if params:
        query = _encode_params(params)
        if query:
            base, fragment = url, ""
            if "#" in url:
                base, fragment = url.split("#", 1)
                fragment = "#" + fragment
            separator = "&" if "?" in base else "?"
            url = base + separator + query + fragment
    return url


def request(method, url, params=None, headers=None, timeout=None, allow_redirects=True, **kwargs):
    """Hace una petición. El simulador solo admite GET."""
    return _send(method, url, params, _default_headers(), headers, allow_redirects)


def _send(method, url, params, base_headers, headers, allow_redirects):
    method = str(method).upper()
    if method != "GET":
        raise NotImplementedError(
            "El simulador del curso solo admite peticiones GET: los sitios de práctica no tienen formularios"
        )
    url = _prepare_url(url, params)
    sent = base_headers.copy()
    if headers:
        for key in headers:
            if headers[key] is None:
                if key in sent:
                    del sent[key]
            else:
                sent[key] = str(headers[key])
    data = _web.fetch(url, dict(sent.items()), bool(allow_redirects))
    if "error" in data:
        if data["error"] == "url":
            raise InvalidURL("Invalid URL '" + url + "': " + data["message"])
        raise ConnectionError(data["message"])
    return Response(data, PreparedRequest(method, data["url"], sent))


def get(url, params=None, **kwargs):
    """Descarga una página: requests.get(url, params=None, headers=None, timeout=None)."""
    return request("GET", url, params=params, **kwargs)


def _unsupported(method):
    def send(url, *args, **kwargs):
        return request(method, url)

    return send


post = _unsupported("POST")
put = _unsupported("PUT")
patch = _unsupported("PATCH")
delete = _unsupported("DELETE")
head = _unsupported("HEAD")
options = _unsupported("OPTIONS")


class Session:
    """Una sesión reutiliza las mismas cabeceras en todas sus peticiones."""

    def __init__(self):
        self.headers = _default_headers()

    def request(self, method, url, params=None, headers=None, timeout=None, allow_redirects=True, **kwargs):
        return _send(method, url, params, self.headers, headers, allow_redirects)

    def get(self, url, params=None, **kwargs):
        return self.request("GET", url, params=params, **kwargs)

    def post(self, url, *args, **kwargs):
        return self.request("POST", url)

    def close(self):
        pass

    def __enter__(self):
        return self

    def __exit__(self, *args):
        self.close()
        return False


def session():
    return Session()


class _Codes:
    """requests.codes.ok == 200, requests.codes.not_found == 404..."""

    ok = 200
    created = 201
    moved_permanently = 301
    found = 302
    bad_request = 400
    forbidden = 403
    not_found = 404
    too_many_requests = 429
    internal_server_error = 500
    service_unavailable = 503


codes = _Codes()
