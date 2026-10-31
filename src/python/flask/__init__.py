"""
Flask para el simulador del curso.

Tiene la API de Flask 3 para crear APIs web: Flask, @app.route y
@app.get/post/put/patch/delete, convertidores en las rutas (<int:id>),
request (args, get_json(), headers, authorization), respuestas desde str,
dict, list, tuplas y Response, jsonify, abort, @app.errorhandler, url_for,
redirect y app.test_client(). Los códigos, las cabeceras, el JSON y las
páginas de error son los de Flask.

La diferencia está en app.run(): no se queda esperando. Deja el servidor
en marcha en http://127.0.0.1:5000 hasta la siguiente ejecución, y la
pestaña «web» le envía las peticiones. La consola muestra el registro de
cada una, como el servidor de desarrollo de Flask.
"""

import json as _json

import _web
from urllib.parse import parse_qsl, quote, urlencode
from werkzeug.exceptions import (
    BadRequest,
    BadRequestKeyError,
    HTTPException,
    InternalServerError,
    MethodNotAllowed,
    NotFound,
    UnsupportedMediaType,
    abort as _werkzeug_abort,
    default_exceptions,
)
from werkzeug.http import HTTP_STATUS_CODES

__all__ = [
    "Flask",
    "Response",
    "abort",
    "current_app",
    "jsonify",
    "make_response",
    "redirect",
    "request",
    "url_for",
]

_TEXT_MIMETYPES = ("application/javascript", "application/xml", "application/ecmascript")


def _content_type(mimetype):
    if mimetype.startswith("text/") or mimetype in _TEXT_MIMETYPES:
        return mimetype + "; charset=utf-8"
    return mimetype


def _title_header(name):
    """«x-api-key» → «X-Api-Key», como llegan las cabeceras a Flask."""
    return "-".join(part[:1].upper() + part[1:].lower() for part in str(name).split("-"))


# ---------------------------------------------------------------------------
# Estructuras de datos: cabeceras y MultiDict
# ---------------------------------------------------------------------------


class Headers:
    """Cabeceras HTTP: no distinguen mayúsculas y se recorren como pares (nombre, valor)."""

    def __init__(self, defaults=None):
        self._list = []
        if defaults:
            self.extend(defaults)

    def _pairs(self, other):
        if isinstance(other, Headers):
            return list(other._list)
        if isinstance(other, dict):
            return list(other.items())
        return [tuple(pair) for pair in other]

    def __getitem__(self, key):
        lowered = str(key).lower()
        for name, value in self._list:
            if name.lower() == lowered:
                return value
        raise KeyError(key)

    def get(self, key, default=None, type=None):
        try:
            value = self[key]
        except KeyError:
            return default
        if type is None:
            return value
        try:
            return type(value)
        except (ValueError, TypeError):
            return default

    def getlist(self, key):
        lowered = str(key).lower()
        return [value for name, value in self._list if name.lower() == lowered]

    def __setitem__(self, key, value):
        self.set(key, value)

    def set(self, key, value):
        lowered = str(key).lower()
        for index in range(len(self._list)):
            if self._list[index][0].lower() == lowered:
                self._list[index] = (str(key), str(value))
                self._list = [
                    pair for i, pair in enumerate(self._list) if i <= index or pair[0].lower() != lowered
                ]
                return
        self._list.append((str(key), str(value)))

    def setdefault(self, key, default):
        if key in self:
            return self[key]
        self.set(key, default)
        return default

    def add(self, key, value):
        self._list.append((str(key), str(value)))

    def extend(self, other):
        for key, value in self._pairs(other):
            self.add(key, value)

    def update(self, other):
        for key, value in self._pairs(other):
            self.set(key, value)

    def __delitem__(self, key):
        lowered = str(key).lower()
        if key not in self:
            raise KeyError(key)
        self._list = [pair for pair in self._list if pair[0].lower() != lowered]

    def remove(self, key):
        del self[key]

    def pop(self, key, default=None):
        if key not in self:
            return default
        value = self[key]
        del self[key]
        return value

    def __contains__(self, key):
        lowered = str(key).lower()
        for name, value in self._list:
            if name.lower() == lowered:
                return True
        return False

    def __iter__(self):
        return iter(list(self._list))

    def __len__(self):
        return len(self._list)

    def keys(self):
        return [name for name, value in self._list]

    def values(self):
        return [value for name, value in self._list]

    def items(self):
        return list(self._list)

    def to_wsgi_list(self):
        return list(self._list)

    def copy(self):
        return Headers(self._list)

    def __eq__(self, other):
        if isinstance(other, Headers):
            return self._list == other._list
        return NotImplemented

    def __repr__(self):
        return "Headers(" + repr(self._list) + ")"

    def __str__(self):
        return "".join(name + ": " + value + "\r\n" for name, value in self._list) + "\r\n"


class MultiDict:
    """Parámetros de la consulta o de un formulario: una clave puede repetirse (?tag=a&tag=b)."""

    def __init__(self, pairs=None):
        self._pairs = list(pairs or [])

    def __getitem__(self, key):
        for name, value in self._pairs:
            if name == key:
                return value
        raise BadRequestKeyError(key)

    def get(self, key, default=None, type=None):
        for name, value in self._pairs:
            if name == key:
                if type is None:
                    return value
                try:
                    return type(value)
                except (ValueError, TypeError):
                    return default
        return default

    def getlist(self, key, type=None):
        result = []
        for name, value in self._pairs:
            if name == key:
                if type is None:
                    result.append(value)
                else:
                    try:
                        result.append(type(value))
                    except (ValueError, TypeError):
                        pass
        return result

    def keys(self):
        seen = []
        for name, value in self._pairs:
            if name not in seen:
                seen.append(name)
        return seen

    def values(self):
        return [self.get(key) for key in self.keys()]

    def items(self, multi=False):
        if multi:
            return list(self._pairs)
        return [(key, self.get(key)) for key in self.keys()]

    def lists(self):
        return [(key, self.getlist(key)) for key in self.keys()]

    def to_dict(self, flat=True):
        if flat:
            return dict(self.items())
        return dict(self.lists())

    def __contains__(self, key):
        return key in self.keys()

    def __iter__(self):
        return iter(self.keys())

    def __len__(self):
        return len(self.keys())

    def __bool__(self):
        return bool(self._pairs)

    def __repr__(self):
        return "ImmutableMultiDict(" + repr(self._pairs) + ")"


class Authorization:
    """La cabecera Authorization ya interpretada: type ("bearer", "basic"...) y token."""

    def __init__(self, auth_type, token=None):
        self.type = auth_type
        self.token = token
        self.parameters = {}

    def get(self, key, default=None):
        return self.parameters.get(key, default)

    def __repr__(self):
        return "<Authorization " + self.type + ">"


# ---------------------------------------------------------------------------
# Petición y respuesta
# ---------------------------------------------------------------------------


class Request:
    """La petición que está atendiendo Flask (en las vistas, el objeto request)."""

    def __init__(self, method, path, query="", headers=None, body="", host="127.0.0.1:5000"):
        self.method = str(method).upper()
        self.path = path or "/"
        self.query_string = (query or "").encode("utf-8")
        self.args = MultiDict(parse_qsl(query or "", keep_blank_values=True))
        self.headers = Headers()
        for name, value in Headers(headers or [])._list:
            self.headers.add(_title_header(name), value)
        if "Host" not in self.headers:
            self.headers.set("Host", host)
        self.host = self.headers["Host"]
        self.scheme = "http"
        self.remote_addr = "127.0.0.1"
        self.root_url = "http://" + self.host + "/"
        self.host_url = self.root_url
        self.base_url = "http://" + self.host + quote(self.path)
        self.url = self.base_url + ("?" + query if query else "")
        self.full_path = quote(self.path) + "?" + (query or "")
        self.url_rule = None
        self.endpoint = None
        self.view_args = {}
        self._body = body or ""

    @property
    def content_type(self):
        return self.headers.get("Content-Type")

    @property
    def mimetype(self):
        return (self.content_type or "").split(";")[0].strip().lower()

    @property
    def is_json(self):
        mimetype = self.mimetype
        return mimetype == "application/json" or (
            mimetype.startswith("application/") and mimetype.endswith("+json")
        )

    @property
    def content_length(self):
        return self.headers.get("Content-Length", type=int)

    @property
    def data(self):
        return self._body.encode("utf-8")

    def get_data(self, cache=True, as_text=False, parse_form_data=False):
        return self._body if as_text else self._body.encode("utf-8")

    @property
    def form(self):
        if self.mimetype == "application/x-www-form-urlencoded":
            return MultiDict(parse_qsl(self._body, keep_blank_values=True))
        return MultiDict()

    @property
    def values(self):
        return MultiDict(self.args.items(multi=True) + self.form.items(multi=True))

    def get_json(self, force=False, silent=False, cache=True):
        """El cuerpo de la petición convertido de JSON (415 si no se envió como JSON, 400 si no es válido)."""
        if not (force or self.is_json):
            if silent:
                return None
            raise UnsupportedMediaType(
                "Did not attempt to load JSON data because the request Content-Type was not 'application/json'."
            )
        try:
            return _json.loads(self._body)
        except ValueError as error:
            if silent:
                return None
            app = _current_app_or_none()
            if app is not None and app.debug:
                raise BadRequest("Failed to decode JSON object: " + str(error))
            raise BadRequest()

    @property
    def json(self):
        return self.get_json()

    @property
    def authorization(self):
        value = self.headers.get("Authorization")
        if not value or not value.strip():
            return None
        parts = value.strip().split(None, 1)
        auth_type = parts[0].lower()
        token = parts[1].strip() if len(parts) > 1 else None
        return Authorization(auth_type, token)

    @property
    def user_agent(self):
        return self.headers.get("User-Agent", "")

    def __repr__(self):
        return "<Request '" + self.url + "' [" + self.method + "]>"


class Response:
    """Una respuesta HTTP: cuerpo, código de estado y cabeceras."""

    default_status = 200
    default_mimetype = "text/html"

    def __init__(self, response=None, status=None, headers=None, mimetype=None, content_type=None):
        self.headers = Headers(headers)
        if content_type is None:
            if mimetype is None and "Content-Type" not in self.headers:
                mimetype = self.default_mimetype
            if mimetype is not None:
                content_type = _content_type(mimetype)
        if content_type is not None:
            self.headers.set("Content-Type", content_type)
        if status is None:
            status = self.default_status
        self.status = status
        if response is None:
            response = ""
        elif isinstance(response, (list, tuple)):
            response = "".join(part.decode("utf-8") if isinstance(part, bytes) else part for part in response)
        self.set_data(response)

    @property
    def status_code(self):
        return self._status_code

    @status_code.setter
    def status_code(self, code):
        self._status_code = int(code)
        self._status = str(code) + " " + HTTP_STATUS_CODES.get(int(code), "Unknown").upper()

    @property
    def status(self):
        return self._status

    @status.setter
    def status(self, value):
        if isinstance(value, int):
            self.status_code = value
            return
        text = str(value).strip()
        code = text.split(" ", 1)[0]
        if not code.isdigit():
            raise ValueError("Invalid status argument")
        self._status_code = int(code)
        self._status = text if " " in text else code + " " + HTTP_STATUS_CODES.get(int(code), "Unknown").upper()

    def set_data(self, value):
        if isinstance(value, bytes):
            value = value.decode("utf-8")
        self._data = str(value)
        self.headers.set("Content-Length", str(len(self._data.encode("utf-8"))))

    def get_data(self, as_text=False):
        return self._data if as_text else self._data.encode("utf-8")

    @property
    def data(self):
        return self.get_data()

    @data.setter
    def data(self, value):
        self.set_data(value)

    @property
    def text(self):
        return self.get_data(as_text=True)

    @property
    def content_type(self):
        return self.headers.get("Content-Type")

    @property
    def mimetype(self):
        value = self.content_type
        return value.split(";")[0].strip() if value else None

    @property
    def content_length(self):
        return self.headers.get("Content-Length", type=int)

    @property
    def location(self):
        return self.headers.get("Location")

    @property
    def is_json(self):
        mimetype = self.mimetype or ""
        return mimetype == "application/json" or (
            mimetype.startswith("application/") and mimetype.endswith("+json")
        )

    def get_json(self, force=False, silent=False):
        if not (force or self.is_json):
            return None
        try:
            return _json.loads(self._data)
        except ValueError:
            if not silent:
                raise
            return None

    @property
    def json(self):
        return self.get_json()

    def __repr__(self):
        return "<" + type(self).__name__ + " " + str(len(self._data.encode("utf-8"))) + " bytes [" + self._status + "]>"


class TestResponse(Response):
    """La respuesta que devuelve el cliente de pruebas (app.test_client())."""

    def __init__(self, response, request):
        Response.__init__(self, response.get_data(as_text=True), response.status, response.headers.items())
        self.headers = response.headers.copy()
        self.request = request
        self.history = []


# ---------------------------------------------------------------------------
# JSON
# ---------------------------------------------------------------------------


def _json_default(value):
    import dataclasses

    if dataclasses.is_dataclass(value) and not isinstance(value, type):
        return dataclasses.asdict(value)
    if hasattr(value, "__html__"):
        return str(value.__html__())
    raise TypeError("Object of type " + type(value).__name__ + " is not JSON serializable")


class DefaultJSONProvider:
    """Cómo Flask convierte en JSON: ordena las claves y escapa lo que no es ASCII."""

    ensure_ascii = True
    sort_keys = True
    compact = None
    mimetype = "application/json"

    def __init__(self, app):
        self._app = app

    def dumps(self, obj, **kwargs):
        kwargs.setdefault("default", _json_default)
        kwargs.setdefault("ensure_ascii", self.ensure_ascii)
        kwargs.setdefault("sort_keys", self.sort_keys)
        return _json.dumps(obj, **kwargs)

    def loads(self, s, **kwargs):
        return _json.loads(s, **kwargs)

    def response(self, *args, **kwargs):
        if args and kwargs:
            raise TypeError("app.json.response() takes either args or kwargs, not both")
        if not args and not kwargs:
            obj = None
        elif len(args) == 1:
            obj = args[0]
        else:
            obj = list(args) if args else kwargs
        dump_args = {}
        if (self.compact is None and self._app.debug) or self.compact is False:
            dump_args["indent"] = 2
        else:
            dump_args["separators"] = (",", ":")
        return Response(self.dumps(obj, **dump_args) + "\n", mimetype=self.mimetype)


# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------

_CONVERTERS = {
    "default": ("[^/]+", str),
    "string": ("[^/]+", str),
    "int": ("\\d+", int),
    "float": ("\\d+\\.\\d+", float),
    "path": ("[^/].*?", str),
}

_REGEX_SPECIAL = "\\.^$*+?{}[]|()"


def _escape_regex(text):
    return "".join("\\" + char if char in _REGEX_SPECIAL else char for char in text)


class Rule:
    """Una ruta: «/libros/<int:id>» con sus métodos y su vista."""

    def __init__(self, rule, endpoint, methods):
        import re

        if not rule.startswith("/"):
            raise ValueError("urls must start with a leading slash")
        self.rule = rule
        self.endpoint = endpoint
        self.methods = set(method.upper() for method in methods)
        if "GET" in self.methods:
            self.methods.add("HEAD")
        # Como Flask, responde solo a OPTIONS salvo que la vista lo pida.
        self.automatic_options = "OPTIONS" not in self.methods
        self.methods.add("OPTIONS")
        self.arguments = []
        self._parts = []
        pattern = ""
        rest = rule
        while "<" in rest:
            start = rest.index("<")
            end = rest.index(">", start)
            static = rest[:start]
            pattern += _escape_regex(static)
            self._parts.append(("static", static))
            inside = rest[start + 1 : end]
            converter, name = ("default", inside)
            if ":" in inside:
                converter, name = inside.split(":", 1)
            if converter not in _CONVERTERS:
                raise LookupError("the converter " + repr(converter) + " does not exist")
            regex, convert = _CONVERTERS[converter]
            pattern += "(" + regex + ")"
            self.arguments.append((name, convert))
            self._parts.append(("var", name))
            rest = rest[end + 1 :]
        pattern += _escape_regex(rest)
        self._parts.append(("static", rest))
        self._regex = re.compile("^" + pattern + "$")
        self.is_static = not self.arguments

    def match(self, path):
        """Los valores de la ruta si coincide ({"id": 3}), o None."""
        found = self._regex.match(path)
        if found is None:
            return None
        values = {}
        for index in range(len(self.arguments)):
            name, convert = self.arguments[index]
            values[name] = convert(found.group(index + 1))
        return values

    def build(self, values):
        path = ""
        for kind, text in self._parts:
            if kind == "static":
                path += text
            else:
                if text not in values:
                    return None
                path += quote(str(values[text]), safe="")
        return path

    def __repr__(self):
        return "<Rule '" + self.rule + "' (" + ", ".join(sorted(self.methods)) + ") -> " + self.endpoint + ">"


class BuildError(LookupError):
    """url_for() no encontró la vista o le faltan valores."""


class RequestRedirect(HTTPException):
    """La ruta termina en «/» y se pidió sin ella: Flask redirige con 308."""

    code = 308

    def __init__(self, new_url):
        HTTPException.__init__(self)
        self.new_url = new_url

    def get_response(self, environ=None, scope=None):
        return redirect(self.new_url, 308)


# ---------------------------------------------------------------------------
# Contexto: la aplicación y la petición en curso
# ---------------------------------------------------------------------------

_request_stack = []
_app_stack = []


def _current_app_or_none():
    return _app_stack[-1] if _app_stack else None


class _RequestProxy:
    """El objeto request: apunta a la petición que se está atendiendo."""

    def __getattr__(self, name):
        if not _request_stack:
            raise RuntimeError(
                "Working outside of request context. Usa request solo dentro de una vista "
                "(una función decorada con @app.route) mientras atiende una petición."
            )
        return getattr(_request_stack[-1], name)

    def __repr__(self):
        if not _request_stack:
            return "<LocalProxy unbound>"
        return repr(_request_stack[-1])


class _AppProxy:
    """current_app: la aplicación que está atendiendo la petición."""

    def __getattr__(self, name):
        if not _app_stack:
            raise RuntimeError("Working outside of application context.")
        return getattr(_app_stack[-1], name)


request = _RequestProxy()
current_app = _AppProxy()


class _AppContext:
    def __init__(self, app):
        self.app = app

    def __enter__(self):
        _app_stack.append(self.app)
        return self

    def __exit__(self, *args):
        _app_stack.pop()
        return False

    def push(self):
        _app_stack.append(self.app)

    def pop(self):
        _app_stack.pop()


# ---------------------------------------------------------------------------
# Funciones de ayuda
# ---------------------------------------------------------------------------


def jsonify(*args, **kwargs):
    """Una respuesta JSON: jsonify(nombre="Ana") o jsonify(lista)."""
    if not _app_stack:
        raise RuntimeError("Working outside of application context.")
    return _app_stack[-1].json.response(*args, **kwargs)


def abort(code, *args, **kwargs):
    """Termina la petición con un error HTTP: abort(404) o abort(400, description="...")."""
    _werkzeug_abort(code, *args, **kwargs)


def make_response(*args):
    """Convierte lo que devolvería una vista en un objeto Response para poder cambiarlo."""
    if not _app_stack:
        raise RuntimeError("Working outside of application context.")
    if not args:
        return Response()
    if len(args) == 1:
        args = args[0]
    return _app_stack[-1].make_response(args)


def redirect(location, code=302, Response=None):
    """Una respuesta que lleva al navegador a otra dirección."""
    from flask import Response as _Response

    klass = Response or _Response
    html_location = str(location).replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;")
    body = (
        "<!doctype html>\n"
        "<html lang=en>\n"
        "<title>Redirecting...</title>\n"
        "<h1>Redirecting...</h1>\n"
        "<p>You should be redirected automatically to the target URL: "
        '<a href="' + html_location + '">' + html_location + "</a>. If not, click the link.\n"
    )
    response = klass(body, code, mimetype="text/html")
    response.headers.set("Location", location)
    return response


def url_for(endpoint, **values):
    """La URL de una vista: url_for("ver_libro", id=3) → "/libros/3"."""
    if not _app_stack:
        raise RuntimeError("Attempted to generate a URL without the application context being pushed.")
    return _app_stack[-1].url_for(endpoint, **values)


# ---------------------------------------------------------------------------
# La aplicación
# ---------------------------------------------------------------------------


class Flask:
    """Una aplicación web: Flask(__name__)."""

    response_class = Response
    json_provider_class = DefaultJSONProvider

    def __init__(self, import_name, **options):
        self.import_name = import_name
        self.name = "app" if import_name == "__main__" else import_name
        self.debug = False
        self.testing = False
        self.config = {"DEBUG": False, "TESTING": False, "SERVER_NAME": None}
        self.json = self.json_provider_class(self)
        self.url_map = []
        self.view_functions = {}
        self._error_handlers = []
        self._running = None
        self._got_first_request = False

    def _check_setup(self, name):
        if self._got_first_request:
            raise AssertionError(
                "The setup method '" + name + "' can no longer be called on the application. "
                "It has already handled its first request, any changes will not be applied "
                "consistently.\nMake sure all imports, decorators, functions, etc. needed to set "
                "up the application are done before running it."
            )

    # ---- Registrar rutas ----

    def route(self, rule, **options):
        """Asocia una URL con la función que la atiende: @app.route("/libros", methods=["GET"])."""
        self._check_setup("route")

        def decorator(view):
            endpoint = options.pop("endpoint", None)
            self.add_url_rule(rule, endpoint, view, **options)
            return view

        return decorator

    def _method_route(self, method, rule, options):
        self._check_setup(method.lower())
        if "methods" in options:
            raise TypeError("Use the 'route' decorator to use the 'methods' argument.")
        options["methods"] = [method]
        return self.route(rule, **options)

    def get(self, rule, **options):
        return self._method_route("GET", rule, options)

    def post(self, rule, **options):
        return self._method_route("POST", rule, options)

    def put(self, rule, **options):
        return self._method_route("PUT", rule, options)

    def patch(self, rule, **options):
        return self._method_route("PATCH", rule, options)

    def delete(self, rule, **options):
        return self._method_route("DELETE", rule, options)

    def add_url_rule(self, rule, endpoint=None, view_func=None, methods=None, **options):
        self._check_setup("add_url_rule")
        if endpoint is None:
            endpoint = view_func.__name__
        if methods is None:
            methods = ["GET"]
        if isinstance(methods, str):
            raise TypeError(
                "Allowed methods must be a list of strings, for example: @app.route(..., methods=[\"POST\"])"
            )
        existing = self.view_functions.get(endpoint)
        if view_func is not None and existing is not None and existing is not view_func:
            raise AssertionError(
                "View function mapping is overwriting an existing endpoint function: " + endpoint
            )
        self.url_map.append(Rule(rule, endpoint, methods))
        if view_func is not None:
            self.view_functions[endpoint] = view_func

    # ---- Errores ----

    def errorhandler(self, code_or_exception):
        """Registra una función que responde a un error: @app.errorhandler(404)."""

        self._check_setup("errorhandler")

        def decorator(handler):
            self.register_error_handler(code_or_exception, handler)
            return handler

        return decorator

    def register_error_handler(self, code_or_exception, handler):
        self._check_setup("register_error_handler")
        if isinstance(code_or_exception, int):
            if code_or_exception not in default_exceptions:
                raise ValueError(
                    "'" + str(code_or_exception) + "' is not a recognized HTTP error code. "
                    "Use a subclass of HTTPException with that code instead."
                )
            code_or_exception = default_exceptions[code_or_exception]
        self._error_handlers.append((code_or_exception, handler))

    def _find_error_handler(self, error):
        for klass in type(error).__mro__:
            for registered, handler in reversed(self._error_handlers):
                if registered is klass:
                    return handler
        return None

    # ---- Atender una petición ----

    def app_context(self):
        return _AppContext(self)

    def make_response(self, rv):
        """Convierte lo que devuelve una vista en un objeto Response."""
        status = None
        headers = None
        if isinstance(rv, tuple):
            if len(rv) == 3:
                rv, status, headers = rv
            elif len(rv) == 2:
                if isinstance(rv[1], (Headers, dict, tuple, list)):
                    rv, headers = rv
                else:
                    rv, status = rv
            else:
                raise TypeError(
                    "The view function did not return a valid response tuple. The tuple must have "
                    "the form (body, status, headers), (body, status), or (body, headers)."
                )
        if rv is None:
            endpoint = _request_stack[-1].endpoint if _request_stack else None
            raise TypeError(
                "The view function for " + repr(endpoint) + " did not return a valid response. "
                "The function either returned None or ended without a return statement."
            )
        if not isinstance(rv, Response):
            if isinstance(rv, (str, bytes)):
                rv = self.response_class(rv, status=status, headers=headers)
                status = None
                headers = None
            elif isinstance(rv, (dict, list)):
                rv = self.json.response(rv)
            else:
                raise TypeError(
                    "The view function did not return a valid response. The return type must be a "
                    "string, dict, list, tuple with headers or status, Response instance, or WSGI "
                    "callable, but it was a " + type(rv).__name__ + "."
                )
        if status is not None:
            if isinstance(status, (str, bytes)):
                rv.status = status if isinstance(status, str) else status.decode("utf-8")
            else:
                rv.status_code = status
        if headers:
            rv.headers.update(headers)
        return rv

    def _match(self, request):
        """La regla y los valores de la URL, o lanza el error HTTP que corresponde."""
        path = request.path
        found = []
        for rule in [r for r in self.url_map if r.is_static] + [r for r in self.url_map if not r.is_static]:
            values = rule.match(path)
            if values is not None:
                found.append((rule, values))
        if not found and not path.endswith("/"):
            for rule in self.url_map:
                if rule.rule.endswith("/") and rule.match(path + "/") is not None:
                    query = request.query_string.decode("utf-8")
                    new_url = "http://" + request.host + quote(path) + "/" + ("?" + query if query else "")
                    raise RequestRedirect(new_url)
        if not found:
            raise NotFound()
        allowed = set()
        for rule, values in found:
            allowed.update(rule.methods)
        for rule, values in found:
            if request.method in rule.methods:
                if request.method == "OPTIONS" and rule.automatic_options:
                    return None, sorted(allowed)
                return rule, values
        raise MethodNotAllowed(valid_methods=sorted(allowed))

    def _handle_user_exception(self, error):
        # Las redirecciones de las rutas no son errores: no pasan por los manejadores.
        if isinstance(error, RequestRedirect) or error.code is None:
            return error.get_response()
        handler = self._find_error_handler(error)
        if handler is not None:
            return self.make_response(handler(error))
        if isinstance(error, HTTPException):
            return error.get_response()
        raise error

    def _handle_exception(self, error, request):
        """Una excepción que no es HTTP: se registra en la consola y se responde 500."""
        handler = self._find_error_handler(error)
        if handler is not None:
            return self.make_response(handler(error))
        print(
            "[" + _web.log_time(True) + "] ERROR in " + self.name + ": Exception on "
            + request.path + " [" + request.method + "]"
        )
        _web.report_error(error)
        server_error = InternalServerError(original_exception=error)
        handler = self._find_error_handler(server_error)
        if handler is not None:
            return self.make_response(handler(server_error))
        if self.debug:
            body = (
                "<!doctype html>\n<html lang=en>\n<title>" + type(error).__name__
                + " // Werkzeug Debugger</title>\n<h1>" + type(error).__name__ + "</h1>\n<p>"
                + str(error).replace("&", "&amp;").replace("<", "&lt;")
                + "</p>\n<p>Mira la consola: ahí está la línea del error.</p>\n"
            )
            return self.response_class(body, 500)
        return server_error.get_response()

    def _dispatch(self, request):
        """Atiende una petición y devuelve la respuesta (nunca lanza excepciones)."""
        self._got_first_request = True
        _request_stack.append(request)
        _app_stack.append(self)
        try:
            try:
                try:
                    rule, values = self._match(request)
                    if rule is None:
                        response = self.response_class("", 200)
                        response.headers.set("Allow", ", ".join(values))
                    else:
                        request.url_rule = rule
                        request.endpoint = rule.endpoint
                        request.view_args = values
                        view = self.view_functions[rule.endpoint]
                        response = self.make_response(view(**values))
                except HTTPException as error:
                    response = self._handle_user_exception(error)
            except Exception as error:
                try:
                    response = self._handle_exception(error, request)
                except Exception as second:
                    _web.report_error(second)
                    response = InternalServerError().get_response()
            if request.method == "HEAD" or response.status_code in (204, 304):
                length = response.headers.get("Content-Length")
                response.set_data("")
                response.headers.remove("Content-Length")
                if length is not None and request.method == "HEAD" and response.status_code not in (204, 304):
                    response.headers.set("Content-Length", length)
            return response
        finally:
            _request_stack.pop()
            _app_stack.pop()

    def url_for(self, endpoint, **values):
        external = values.pop("_external", False)
        values.pop("_method", None)
        anchor = values.pop("_anchor", None)
        for rule in self.url_map:
            if rule.endpoint != endpoint:
                continue
            path = rule.build(values)
            if path is None:
                continue
            extra = [(key, value) for key, value in values.items() if key not in [n for n, c in rule.arguments]]
            if extra:
                path += "?" + urlencode(extra)
            if anchor:
                path += "#" + quote(anchor)
            if external:
                host = _request_stack[-1].host if _request_stack else "localhost"
                path = "http://" + host + path
            return path
        raise BuildError("Could not build url for endpoint " + repr(endpoint) + ". Did you mean to use a different endpoint name or forget a value?")

    def test_client(self, use_cookies=True, **kwargs):
        """Un cliente para probar la aplicación sin servidor: client.get("/"), client.post(..., json=...)."""
        return FlaskClient(self)

    def run(self, host=None, port=None, debug=None, load_dotenv=True, **options):
        """Arranca el servidor de desarrollo en http://127.0.0.1:5000."""
        if debug is not None:
            self.debug = bool(debug)
            self.config["DEBUG"] = self.debug
        host = host or "127.0.0.1"
        port = int(port or 5000)
        print(" * Serving Flask app '" + self.name + "'")
        print(" * Debug mode: " + ("on" if self.debug else "off"))
        print(
            "WARNING: This is a development server. Do not use it in a production deployment. "
            "Use a production WSGI server instead."
        )
        print(" * Running on http://" + host + ":" + str(port))
        print("Press CTRL+C to quit")
        self._running = host + ":" + str(port)
        _web.serve(self._serve, host, port)

    def _serve(self, method, path, query, headers, body):
        """Puente con la pestaña «web»: atiende una petición y la devuelve como diccionario."""
        request = Request(method, path, query or "", headers or {}, body or "", self._running)
        response = self._dispatch(request)
        response.headers.set("Server", "Werkzeug/3.1.9 Python/3.13.5")
        response.headers.set("Date", _web.log_time(False))
        response.headers.set("Connection", "close")
        return {
            "status": response.status_code,
            "status_text": response.status,
            "headers": [[name, value] for name, value in response.headers.items()],
            "body": response.get_data(as_text=True),
        }

    def __repr__(self):
        return "<Flask '" + self.name + "'>"


class FlaskClient:
    """Cliente de pruebas: hace peticiones a la aplicación sin arrancar el servidor."""

    def __init__(self, application):
        self.application = application

    def open(self, path="/", method="GET", query_string=None, headers=None, data=None, json=None, content_type=None, follow_redirects=False, **kwargs):
        method = str(kwargs.pop("method", method)).upper()
        query = ""
        if "?" in path:
            path, query = path.split("?", 1)
        if query_string:
            extra = query_string if isinstance(query_string, str) else urlencode(query_string, doseq=True)
            query = query + "&" + extra if query else extra
        sent = Headers(headers or [])
        sent.setdefault("Host", "localhost")
        sent.setdefault("User-Agent", "Werkzeug/3.1.9")
        body = ""
        if json is not None:
            body = self.application.json.dumps(json)
            content_type = content_type or "application/json"
        elif isinstance(data, dict):
            body = urlencode(data, doseq=True)
            content_type = content_type or "application/x-www-form-urlencoded"
        elif data is not None:
            body = data.decode("utf-8") if isinstance(data, bytes) else str(data)
        if content_type:
            sent.set("Content-Type", content_type)
        if body:
            sent.set("Content-Length", str(len(body.encode("utf-8"))))
        request = Request(method, path, query, sent.items(), body, sent["Host"])
        response = TestResponse(self.application._dispatch(request), request)
        history = []
        while follow_redirects and response.status_code in (301, 302, 303, 307, 308) and response.location:
            history.append(response)
            location = response.location
            if location.startswith("http://"):
                location = "/" + location.split("/", 3)[3] if location.count("/") >= 3 else "/"
            next_method = method if response.status_code in (307, 308) else "GET"
            next_body = body if response.status_code in (307, 308) else ""
            request = Request(next_method, location.split("?", 1)[0], location.split("?", 1)[1] if "?" in location else "", sent.items(), next_body, sent["Host"])
            response = TestResponse(self.application._dispatch(request), request)
        response.history = history
        return response

    def get(self, *args, **kwargs):
        kwargs["method"] = "GET"
        return self.open(*args, **kwargs)

    def post(self, *args, **kwargs):
        kwargs["method"] = "POST"
        return self.open(*args, **kwargs)

    def put(self, *args, **kwargs):
        kwargs["method"] = "PUT"
        return self.open(*args, **kwargs)

    def patch(self, *args, **kwargs):
        kwargs["method"] = "PATCH"
        return self.open(*args, **kwargs)

    def delete(self, *args, **kwargs):
        kwargs["method"] = "DELETE"
        return self.open(*args, **kwargs)

    def head(self, *args, **kwargs):
        kwargs["method"] = "HEAD"
        return self.open(*args, **kwargs)

    def options(self, *args, **kwargs):
        kwargs["method"] = "OPTIONS"
        return self.open(*args, **kwargs)

    def __enter__(self):
        return self

    def __exit__(self, *args):
        return False
