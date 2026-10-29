from fletsim import *

estrella = find_one(ft.Icon, icon=ft.Icons.STAR)
assert estrella.color == ft.Colors.AMBER, "El icono de estrella debería ser de color ft.Colors.AMBER"
assert estrella.size == 48, "El icono de estrella debería tener size=48"
guardar = find_one(ft.FilledButton, content="Guardar")
assert guardar.icon == ft.Icons.SAVE, "El botón «Guardar» debería llevar icon=ft.Icons.SAVE"
find_one(ft.OutlinedButton, content="Cancelar")
borrar = find_one(ft.IconButton, icon=ft.Icons.DELETE)
assert borrar.tooltip == "Borrar", "El botón de borrar debería tener tooltip=\"Borrar\""
orden = [type(c).__name__ for c in page().controls]
assert orden == ["Icon", "FilledButton", "OutlinedButton", "IconButton"], "Los controles deberían ir en este orden: icono, Guardar, Cancelar y borrar. Ahora: " + ", ".join(orden)
