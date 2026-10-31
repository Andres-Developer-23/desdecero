"""
werkzeug.exceptions para el simulador de Flask.

Las excepciones HTTP (NotFound, BadRequest...) tienen el mismo código,
nombre, descripción y página de error que en Werkzeug 3. Flask las
convierte en la respuesta de error; abort(404) lanza NotFound.
"""

from werkzeug.http import HTTP_STATUS_CODES


def _escape(text):
    return (
        str(text)
        .replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
        .replace("'", "&#39;")
    )


class HTTPException(Exception):
    """Una respuesta de error HTTP que se puede lanzar con raise (o con abort())."""

    code = None
    description = None

    def __init__(self, description=None, response=None):
        Exception.__init__(self)
        if description is not None:
            self.description = description
        self.response = response

    @property
    def name(self):
        """El nombre del código, como «Not Found»."""
        return HTTP_STATUS_CODES.get(self.code, "Unknown Error")

    def get_description(self, environ=None, scope=None):
        description = _escape(self.description or "").replace("\n", "<br>")
        return "<p>" + description + "</p>"

    def get_body(self, environ=None, scope=None):
        """La página HTML de error."""
        return (
            "<!doctype html>\n"
            "<html lang=en>\n"
            "<title>" + str(self.code) + " " + _escape(self.name) + "</title>\n"
            "<h1>" + _escape(self.name) + "</h1>\n"
            + self.get_description(environ)
            + "\n"
        )

    def get_headers(self, environ=None, scope=None):
        return [("Content-Type", "text/html; charset=utf-8")]

    def get_response(self, environ=None, scope=None):
        """La respuesta de error que se envía al cliente."""
        if self.response is not None:
            return self.response
        from flask import Response

        return Response(self.get_body(environ), self.code, self.get_headers(environ))

    def __str__(self):
        code = self.code if self.code is not None else "???"
        return str(code) + " " + self.name + ": " + str(self.description)

    def __repr__(self):
        code = self.code if self.code is not None else "???"
        return "<" + type(self).__name__ + " '" + str(code) + ": " + self.name + "'>"


class BadRequest(HTTPException):
    code = 400
    description = "The browser (or proxy) sent a request that this server could not understand."


class BadRequestKeyError(BadRequest):
    """Se pidió en request.args (o request.form) una clave que no existe."""

    def __init__(self, key=None, description=None):
        BadRequest.__init__(self, description)
        self.key = key


class Unauthorized(HTTPException):
    code = 401
    description = (
        "The server could not verify that you are authorized to access the URL requested. "
        "You either supplied the wrong credentials (e.g. a bad password), or your browser "
        "doesn't understand how to supply the credentials required."
    )

    def __init__(self, description=None, response=None, www_authenticate=None):
        HTTPException.__init__(self, description, response)
        self.www_authenticate = www_authenticate

    def get_headers(self, environ=None, scope=None):
        headers = HTTPException.get_headers(self, environ)
        if self.www_authenticate:
            headers.append(("WWW-Authenticate", str(self.www_authenticate)))
        return headers


class Forbidden(HTTPException):
    code = 403
    description = (
        "You don't have the permission to access the requested resource. It is either "
        "read-protected or not readable by the server."
    )


class NotFound(HTTPException):
    code = 404
    description = (
        "The requested URL was not found on the server. If you entered the URL manually "
        "please check your spelling and try again."
    )


class MethodNotAllowed(HTTPException):
    code = 405
    description = "The method is not allowed for the requested URL."

    def __init__(self, valid_methods=None, description=None, response=None):
        HTTPException.__init__(self, description, response)
        self.valid_methods = valid_methods

    def get_headers(self, environ=None, scope=None):
        headers = HTTPException.get_headers(self, environ)
        if self.valid_methods:
            headers.append(("Allow", ", ".join(self.valid_methods)))
        return headers


class NotAcceptable(HTTPException):
    code = 406
    description = (
        "The resource identified by the request is only capable of generating response "
        "entities which have content characteristics not acceptable according to the "
        "accept headers sent in the request."
    )


class Conflict(HTTPException):
    code = 409
    description = (
        "A conflict happened while processing the request. The resource might have been "
        "modified while the request was being processed."
    )


class Gone(HTTPException):
    code = 410
    description = (
        "The requested URL is no longer available on this server and there is no "
        "forwarding address. If you followed a link from a foreign page, please contact "
        "the author of this page."
    )


class UnsupportedMediaType(HTTPException):
    code = 415
    description = "The server does not support the media type transmitted in the request."


class ImATeapot(HTTPException):
    code = 418
    description = "This server is a teapot, not a coffee machine"


class UnprocessableEntity(HTTPException):
    code = 422
    description = "The request was well-formed but was unable to be followed due to semantic errors."


class TooManyRequests(HTTPException):
    code = 429
    description = "This user has exceeded an allotted request count. Try again later."


class InternalServerError(HTTPException):
    code = 500
    description = (
        "The server encountered an internal error and was unable to complete your request. "
        "Either the server is overloaded or there is an error in the application."
    )

    def __init__(self, description=None, response=None, original_exception=None):
        HTTPException.__init__(self, description, response)
        self.original_exception = original_exception


class NotImplementedHTTP(HTTPException):
    code = 501
    description = "The server does not support the action requested by the browser."


class ServiceUnavailable(HTTPException):
    code = 503
    description = (
        "The server is temporarily unable to service your request due to maintenance "
        "downtime or capacity problems. Please try again later."
    )


default_exceptions = {}
for _klass in [
    BadRequest,
    Unauthorized,
    Forbidden,
    NotFound,
    MethodNotAllowed,
    NotAcceptable,
    Conflict,
    Gone,
    UnsupportedMediaType,
    ImATeapot,
    UnprocessableEntity,
    TooManyRequests,
    InternalServerError,
    NotImplementedHTTP,
    ServiceUnavailable,
]:
    default_exceptions[_klass.code] = _klass


def abort(status, *args, **kwargs):
    """Termina la petición con un error: abort(404) o abort(400, "motivo")."""
    if not isinstance(status, int):
        raise HTTPException(response=status)
    if status not in default_exceptions:
        raise LookupError("no exception for " + repr(status))
    raise default_exceptions[status](*args, **kwargs)
