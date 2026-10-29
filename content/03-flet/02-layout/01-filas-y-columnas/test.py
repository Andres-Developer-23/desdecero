from fletsim import *

find_one(ft.Text, value="Reproduciendo")
fila = find_one(ft.Row)
assert fila.alignment == ft.MainAxisAlignment.CENTER, "La fila debería estar centrada: alignment=ft.MainAxisAlignment.CENTER"
assert fila.spacing == 20, "La fila debería tener spacing=20"
iconos = [boton.icon for boton in fila.controls if isinstance(boton, ft.IconButton)]
assert iconos == [ft.Icons.SKIP_PREVIOUS, ft.Icons.PLAY_ARROW, ft.Icons.SKIP_NEXT], "La fila debería tener tres IconButton: SKIP_PREVIOUS, PLAY_ARROW y SKIP_NEXT, en ese orden"
