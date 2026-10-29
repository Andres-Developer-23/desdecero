"""
urllib.parse para el simulador del curso (Skulpt no lo trae).

Incluye lo que se usa al hacer scraping: urljoin, urlparse, urlsplit,
urlunparse, urlencode, quote, unquote y parse_qs, con el mismo
comportamiento que en CPython.
"""

__all__ = [
    "urljoin",
    "urlparse",
    "urlsplit",
    "urlunparse",
    "urlunsplit",
    "urlencode",
    "quote",
    "quote_plus",
    "unquote",
    "unquote_plus",
    "parse_qs",
    "parse_qsl",
    "urldefrag",
]

uses_relative = ["", "ftp", "http", "https", "file"]
uses_netloc = ["", "ftp", "http", "https", "file"]
uses_params = ["", "ftp", "http", "https"]

_SCHEME_CHARS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-."
_ALWAYS_SAFE = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_.-~"
_HEX = "0123456789ABCDEF"


class _Result:
    _fields = ()

    def __init__(self, *values):
        self._values = tuple(values)

    def __getattr__(self, name):
        if name in self._fields:
            return self._values[self._fields.index(name)]
        raise AttributeError(name)

    def __iter__(self):
        return iter(self._values)

    def __getitem__(self, index):
        return self._values[index]

    def __len__(self):
        return len(self._values)

    def __eq__(self, other):
        return tuple(self) == tuple(other)

    def _replace(self, **changes):
        values = [changes.get(name, self._values[i]) for i, name in enumerate(self._fields)]
        return type(self)(*values)

    @property
    def hostname(self):
        netloc = self.netloc.split("@")[-1]
        if not netloc:
            return None
        if netloc.startswith("["):
            return netloc[1:].split("]")[0].lower()
        return netloc.split(":")[0].lower() or None

    @property
    def port(self):
        netloc = self.netloc.split("@")[-1]
        if ":" in netloc and not netloc.startswith("["):
            text = netloc.rsplit(":", 1)[1]
            if text.isdigit():
                return int(text)
        return None

    def __repr__(self):
        parts = [name + "=" + repr(self._values[i]) for i, name in enumerate(self._fields)]
        return type(self).__name__ + "(" + ", ".join(parts) + ")"


class ParseResult(_Result):
    _fields = ("scheme", "netloc", "path", "params", "query", "fragment")

    def geturl(self):
        return urlunparse(self)


class SplitResult(_Result):
    _fields = ("scheme", "netloc", "path", "query", "fragment")

    def geturl(self):
        return urlunsplit(self)


class DefragResult(_Result):
    _fields = ("url", "fragment")

    def geturl(self):
        return self.url + ("#" + self.fragment if self.fragment else "")


def _splitnetloc(url, start=0):
    delim = len(url)
    for c in "/?#":
        wdelim = url.find(c, start)
        if wdelim >= 0:
            delim = min(delim, wdelim)
    return url[start:delim], url[delim:]


def urlsplit(url, scheme="", allow_fragments=True):
    url = url.strip()
    netloc = query = fragment = ""
    i = url.find(":")
    if i > 0 and url[0].isalpha():
        candidate = url[:i]
        if all(c in _SCHEME_CHARS for c in candidate):
            scheme, url = candidate.lower(), url[i + 1 :]
    if url[:2] == "//":
        netloc, url = _splitnetloc(url, 2)
    if allow_fragments and "#" in url:
        url, fragment = url.split("#", 1)
    if "?" in url:
        url, query = url.split("?", 1)
    return SplitResult(scheme, netloc, url, query, fragment)


def urlparse(url, scheme="", allow_fragments=True):
    scheme, netloc, url, query, fragment = urlsplit(url, scheme, allow_fragments)
    params = ""
    if scheme in uses_params and ";" in url:
        i = url.find(";", url.rfind("/"))
        if i >= 0:
            url, params = url[:i], url[i + 1 :]
    return ParseResult(scheme, netloc, url, params, query, fragment)


def urlunsplit(components):
    scheme, netloc, url, query, fragment = tuple(components)
    if netloc or (scheme and scheme in uses_netloc and url[:2] != "//"):
        if url and url[:1] != "/":
            url = "/" + url
        url = "//" + (netloc or "") + url
    if scheme:
        url = scheme + ":" + url
    if query:
        url = url + "?" + query
    if fragment:
        url = url + "#" + fragment
    return url


def urlunparse(components):
    scheme, netloc, url, params, query, fragment = tuple(components)
    if params:
        url = url + ";" + params
    return urlunsplit((scheme, netloc, url, query, fragment))


def urljoin(base, url, allow_fragments=True):
    """Convierte una URL relativa en absoluta a partir de la URL de la página."""
    if not base:
        return url
    if not url:
        return base
    bscheme, bnetloc, bpath, bparams, bquery, bfragment = urlparse(base, "", allow_fragments)
    scheme, netloc, path, params, query, fragment = urlparse(url, bscheme, allow_fragments)
    if not scheme:
        scheme = bscheme
    if scheme != bscheme or scheme not in uses_relative:
        return url
    if scheme in uses_netloc:
        if netloc:
            return urlunparse((scheme, netloc, path, params, query, fragment))
        netloc = bnetloc
    if not path and not params:
        path = bpath
        params = bparams
        if not query:
            query = bquery
        return urlunparse((scheme, netloc, path, params, query, fragment))

    base_parts = bpath.split("/")
    if base_parts[-1] != "":
        del base_parts[-1]
    if path[:1] == "/":
        segments = path.split("/")
    else:
        segments = base_parts + path.split("/")
        segments = segments[:1] + [s for s in segments[1:-1] if s] + segments[-1:]

    resolved = []
    for seg in segments:
        if seg == "..":
            if resolved:
                resolved.pop()
        elif seg == ".":
            continue
        else:
            resolved.append(seg)
    if segments[-1] in (".", ".."):
        resolved.append("")
    return urlunparse((scheme, netloc, "/".join(resolved) or "/", params, query, fragment))


def urldefrag(url):
    if "#" in url:
        base, fragment = url.split("#", 1)
        return DefragResult(base, fragment)
    return DefragResult(url, "")


def quote(string, safe="/", encoding="utf-8", errors="strict"):
    """Codifica los caracteres especiales con %XX: quote("año 1") == "a%C3%B1o%201"."""
    if isinstance(string, str):
        data = string.encode(encoding)
    else:
        data = string
    allowed = _ALWAYS_SAFE + safe
    out = []
    for byte in data:
        char = chr(byte)
        if byte < 128 and char in allowed:
            out.append(char)
        else:
            out.append("%" + _HEX[byte // 16] + _HEX[byte % 16])
    return "".join(out)


def quote_plus(string, safe="", encoding="utf-8", errors="strict"):
    if isinstance(string, str) and " " not in string:
        return quote(string, safe, encoding, errors)
    return quote(string, safe + " ", encoding, errors).replace(" ", "+")


def unquote(string, encoding="utf-8", errors="replace"):
    if "%" not in string:
        return string
    pieces = string.split("%")
    data = list(pieces[0].encode(encoding))
    for piece in pieces[1:]:
        code = piece[:2]
        if len(code) == 2 and all(c in "0123456789abcdefABCDEF" for c in code):
            data.append(int(code, 16))
            data.extend(list(piece[2:].encode(encoding)))
        else:
            data.append(37)
            data.extend(list(piece.encode(encoding)))
    return bytes(data).decode(encoding)


def unquote_plus(string, encoding="utf-8", errors="replace"):
    return unquote(string.replace("+", " "), encoding, errors)


def urlencode(query, doseq=False, safe="", encoding=None, errors=None, quote_via=quote_plus):
    """Convierte {"q": "python", "pagina": 2} en "q=python&pagina=2"."""
    if hasattr(query, "items"):
        pairs = list(query.items())
    else:
        pairs = list(query)
    out = []
    for key, value in pairs:
        key = quote_via(str(key), safe)
        if doseq and isinstance(value, (list, tuple)):
            for item in value:
                out.append(key + "=" + quote_via(str(item), safe))
        else:
            out.append(key + "=" + quote_via(str(value), safe))
    return "&".join(out)


def parse_qsl(qs, keep_blank_values=False, strict_parsing=False):
    result = []
    for field in qs.replace(";", "&").split("&"):
        if not field:
            continue
        if "=" in field:
            name, value = field.split("=", 1)
        else:
            name, value = field, ""
        if value or keep_blank_values:
            result.append((unquote_plus(name), unquote_plus(value)))
    return result


def parse_qs(qs, keep_blank_values=False, strict_parsing=False):
    result = {}
    for name, value in parse_qsl(qs, keep_blank_values):
        result.setdefault(name, []).append(value)
    return result
