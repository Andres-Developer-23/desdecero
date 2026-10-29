"""
Versión de requests para el simulador del curso.

Tiene la API de la librería real (get, post, put, patch, delete, head,
Session, Response, raise_for_status, json()...), pero solo visita los
sitios y las APIs de práctica del curso: los dominios .example. Cualquier
otra dirección da un error que lo explica.

Cada petición tarda 0,2 segundos en un reloj simulado y queda anotada
(método, URL, cabeceras, cuerpo, estado y hora) para que las comprobaciones
de los ejercicios puedan revisarla. Por el mismo motivo, al importar
requests, time.sleep() avanza ese reloj en lugar de esperar de verdad.
"""

import json as _jsonlib
import time as _time

import _web
from requests import exceptions
from requests.exceptions import (
    ConnectionError,
    ConnectTimeout,
    HTTPError,
    InvalidJSONError,
    InvalidSchema,
    InvalidURL,
    JSONDecodeError,
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
    """La petición tal como se envió: método, URL, cabeceras y cuerpo."""

    def __init__(self, method, url, headers, body=None):
        self.method = method
        self.url = url
        self.headers = headers
        self.body = body

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
        self.headers = CaseInsensitiveDict()
        for pair in data["headers"]:
            self.headers[pair[0]] = pair[1]
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
        """El cuerpo de la respuesta convertido de JSON a datos de Python."""
        try:
            return _jsonlib.loads(self.text, **kwargs)
        except _jsonlib.JSONDecodeError as error:
            raise JSONDecodeError(error.msg, error.doc, error.pos, response=self)

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
    if isinstance(params, bytes):
        return params.decode("utf-8")
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


def _prepare_body(data, json):
    """El cuerpo de la petición y su Content-Type, como hace requests."""
    if not data and json is not None:
        try:
            return _jsonlib.dumps(json, allow_nan=False), "application/json"
        except (TypeError, ValueError) as error:
            raise InvalidJSONError(str(error))
    if not data:
        return None, None
    if isinstance(data, bytes):
        return data.decode("utf-8"), None
    if isinstance(data, str):
        return data, None
    return _encode_params(data), "application/x-www-form-urlencoded"


def _timeout_seconds(timeout):
    if timeout is None:
        return None
    if isinstance(timeout, tuple):
        timeout = timeout[-1]
        if timeout is None:
            return None
    if isinstance(timeout, bool) or not isinstance(timeout, (int, float)):
        raise ValueError(
            "Timeout value connect was " + repr(timeout) + ", but it must be an int, float or None."
        )
    if timeout <= 0:
        raise ValueError(
            "Attempted to set connect timeout to " + str(timeout) + ", but the timeout cannot be set to a value less than or equal to 0."
        )
    return float(timeout)


def _send(method, url, base_headers, params=None, data=None, headers=None, timeout=None, allow_redirects=True, json=None, files=None, auth=None, **kwargs):
    method = str(method).upper()
    if files is not None:
        raise NotImplementedError("El simulador del curso no envía archivos con files=")
    if auth is not None:
        raise NotImplementedError(
            "El simulador del curso no admite auth=: envía la cabecera Authorization con headers="
        )
    url = _prepare_url(url, params)
    seconds = _timeout_seconds(timeout)
    body, content_type = _prepare_body(data, json)

    sent = base_headers.copy()
    if headers:
        for key in headers:
            if headers[key] is None:
                if key in sent:
                    del sent[key]
            else:
                sent[key] = str(headers[key])
    if body is not None:
        sent["Content-Length"] = str(len(body.encode("utf-8")))
        if content_type and "Content-Type" not in sent:
            sent["Content-Type"] = content_type
    elif method in ("POST", "PUT", "PATCH"):
        sent["Content-Length"] = "0"

    answer = _web.fetch(method, url, dict(sent.items()), body, seconds)
    if "error" in answer:
        if answer["error"] == "url":
            raise InvalidURL("Invalid URL '" + url + "': " + answer["message"])
        raise ConnectionError(answer["message"])
    return Response(answer, PreparedRequest(method, answer["url"], sent, body))


def request(method, url, **kwargs):
    """Hace una petición con cualquier método: requests.request("GET", url, ...)."""
    return _send(method, url, _default_headers(), **kwargs)


def get(url, params=None, **kwargs):
    """Pide un recurso: requests.get(url, params=None, headers=None, timeout=None)."""
    return request("GET", url, params=params, **kwargs)


def post(url, data=None, json=None, **kwargs):
    """Envía datos para crear algo: requests.post(url, json={...})."""
    return request("POST", url, data=data, json=json, **kwargs)


def put(url, data=None, **kwargs):
    """Reemplaza un recurso entero: requests.put(url, json={...})."""
    return request("PUT", url, data=data, **kwargs)


def patch(url, data=None, **kwargs):
    """Cambia parte de un recurso: requests.patch(url, json={...})."""
    return request("PATCH", url, data=data, **kwargs)


def delete(url, **kwargs):
    """Borra un recurso: requests.delete(url)."""
    return request("DELETE", url, **kwargs)


def head(url, **kwargs):
    """Como get, pero solo trae las cabeceras."""
    kwargs.setdefault("allow_redirects", False)
    return request("HEAD", url, **kwargs)


def options(url, **kwargs):
    return request("OPTIONS", url, **kwargs)


class Session:
    """Una sesión reutiliza las mismas cabeceras en todas sus peticiones."""

    def __init__(self):
        self.headers = _default_headers()

    def request(self, method, url, **kwargs):
        return _send(method, url, self.headers, **kwargs)

    def get(self, url, params=None, **kwargs):
        return self.request("GET", url, params=params, **kwargs)

    def post(self, url, data=None, json=None, **kwargs):
        return self.request("POST", url, data=data, json=json, **kwargs)

    def put(self, url, data=None, **kwargs):
        return self.request("PUT", url, data=data, **kwargs)

    def patch(self, url, data=None, **kwargs):
        return self.request("PATCH", url, data=data, **kwargs)

    def delete(self, url, **kwargs):
        return self.request("DELETE", url, **kwargs)

    def head(self, url, **kwargs):
        kwargs.setdefault("allow_redirects", False)
        return self.request("HEAD", url, **kwargs)

    def options(self, url, **kwargs):
        return self.request("OPTIONS", url, **kwargs)

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
    accepted = 202
    no_content = 204
    moved_permanently = 301
    found = 302
    not_modified = 304
    bad_request = 400
    unauthorized = 401
    forbidden = 403
    not_found = 404
    method_not_allowed = 405
    conflict = 409
    unsupported_media_type = 415
    unprocessable_entity = 422
    too_many_requests = 429
    internal_server_error = 500
    service_unavailable = 503


codes = _Codes()
