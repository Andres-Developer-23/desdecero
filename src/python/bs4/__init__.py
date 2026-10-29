"""
BeautifulSoup 4 para el simulador del curso.

El HTML lo analiza el navegador (DOMParser), así que se entiende igual que
en una web de verdad, incluso si está mal cerrado. Este módulo recorre el
árbol resultante con la API de bs4: find, find_all, select, select_one,
get_text, atributos, padres y hermanos.

select() y select_one() usan querySelectorAll del navegador, así que
admiten cualquier selector CSS.
"""

import re as _re

import _web

__version__ = "4.12.3"
__all__ = ["BeautifulSoup", "Tag", "NavigableString", "Comment", "FeatureNotFound"]

_PARSERS = ("html.parser", "lxml", "html5lib", "html", "lxml-html")
# Atributos que pueden tener varios valores separados por espacios: tag["class"] es una lista.
_MULTI_VALUED = ("class", "rel", "rev", "accept-charset", "headers", "accesskey", "dropzone")
_VOID = ("area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr")
# Su texto no cuenta en get_text(): no se ve en la página.
_HIDDEN = ("script", "style", "template")
_RE_TYPE = type(_re.compile(""))


class FeatureNotFound(ValueError):
    pass


def _escape(text, attribute=False):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    if attribute:
        text = text.replace('"', "&quot;")
    return text


# ---------------------------------------------------------------------------
# Elementos del árbol
# ---------------------------------------------------------------------------


class PageElement:
    """Lo que comparten etiquetas y textos: padre, hermanos y búsquedas hacia fuera."""

    parent = None

    def _siblings(self):
        if self.parent is None:
            return [self]
        return self.parent.contents

    def _index(self):
        siblings = self._siblings()
        for i in range(len(siblings)):
            if siblings[i] is self:
                return i
        return -1

    @property
    def next_sibling(self):
        siblings = self._siblings()
        i = self._index()
        return siblings[i + 1] if 0 <= i < len(siblings) - 1 else None

    @property
    def previous_sibling(self):
        siblings = self._siblings()
        i = self._index()
        return siblings[i - 1] if i > 0 else None

    @property
    def next_siblings(self):
        siblings = self._siblings()
        return iter(siblings[self._index() + 1 :])

    @property
    def previous_siblings(self):
        siblings = self._siblings()
        before = siblings[: self._index()]
        before.reverse()
        return iter(before)

    @property
    def parents(self):
        result = []
        node = self.parent
        while node is not None:
            result.append(node)
            node = node.parent
        return iter(result)

    def find_next_sibling(self, name=None, attrs={}, string=None, **kwargs):
        found = self.find_next_siblings(name, attrs, string, 1, **kwargs)
        return found[0] if found else None

    def find_next_siblings(self, name=None, attrs={}, string=None, limit=None, **kwargs):
        rule = _Rule(name, attrs, string, kwargs)
        return _filter(self.next_siblings, rule, limit)

    def find_previous_sibling(self, name=None, attrs={}, string=None, **kwargs):
        found = self.find_previous_siblings(name, attrs, string, 1, **kwargs)
        return found[0] if found else None

    def find_previous_siblings(self, name=None, attrs={}, string=None, limit=None, **kwargs):
        rule = _Rule(name, attrs, string, kwargs)
        return _filter(self.previous_siblings, rule, limit)

    def find_parent(self, name=None, attrs={}, **kwargs):
        found = self.find_parents(name, attrs, 1, **kwargs)
        return found[0] if found else None

    def find_parents(self, name=None, attrs={}, limit=None, **kwargs):
        rule = _Rule(name, attrs, None, kwargs)
        candidates = [node for node in self.parents if not isinstance(node, BeautifulSoup)]
        return _filter(candidates, rule, limit)

    def _following(self):
        """Todo lo que viene después en el documento, en orden."""
        result = []
        node = self
        while node is not None:
            sibling = node.next_sibling
            while sibling is not None:
                result.append(sibling)
                if isinstance(sibling, Tag):
                    result.extend(sibling.descendants)
                sibling = sibling.next_sibling
            node = node.parent
        return result

    def find_next(self, name=None, attrs={}, string=None, **kwargs):
        found = self.find_all_next(name, attrs, string, 1, **kwargs)
        return found[0] if found else None

    def find_all_next(self, name=None, attrs={}, string=None, limit=None, **kwargs):
        start = list(self.descendants) if isinstance(self, Tag) else []
        rule = _Rule(name, attrs, string, kwargs)
        return _filter(start + self._following(), rule, limit)

    def extract(self):
        """Quita el elemento del árbol y lo devuelve."""
        if self.parent is not None:
            i = self._index()
            del self.parent.contents[i]
            self.parent = None
        return self

    def decompose(self):
        self.extract()


class NavigableString(str, PageElement):
    """Un texto dentro del HTML. Se usa como cualquier str."""

    @property
    def name(self):
        return None

    @property
    def string(self):
        return self

    def get_text(self, separator="", strip=False):
        return self.strip() if strip else str(self)

    @property
    def text(self):
        return str(self)

    def _html(self):
        if self.parent is not None and self.parent.name in ("script", "style"):
            return str(self)
        return _escape(str(self))

    def __repr__(self):
        return repr(str(self))

    def __eq__(self, other):
        return str(self) == other

    def __ne__(self, other):
        return str(self) != other

    def __hash__(self):
        return hash(str(self))


class Comment(NavigableString):
    def _html(self):
        return "<!--" + str(self) + "-->"


class Doctype(NavigableString):
    def _html(self):
        return "<!DOCTYPE " + str(self) + ">"


class ResultSet(list):
    """Lista de resultados de find_all() y select()."""

    def __getattr__(self, name):
        raise AttributeError(
            "ResultSet object has no attribute '" + name + "'. You're probably treating a list of "
            "elements like a single element. Did you call find_all() when you meant to call find()?"
        )


class Tag(PageElement):
    """Una etiqueta HTML: <a href="...">texto</a>."""

    def __init__(self, name, attrs=None, parent=None, index=-1, document=None):
        self.name = name
        self.attrs = attrs if attrs is not None else {}
        self.contents = []
        self.parent = parent
        self._node = index
        self._document = document

    # --- Atributos ---

    def __getitem__(self, key):
        return self.attrs[key]

    def __setitem__(self, key, value):
        self.attrs[key] = value

    def __delitem__(self, key):
        del self.attrs[key]

    def get(self, key, default=None):
        """El valor de un atributo, o default si no lo tiene: a.get("href")."""
        return self.attrs.get(key, default)

    def get_attribute_list(self, key, default=None):
        value = self.get(key, default)
        if value is None:
            return []
        return value if isinstance(value, list) else [value]

    def has_attr(self, key):
        return key in self.attrs

    # --- Hijos y descendientes ---

    @property
    def children(self):
        return iter(self.contents)

    @property
    def descendants(self):
        result = []
        for child in self.contents:
            result.append(child)
            if isinstance(child, Tag):
                result.extend(child.descendants)
        return iter(result)

    def __iter__(self):
        return iter(self.contents)

    def __len__(self):
        return len(self.contents)

    def __contains__(self, item):
        return item in self.contents

    def __bool__(self):
        return True

    def __getattr__(self, name):
        # soup.title es lo mismo que soup.find("title").
        if name.startswith("_") or name in ("parent", "name", "attrs", "contents"):
            raise AttributeError("'Tag' object has no attribute '" + name + "'")
        if len(name) > 3 and name.endswith("Tag"):
            name = name[:-3]
        return self.find(name)

    def __call__(self, *args, **kwargs):
        return self.find_all(*args, **kwargs)

    # --- Texto ---

    def _all_strings(self, strip=False):
        result = []
        for node in self.descendants:
            if isinstance(node, (Comment, Doctype)) or not isinstance(node, NavigableString):
                continue
            if node.parent is not None and node.parent.name in _HIDDEN and node.parent is not self:
                continue
            text = str(node)
            if strip:
                text = text.strip()
                if not text:
                    continue
            result.append(text)
        return result

    @property
    def strings(self):
        return iter(self._all_strings())

    @property
    def stripped_strings(self):
        return iter(self._all_strings(True))

    def get_text(self, separator="", strip=False, types=None):
        """Todo el texto de dentro, sin etiquetas. Con strip=True, sin espacios sobrantes."""
        return separator.join(self._all_strings(strip))

    getText = get_text

    @property
    def text(self):
        return self.get_text()

    @property
    def string(self):
        """El texto si la etiqueta contiene un único texto (aunque esté anidado); si no, None."""
        if len(self.contents) != 1:
            return None
        child = self.contents[0]
        if isinstance(child, NavigableString):
            return child
        return child.string

    # --- Búsquedas ---

    def find_all(self, name=None, attrs={}, recursive=True, string=None, limit=None, **kwargs):
        """Todas las etiquetas que cumplen las condiciones: find_all("a", class_="titulo")."""
        if "text" in kwargs and string is None:
            string = kwargs.pop("text")
        rule = _Rule(name, attrs, string, kwargs)
        candidates = self.descendants if recursive else self.children
        return _filter(candidates, rule, limit)

    findAll = find_all
    findChildren = find_all

    def find(self, name=None, attrs={}, recursive=True, string=None, **kwargs):
        """La primera etiqueta que cumple las condiciones, o None."""
        found = self.find_all(name, attrs, recursive, string, 1, **kwargs)
        return found[0] if found else None

    findChild = find

    def select(self, selector, namespaces=None, limit=None, **kwargs):
        """Las etiquetas que coinciden con un selector CSS: select("div.libro > h3 a")."""
        if not isinstance(selector, str):
            raise TypeError("select() necesita un selector CSS escrito como texto")
        document = self._document if self._document is not None else self
        indexes = _web.select(document._doc, self._node, selector, limit or 0)
        if indexes is None:
            raise ValueError("Selector CSS no válido: " + repr(selector))
        return ResultSet([document._by_index[i] for i in indexes if i in document._by_index])

    def select_one(self, selector, namespaces=None, **kwargs):
        """La primera etiqueta que coincide con un selector CSS, o None."""
        found = self.select(selector, limit=1)
        return found[0] if found else None

    def css_select(self, selector):
        return self.select(selector)

    # --- HTML ---

    def _attrs_html(self):
        parts = []
        for key in self.attrs:
            value = self.attrs[key]
            if isinstance(value, list):
                value = " ".join(value)
            parts.append(" " + key + '="' + _escape(str(value), True) + '"')
        return "".join(parts)

    def decode_contents(self):
        return "".join(child._html() for child in self.contents)

    def _html(self):
        if self.name in _VOID and not self.contents:
            return "<" + self.name + self._attrs_html() + "/>"
        return "<" + self.name + self._attrs_html() + ">" + self.decode_contents() + "</" + self.name + ">"

    def decode(self):
        return self._html()

    def encode(self, encoding="utf-8"):
        return self._html().encode(encoding)

    def prettify(self):
        lines = []
        _pretty(self, 0, lines)
        return "\n".join(lines) + "\n"

    def __str__(self):
        return self._html()

    def __repr__(self):
        return self._html()

    def __eq__(self, other):
        return self is other

    def __ne__(self, other):
        return self is not other

    def __hash__(self):
        return id(self)


def _pretty(node, depth, lines):
    pad = " " * depth
    if isinstance(node, NavigableString):
        text = str(node).strip()
        if text:
            lines.append(pad + (node._html().strip() if isinstance(node, (Comment, Doctype)) else _escape(text)))
        return
    if isinstance(node, BeautifulSoup):
        for child in node.contents:
            _pretty(child, depth, lines)
        return
    if node.name in _VOID and not node.contents:
        lines.append(pad + "<" + node.name + node._attrs_html() + "/>")
        return
    lines.append(pad + "<" + node.name + node._attrs_html() + ">")
    for child in node.contents:
        _pretty(child, depth + 1, lines)
    lines.append(pad + "</" + node.name + ">")


# ---------------------------------------------------------------------------
# Condiciones de búsqueda
# ---------------------------------------------------------------------------


def _matches(value, condition):
    """¿Cumple un valor (texto, o lista de clases) una condición de bs4?"""
    if condition is True:
        return value is not None
    if condition is False:
        return value is None
    if value is None:
        return condition is None
    if isinstance(condition, _RE_TYPE):
        if isinstance(value, list):
            return any(condition.search(item) for item in value) or condition.search(" ".join(value)) is not None
        return condition.search(value) is not None
    if callable(condition):
        return bool(condition(value))
    if isinstance(condition, (list, tuple, set)):
        return any(_matches(value, item) for item in condition)
    condition = str(condition)
    if isinstance(value, list):
        return condition in value or condition == " ".join(value)
    return value == condition


class _Rule:
    def __init__(self, name, attrs, string, kwargs):
        if isinstance(attrs, str):
            # find_all("div", "tarjeta") busca por clase, como en bs4.
            attrs = {"class": attrs}
        self.name = name
        self.attrs = {}
        for key in attrs:
            self.attrs[key] = attrs[key]
        for key in kwargs:
            target = key
            if key == "class_":
                target = "class"
            elif key.endswith("_") and key[:-1] in ("class", "for", "id", "type"):
                target = key[:-1]
            self.attrs[target] = kwargs[key]
        self.string = string

    def matches_tag(self, tag):
        if self.name is not None and self.name is not True:
            if callable(self.name) and not isinstance(self.name, _RE_TYPE):
                if not self.name(tag):
                    return False
            elif not _matches(tag.name, self.name):
                return False
        for key in self.attrs:
            if not _matches(tag.attrs.get(key), self.attrs[key]):
                return False
        if self.string is not None and not _matches(tag.string, self.string):
            return False
        return True

    def matches_string(self, text):
        return _matches(str(text), self.string)

    @property
    def wants_strings(self):
        return self.string is not None and self.name is None and not self.attrs


def _filter(candidates, rule, limit):
    result = ResultSet()
    for node in candidates:
        if isinstance(node, Tag):
            if rule.wants_strings or not rule.matches_tag(node):
                continue
        elif rule.wants_strings and isinstance(node, NavigableString) and not isinstance(node, (Comment, Doctype)):
            if not rule.matches_string(node):
                continue
        else:
            continue
        result.append(node)
        if limit and len(result) >= limit:
            break
    return result


# ---------------------------------------------------------------------------
# BeautifulSoup
# ---------------------------------------------------------------------------


class BeautifulSoup(Tag):
    """El documento completo: BeautifulSoup(html, "html.parser")."""

    def __init__(self, markup="", features=None, builder=None, parse_only=None, from_encoding=None, **kwargs):
        if features is not None:
            names = features if isinstance(features, (list, tuple)) else [features]
            for feature in names:
                if feature not in _PARSERS:
                    raise FeatureNotFound(
                        "Couldn't find a tree builder with the features you requested: "
                        + str(feature)
                        + ". Do you need to install a parser library?"
                    )
        if hasattr(markup, "read"):
            markup = markup.read()
        if isinstance(markup, bytes):
            markup = markup.decode(from_encoding or "utf-8")
        if not isinstance(markup, str):
            raise TypeError("BeautifulSoup necesita el HTML como texto, por ejemplo respuesta.text")
        Tag.__init__(self, "[document]")
        self._document = self
        self._by_index = {}
        parsed = _web.parse_html(markup)
        self._doc = parsed["doc"]
        for node in parsed["roots"]:
            child = self._build(node, self)
            if child is not None:
                self.contents.append(child)

    def _build(self, node, parent):
        if isinstance(node, str):
            text = NavigableString(node)
            text.parent = parent
            return text
        kind = node["k"]
        if kind == "c":
            text = Comment(node["v"])
            text.parent = parent
            return text
        if kind == "d":
            text = Doctype(node["v"])
            text.parent = parent
            return text
        attrs = {}
        for pair in node["a"]:
            key, value = pair[0], pair[1]
            attrs[key] = value.split() if key in _MULTI_VALUED else value
        tag = Tag(node["n"], attrs, parent, node["i"], self)
        self._by_index[node["i"]] = tag
        for child in node["c"]:
            built = self._build(child, tag)
            if built is not None:
                tag.contents.append(built)
        return tag

    def _html(self):
        return self.decode_contents()

    def new_tag(self, name, attrs=None, **kwargs):
        values = dict(attrs or {})
        values.update(kwargs)
        return Tag(name, values, None, -1, None)

    def new_string(self, text):
        return NavigableString(text)
