"""
Simulador de Flet 1.0 para el navegador.

Implementa en Python puro una parte de la API de Flet (controles, página,
eventos y controles propios con @ft.control) para que los ejercicios del
curso se ejecuten con Skulpt, sin instalar nada. En vez de Flutter, la
interfaz la dibuja la página web: este módulo describe el árbol de
controles y lo envía al navegador a través de _flet_bridge.

Lo que no está implementado da un error claro en español.
"""

import _flet_bridge
from dataclasses import Field as _FieldDefault

_registry = {}
_state = {"page": None, "mounted": {}, "rendering": False, "again": False, "next_uid": 1}

_MAX_RENDER_PASSES = 3


def _new_uid():
    uid = _state["next_uid"]
    _state["next_uid"] = uid + 1
    return uid


# ---------------------------------------------------------------------------
# Valores: colores, iconos, alineaciones, márgenes y bordes
# ---------------------------------------------------------------------------


class Colors:
    """Colores con nombre. Cada valor es un texto que entiende el navegador."""

    @staticmethod
    def with_opacity(opacity, color):
        return str(color) + "," + str(opacity)


_PALETTE = [
    "red", "pink", "purple", "deep_purple", "indigo", "blue", "light_blue", "cyan", "teal",
    "green", "light_green", "lime", "yellow", "amber", "orange", "deep_orange", "brown",
    "grey", "blue_grey",
]
_ACCENTED = _PALETTE[:16]
for _name in _PALETTE:
    _key = _name.replace("_", "")
    setattr(Colors, _name.upper(), _key)
    for _shade in (50, 100, 200, 300, 400, 500, 600, 700, 800, 900):
        setattr(Colors, _name.upper() + "_" + str(_shade), _key + str(_shade))
for _name in _ACCENTED:
    _key = _name.replace("_", "")
    setattr(Colors, _name.upper() + "_ACCENT", _key + "accent")
    for _shade in (100, 200, 400, 700):
        setattr(Colors, _name.upper() + "_ACCENT_" + str(_shade), _key + "accent" + str(_shade))
for _name in ("white", "black", "transparent"):
    setattr(Colors, _name.upper(), _name)
for _shade in (10, 12, 24, 30, 38, 45, 54, 60, 70, 87):
    setattr(Colors, "WHITE_" + str(_shade), "white" + str(_shade))
    setattr(Colors, "BLACK_" + str(_shade), "black" + str(_shade))
for _name in (
    "primary", "on_primary", "primary_container", "on_primary_container",
    "secondary", "on_secondary", "secondary_container", "on_secondary_container",
    "tertiary", "on_tertiary", "tertiary_container", "on_tertiary_container",
    "error", "on_error", "error_container", "on_error_container",
    "surface", "on_surface", "on_surface_variant", "surface_tint",
    "surface_container_lowest", "surface_container_low", "surface_container",
    "surface_container_high", "surface_container_highest",
    "outline", "outline_variant", "shadow", "inverse_surface", "on_inverse_surface",
    "inverse_primary",
):
    setattr(Colors, _name.upper(), _name.replace("_", ""))


class _Icons:
    """ft.Icons.ADD → "add". Acepta cualquier nombre de Material Icons."""

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        return name.lower()


Icons = _Icons()


class _Constants:
    pass


def _enum(name, **values):
    cls = type(name, (_Constants,), {})
    for key in values:
        setattr(cls, key, values[key])
    return cls


MainAxisAlignment = _enum(
    "MainAxisAlignment", START="start", END="end", CENTER="center",
    SPACE_BETWEEN="spaceBetween", SPACE_AROUND="spaceAround", SPACE_EVENLY="spaceEvenly",
)
CrossAxisAlignment = _enum(
    "CrossAxisAlignment", START="start", END="end", CENTER="center", STRETCH="stretch",
    BASELINE="baseline",
)
FontWeight = _enum(
    "FontWeight", NORMAL="normal", BOLD="bold", W_100="w100", W_200="w200", W_300="w300",
    W_400="w400", W_500="w500", W_600="w600", W_700="w700", W_800="w800", W_900="w900",
)
TextAlign = _enum(
    "TextAlign", LEFT="left", RIGHT="right", CENTER="center", JUSTIFY="justify",
    START="start", END="end",
)
ScrollMode = _enum("ScrollMode", AUTO="auto", ADAPTIVE="adaptive", ALWAYS="always", HIDDEN="hidden")
ThemeMode = _enum("ThemeMode", SYSTEM="system", LIGHT="light", DARK="dark")
LabelPosition = _enum("LabelPosition", RIGHT="right", LEFT="left")
KeyboardType = _enum(
    "KeyboardType", TEXT="text", NUMBER="number", EMAIL="email", PHONE="phone", URL="url",
    MULTILINE="multiline", NAME="name", DATETIME="datetime",
)
TextDecoration = _enum("TextDecoration", NONE="none", UNDERLINE="underline", LINE_THROUGH="lineThrough", OVERLINE="overline")


class _Value:
    """Valor compuesto que se envía al navegador como diccionario."""

    def _json(self):
        result = {}
        for key in self.__dict__:
            result[key] = _plain(self.__dict__[key])
        return result

    def __eq__(self, other):
        return type(self) is type(other) and self._json() == other._json()

    def __repr__(self):
        return type(self).__name__ + str(self._json())


class Alignment(_Value):
    def __init__(self, x=0, y=0):
        self.x = x
        self.y = y


Alignment.TOP_LEFT = Alignment(-1, -1)
Alignment.TOP_CENTER = Alignment(0, -1)
Alignment.TOP_RIGHT = Alignment(1, -1)
Alignment.CENTER_LEFT = Alignment(-1, 0)
Alignment.CENTER = Alignment(0, 0)
Alignment.CENTER_RIGHT = Alignment(1, 0)
Alignment.BOTTOM_LEFT = Alignment(-1, 1)
Alignment.BOTTOM_CENTER = Alignment(0, 1)
Alignment.BOTTOM_RIGHT = Alignment(1, 1)


class Padding(_Value):
    def __init__(self, left=0, top=0, right=0, bottom=0):
        self.left = left
        self.top = top
        self.right = right
        self.bottom = bottom

    @classmethod
    def all(cls, value):
        return cls(value, value, value, value)

    @classmethod
    def symmetric(cls, vertical=0, horizontal=0):
        return cls(horizontal, vertical, horizontal, vertical)

    @classmethod
    def only(cls, left=0, top=0, right=0, bottom=0):
        return cls(left, top, right, bottom)


class Margin(Padding):
    pass


class BorderRadius(_Value):
    def __init__(self, top_left=0, top_right=0, bottom_left=0, bottom_right=0):
        self.top_left = top_left
        self.top_right = top_right
        self.bottom_left = bottom_left
        self.bottom_right = bottom_right

    @classmethod
    def all(cls, value):
        return cls(value, value, value, value)

    @classmethod
    def only(cls, top_left=0, top_right=0, bottom_left=0, bottom_right=0):
        return cls(top_left, top_right, bottom_left, bottom_right)

    @classmethod
    def horizontal(cls, left=0, right=0):
        return cls(left, right, left, right)

    @classmethod
    def vertical(cls, top=0, bottom=0):
        return cls(top, top, bottom, bottom)


class BorderSide(_Value):
    def __init__(self, width=1, color=None):
        self.width = width
        self.color = color


class Border(_Value):
    def __init__(self, top=None, right=None, bottom=None, left=None):
        self.top = top
        self.right = right
        self.bottom = bottom
        self.left = left

    @classmethod
    def all(cls, width=1, color=None):
        side = BorderSide(width, color)
        return cls(side, side, side, side)

    @classmethod
    def symmetric(cls, vertical=None, horizontal=None):
        return cls(vertical, horizontal, vertical, horizontal)

    @classmethod
    def only(cls, left=None, top=None, right=None, bottom=None):
        return cls(top, right, bottom, left)


class TextStyle(_Value):
    def __init__(self, size=None, weight=None, color=None, italic=None, decoration=None):
        self.size = size
        self.weight = weight
        self.color = color
        self.italic = italic
        self.decoration = decoration


class RoundedRectangleBorder(_Value):
    def __init__(self, radius=0):
        self.kind = "rounded"
        self.radius = radius


class StadiumBorder(_Value):
    def __init__(self):
        self.kind = "stadium"


class CircleBorder(_Value):
    def __init__(self):
        self.kind = "circle"


class ButtonStyle(_Value):
    def __init__(self, color=None, bgcolor=None, padding=None, shape=None, elevation=None, **kwargs):
        self.color = color
        self.bgcolor = bgcolor
        self.padding = padding
        self.shape = shape
        self.elevation = elevation


def _plain(value):
    """Convierte un valor de Python en algo que se puede enviar al navegador."""
    if value is None or isinstance(value, (bool, int, float, str)):
        return value
    if isinstance(value, _Value):
        return value._json()
    if isinstance(value, (list, tuple)):
        return [_plain(item) for item in value]
    if isinstance(value, dict):
        result = {}
        for key in value:
            result[str(key)] = _plain(value[key])
        return result
    return str(value)


# ---------------------------------------------------------------------------
# Eventos
# ---------------------------------------------------------------------------


class Event:
    """Lo que recibe un manejador: e.control es el control que lanzó el evento."""

    def __init__(self, name, control, data=None):
        self.name = name
        self.control = control
        self.data = data
        self.target = control.uid
        self.page = control.page

    def __repr__(self):
        return "Event(name=" + repr(self.name) + ", data=" + repr(self.data) + ")"


ControlEvent = Event


# ---------------------------------------------------------------------------
# Controles
# ---------------------------------------------------------------------------

_schemas = {}


def _fresh(default):
    if isinstance(default, _FieldDefault):
        return default.make()
    # "equipo: str" sin valor por defecto (ver skulpt-patches.js): empieza en None.
    if type(default).__name__ == "AnotacionSinValor":
        return None
    if isinstance(default, list):
        return list(default)
    return default


def _schema(cls):
    """Campos (con su valor por defecto) y argumentos posicionales de una clase de control."""
    if cls in _schemas:
        return _schemas[cls]
    order = []
    defaults = {}
    for klass in reversed(cls.__mro__):
        own = klass.__dict__.get("_fields")
        if own is None:
            continue
        for name in own:
            if name not in defaults:
                order.append(name)
            defaults[name] = own[name]
    positional = ()
    for klass in cls.__mro__:
        if "_positional" in klass.__dict__:
            positional = klass.__dict__["_positional"]
            break
    schema = {"order": order, "defaults": defaults, "positional": positional}
    _schemas[cls] = schema
    return schema


_BUTTONS = ("Button", "FilledButton", "FilledTonalButton", "OutlinedButton", "TextButton")


def _unexpected_argument(cls, name):
    message = cls.__name__ + "() got an unexpected keyword argument '" + name + "'"
    if name == "text" and cls._flet_type in _BUTTONS:
        message += ". En Flet 1.0 el texto del botón va en content=, por ejemplo ft.Button(content=\"Enviar\")"
    return message


class Control:
    """Base de todos los controles."""

    _flet_type = "Control"
    _fields = {
        "visible": True,
        "disabled": False,
        "expand": None,
        "width": None,
        "height": None,
        "tooltip": None,
        "opacity": None,
        "data": None,
        "key": None,
    }
    _positional = ()

    def __init__(self, *args, **kwargs):
        schema = _schema(type(self))
        object.__setattr__(self, "uid", _new_uid())
        object.__setattr__(self, "parent", None)
        object.__setattr__(self, "page", None)
        for name in schema["order"]:
            object.__setattr__(self, name, _fresh(schema["defaults"][name]))
        positional = schema["positional"]
        if len(args) > len(positional):
            raise TypeError(
                type(self).__name__ + "() acepta como mucho " + str(len(positional))
                + " argumento(s) sin nombre; usa nombre=valor para el resto"
            )
        for index in range(len(args)):
            setattr(self, positional[index], args[index])
        for name in kwargs:
            if name not in schema["defaults"]:
                raise TypeError(_unexpected_argument(type(self), name))
            setattr(self, name, kwargs[name])
        _registry[self.uid] = self
        self._validate()
        init = getattr(self, "init", None)
        if callable(init):
            init()

    def _validate(self):
        pass

    def update(self):
        if self.page is None:
            raise RuntimeError(
                "No se puede actualizar un " + type(self).__name__
                + " que todavía no está en la página. Añádelo primero con page.add(...)"
            )
        _render()

    def __repr__(self):
        return type(self).__name__ + "(uid=" + str(self.uid) + ")"


def control(cls=None, **options):
    """Decorador @ft.control para crear controles propios a partir de otros."""

    def decorate(klass):
        fields = {}
        for name in list(klass.__dict__.keys()):
            if name.startswith("_"):
                continue
            value = klass.__dict__[name]
            if isinstance(value, (property, staticmethod, classmethod)):
                continue
            if callable(value) and not isinstance(value, _FieldDefault):
                continue
            fields[name] = value
        klass._fields = fields
        _schemas.pop(klass, None)
        return klass

    if cls is None:
        return decorate
    return decorate(cls)


# ---- Texto e iconos ----


class Text(Control):
    _flet_type = "Text"
    _fields = {
        "value": "",
        "size": None,
        "weight": None,
        "color": None,
        "bgcolor": None,
        "italic": False,
        "text_align": None,
        "selectable": False,
        "max_lines": None,
        "style": None,
        "no_wrap": False,
    }
    _positional = ("value",)


class Icon(Control):
    _flet_type = "Icon"
    _fields = {"icon": None, "color": None, "size": None}
    _positional = ("icon",)


# ---- Botones ----


class Button(Control):
    _flet_type = "Button"
    _fields = {
        "content": None,
        "icon": None,
        "icon_color": None,
        "bgcolor": None,
        "color": None,
        "style": None,
        "url": None,
        "autofocus": False,
        "on_click": None,
        "on_long_press": None,
        "on_hover": None,
        "on_focus": None,
        "on_blur": None,
    }
    _positional = ("content",)

    def _validate(self):
        if self.content is None and self.icon is None:
            raise ValueError(type(self).__name__ + " necesita content o icon")


class FilledButton(Button):
    _flet_type = "FilledButton"


class FilledTonalButton(Button):
    _flet_type = "FilledTonalButton"


class OutlinedButton(Button):
    _flet_type = "OutlinedButton"


class TextButton(Button):
    _flet_type = "TextButton"


class IconButton(Control):
    _flet_type = "IconButton"
    _fields = {
        "icon": None,
        "icon_color": None,
        "icon_size": None,
        "bgcolor": None,
        "selected": False,
        "selected_icon": None,
        "style": None,
        "on_click": None,
    }
    _positional = ("icon",)


class FloatingActionButton(Control):
    _flet_type = "FloatingActionButton"
    _fields = {
        "content": None,
        "icon": None,
        "bgcolor": None,
        "foreground_color": None,
        "mini": False,
        "on_click": None,
    }
    _positional = ("content",)


# ---- Entradas ----


class TextField(Control):
    _flet_type = "TextField"
    _fields = {
        "value": "",
        "label": None,
        "hint_text": None,
        "helper": None,
        "error": None,
        "prefix_icon": None,
        "suffix_icon": None,
        "prefix": None,
        "suffix": None,
        "password": False,
        "can_reveal_password": False,
        "multiline": False,
        "min_lines": None,
        "max_lines": None,
        "max_length": None,
        "read_only": False,
        "autofocus": False,
        "keyboard_type": None,
        "text_align": None,
        "text_size": None,
        "border_radius": None,
        "bgcolor": None,
        "filled": False,
        "on_change": None,
        "on_submit": None,
        "on_focus": None,
        "on_blur": None,
    }
    _positional = ("value",)


class Checkbox(Control):
    _flet_type = "Checkbox"
    _fields = {
        "label": None,
        "value": False,
        "tristate": False,
        "label_position": None,
        "active_color": None,
        "check_color": None,
        "on_change": None,
        "on_focus": None,
        "on_blur": None,
    }
    _positional = ("label",)


class Switch(Control):
    _flet_type = "Switch"
    _fields = {
        "label": None,
        "value": False,
        "label_position": None,
        "active_color": None,
        "on_change": None,
        "on_focus": None,
        "on_blur": None,
    }
    _positional = ("label",)


class Slider(Control):
    _flet_type = "Slider"
    _fields = {
        "value": None,
        "min": 0.0,
        "max": 1.0,
        "divisions": None,
        "label": None,
        "active_color": None,
        "on_change": None,
        "on_change_end": None,
    }
    _positional = ("value",)


class ProgressBar(Control):
    _flet_type = "ProgressBar"
    _fields = {"value": None, "color": None, "bgcolor": None, "bar_height": None}


# ---- Layout ----


class Row(Control):
    _flet_type = "Row"
    _fields = {
        "controls": [],
        "spacing": 10,
        "alignment": MainAxisAlignment.START,
        "vertical_alignment": CrossAxisAlignment.CENTER,
        "wrap": False,
        "run_spacing": 10,
        "scroll": None,
        "tight": False,
    }
    _positional = ("controls",)


class Column(Control):
    _flet_type = "Column"
    _fields = {
        "controls": [],
        "spacing": 10,
        "alignment": MainAxisAlignment.START,
        "horizontal_alignment": CrossAxisAlignment.START,
        "wrap": False,
        "run_spacing": 10,
        "scroll": None,
        "tight": False,
    }
    _positional = ("controls",)


class Container(Control):
    _flet_type = "Container"
    _fields = {
        "content": None,
        "padding": None,
        "margin": None,
        "bgcolor": None,
        "border": None,
        "border_radius": None,
        "alignment": None,
        "ink": False,
        "on_click": None,
        "on_hover": None,
    }
    _positional = ("content",)


class ListView(Control):
    _flet_type = "ListView"
    _fields = {
        "controls": [],
        "spacing": 0,
        "padding": None,
        "horizontal": False,
        "auto_scroll": False,
        "divider_thickness": 0,
    }
    _positional = ("controls",)


class SafeArea(Control):
    _flet_type = "SafeArea"
    _fields = {"content": None}
    _positional = ("content",)


class Divider(Control):
    _flet_type = "Divider"
    _fields = {"thickness": None, "color": None, "leading_indent": None, "trailing_indent": None}


class VerticalDivider(Control):
    _flet_type = "VerticalDivider"
    _fields = {"thickness": None, "color": None}


class Card(Control):
    _flet_type = "Card"
    _fields = {"content": None, "elevation": None, "bgcolor": None, "margin": None}
    _positional = ("content",)


class ListTile(Control):
    _flet_type = "ListTile"
    _fields = {
        "title": None,
        "subtitle": None,
        "leading": None,
        "trailing": None,
        "bgcolor": None,
        "on_click": None,
    }


class AppBar(Control):
    _flet_type = "AppBar"
    _fields = {
        "title": None,
        "leading": None,
        "actions": [],
        "bgcolor": None,
        "color": None,
        "center_title": False,
    }


# ---------------------------------------------------------------------------
# Página
# ---------------------------------------------------------------------------


class Page:
    """La ventana de la app: lo que se añade con page.add(...) aparece en ella."""

    def __init__(self):
        self.title = "Flet app"
        self.controls = []
        self.bgcolor = None
        self.padding = 10
        self.spacing = 10
        self.vertical_alignment = MainAxisAlignment.START
        self.horizontal_alignment = CrossAxisAlignment.START
        self.scroll = None
        self.theme_mode = ThemeMode.SYSTEM
        self.appbar = None
        self.floating_action_button = None
        self.route = "/"
        self.width = 400
        self.height = 520

    def add(self, *controls):
        for item in controls:
            _require_control(item, "page.add()")
            self.controls.append(item)
        self.update()

    def insert(self, index, *controls):
        for offset in range(len(controls)):
            _require_control(controls[offset], "page.insert()")
            self.controls.insert(index + offset, controls[offset])
        self.update()

    def remove(self, *controls):
        for item in controls:
            self.controls.remove(item)
        self.update()

    def remove_at(self, index):
        self.controls.pop(index)
        self.update()

    def clean(self):
        self.controls = []
        self.update()

    def update(self, *controls):
        _render()

    def push_route(self, route):
        raise NotImplementedError("La navegación entre vistas no está disponible en el simulador del curso")

    def show_dialog(self, dialog):
        raise NotImplementedError("Los diálogos no están disponibles en el simulador del curso")

    def __repr__(self):
        return "Page(title=" + repr(self.title) + ")"


def _require_control(item, where):
    if not isinstance(item, Control):
        raise TypeError(
            where + " solo acepta controles de Flet, por ejemplo ft.Text(\"hola\"), no "
            + type(item).__name__
        )


def run(main=None, **options):
    """Arranca la app: crea la página, llama a main(page) y la dibuja."""
    if main is None:
        main = options.get("target")
    if not callable(main):
        raise TypeError("ft.run() necesita una función, por ejemplo ft.run(main)")
    _registry.clear()
    _state["mounted"] = {}
    page = Page()
    _state["page"] = page
    _flet_bridge.attach(_dispatch)
    main(page)
    _render()


# ---------------------------------------------------------------------------
# Dibujo y eventos
# ---------------------------------------------------------------------------


def _children(control):
    """Controles hijos: cualquier campo que contenga un control o una lista de ellos."""
    result = []
    for name in _schema(type(control))["order"]:
        value = getattr(control, name, None)
        if isinstance(value, Control):
            result.append(value)
        elif isinstance(value, list):
            for item in value:
                if isinstance(item, Control):
                    result.append(item)
    return result


def _page_roots(page):
    roots = []
    if page.appbar is not None:
        roots.append(page.appbar)
    for item in page.controls:
        _require_control(item, "page.controls")
        roots.append(item)
    if page.floating_action_button is not None:
        roots.append(page.floating_action_button)
    return roots


def _prepare(control, parent, page, seen):
    """Conecta el control con la página y llama a sus métodos de ciclo de vida."""
    object.__setattr__(control, "parent", parent)
    object.__setattr__(control, "page", page)
    first_time = control.uid not in _state["mounted"]
    if first_time:
        build = getattr(control, "build", None)
        if callable(build):
            build()
    before_update = getattr(control, "before_update", None)
    if callable(before_update):
        before_update()
    seen[control.uid] = control
    for child in _children(control):
        _prepare(child, control, page, seen)
    if first_time:
        _state["mounted"][control.uid] = control
        did_mount = getattr(control, "did_mount", None)
        if callable(did_mount):
            did_mount()


def _render():
    page = _state["page"]
    if page is None:
        return
    if _state["rendering"]:
        _state["again"] = True
        return
    _state["rendering"] = True
    try:
        passes = 0
        while True:
            _state["again"] = False
            seen = {}
            for root in _page_roots(page):
                _prepare(root, None, page, seen)
            for uid in list(_state["mounted"].keys()):
                if uid not in seen:
                    gone = _state["mounted"].pop(uid)
                    will_unmount = getattr(gone, "will_unmount", None)
                    if callable(will_unmount):
                        will_unmount()
                    object.__setattr__(gone, "page", None)
            passes += 1
            if not _state["again"] or passes >= _MAX_RENDER_PASSES:
                break
        _flet_bridge.render(_serialize_page(page))
    finally:
        _state["rendering"] = False


def _serialize(control):
    node = {"type": control._flet_type, "id": control.uid, "props": {}, "slots": {}, "events": []}
    for name in _schema(type(control))["order"]:
        if name in ("data", "key"):
            continue
        value = getattr(control, name, None)
        if name.startswith("on_"):
            if value is not None:
                node["events"].append(name[3:])
        elif isinstance(value, Control):
            node["slots"][name] = _serialize(value)
        elif isinstance(value, list) and all(isinstance(item, Control) for item in value):
            node["slots"][name] = [_serialize(item) for item in value]
        else:
            node["props"][name] = _plain(value)
    return node


def _serialize_page(page):
    return {
        "title": str(page.title) if page.title is not None else "",
        "bgcolor": page.bgcolor,
        "padding": _plain(page.padding),
        "spacing": page.spacing,
        "vertical_alignment": page.vertical_alignment,
        "horizontal_alignment": page.horizontal_alignment,
        "scroll": page.scroll,
        "theme_mode": page.theme_mode,
        "appbar": _serialize(page.appbar) if page.appbar is not None else None,
        "fab": _serialize(page.floating_action_button) if page.floating_action_button is not None else None,
        "controls": [_serialize(item) for item in page.controls],
    }


def _dispatch(uid, name, data=None):
    """Llega un evento del navegador (o de una prueba): actualiza el valor y llama al manejador."""
    target = _registry.get(uid)
    if target is None:
        return
    if name == "change":
        if isinstance(target, TextField):
            target.value = "" if data is None else str(data)
        elif isinstance(target, (Checkbox, Switch)):
            target.value = bool(data)
        elif isinstance(target, Slider):
            target.value = float(data)
    handler = getattr(target, "on_" + name, None)
    if handler is not None:
        if _flet_bridge.accepts_argument(handler):
            handler(Event(name, target, data))
        else:
            handler()
    # Como en Flet 1.0: la interfaz se actualiza sola al terminar el manejador.
    _render()


# ---------------------------------------------------------------------------
# Nombres eliminados en Flet 1.0: dan un error que explica el cambio
# ---------------------------------------------------------------------------


class FletError(Exception):
    """Uso de un nombre que Flet 1.0 eliminó. El mensaje dice cómo se escribe ahora."""


class _Removed:
    # Lanza FletError y no AttributeError: Skulpt sustituye el mensaje de los
    # AttributeError que salen de __getattr__ por uno genérico.

    def __init__(self, old, new, upper=False):
        self._old = old
        self._new = new
        self._upper = upper

    def __getattr__(self, name):
        if name.startswith("_"):
            raise AttributeError(name)
        replacement = name.upper() if self._upper else name
        raise FletError(
            self._old + "." + name + " ya no existe en Flet 1.0: usa " + self._new + "." + replacement
        )

    def __call__(self, *args, **kwargs):
        raise FletError(self._old + " ya no existe en Flet 1.0: usa " + self._new)


padding = _Removed("ft.padding", "ft.Padding")
margin = _Removed("ft.margin", "ft.Margin")
border = _Removed("ft.border", "ft.Border")
border_radius = _Removed("ft.border_radius", "ft.BorderRadius")
alignment = _Removed("ft.alignment", "ft.Alignment", upper=True)
colors = _Removed("ft.colors", "ft.Colors", upper=True)
icons = _Removed("ft.icons", "ft.Icons", upper=True)


def app(*args, **kwargs):
    raise AttributeError("ft.app() ya no existe en Flet 1.0: usa ft.run(main)")


class ElevatedButton:
    def __init__(self, *args, **kwargs):
        raise AttributeError("ft.ElevatedButton ya no existe en Flet 1.0: usa ft.Button(content=...)")
