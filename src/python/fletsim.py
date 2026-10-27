"""
Ayudas para comprobar los ejercicios de Flet en el simulador.

Las usan los test.py de la ruta Flet: buscan controles en la app que
creó el alumno y simulan lo que haría una persona (hacer clic, escribir,
marcar casillas).
"""

import flet as ft


def page():
    """La página de la app. Falla con un mensaje claro si no se llamó a ft.run(main)."""
    current = ft._state["page"]
    if current is None:
        raise AssertionError("Tu programa no llamó a ft.run(main), así que no hay ninguna app que comprobar")
    return current


def is_visible(control):
    """True si el control y todos sus padres son visibles."""
    node = control
    while node is not None:
        if not node.visible:
            return False
        node = node.parent
    return control.page is not None


def controls(kind=None):
    """Todos los controles visibles de la página, en orden."""
    found = []

    def walk(control):
        if not control.visible:
            return
        if kind is None or isinstance(control, kind):
            found.append(control)
        for child in ft._children(control):
            walk(child)

    for root in ft._page_roots(page()):
        walk(root)
    return found


def find(kind=None, **props):
    """Controles visibles de un tipo cuyas propiedades coinciden con las indicadas."""
    result = []
    for control in controls(kind):
        if all(getattr(control, name, None) == props[name] for name in props):
            result.append(control)
    return result


def find_one(kind, **props):
    """El primer control que cumple las condiciones, o un error que lo explica."""
    found = find(kind, **props)
    if not found:
        detail = ""
        if props:
            detail = " con " + ", ".join(name + "=" + repr(props[name]) for name in props)
        raise AssertionError("No encuentro ningún " + kind.__name__ + detail + " visible en la app")
    return found[0]


def label(control):
    """Texto que muestra un botón, una casilla o un texto."""
    for name in ("content", "label", "value", "title"):
        value = getattr(control, name, None)
        if isinstance(value, ft.Text):
            return str(value.value)
        if isinstance(value, str):
            return value
    return ""


def texts():
    """Valores de todos los ft.Text visibles."""
    return [str(item.value) for item in controls(ft.Text)]


def screen_text():
    """Todo el texto visible en la app: textos, botones, casillas y campos."""
    parts = []
    for control in controls():
        if isinstance(control, ft.Text):
            parts.append(str(control.value))
        elif isinstance(control, (ft.Button, ft.Checkbox, ft.Switch)):
            text = getattr(control, "content", None) if isinstance(control, ft.Button) else control.label
            if isinstance(text, str):
                parts.append(text)
        elif isinstance(control, ft.TextField):
            parts.append(str(control.value))
    return "\n".join(parts)


def button(text):
    """El botón (de cualquier tipo) cuyo texto es el indicado."""
    for control in controls():
        if isinstance(control, (ft.Button, ft.FloatingActionButton)) and label(control) == text:
            return control
    raise AssertionError("No encuentro ningún botón con el texto " + repr(text))


def click(target):
    """Hace clic en un control o en el botón con ese texto."""
    if isinstance(target, str):
        target = button(target)
    if target.disabled:
        raise AssertionError("El control " + type(target).__name__ + " está desactivado")
    ft._dispatch(target.uid, "click")


def type_text(field, text):
    """Escribe en un campo de texto (sustituye lo que tuviera)."""
    ft._dispatch(field.uid, "change", text)


def submit(field):
    """Pulsa Enter en un campo de texto."""
    ft._dispatch(field.uid, "submit", field.value)


def toggle(control):
    """Marca o desmarca una casilla o un interruptor."""
    ft._dispatch(control.uid, "change", not control.value)
