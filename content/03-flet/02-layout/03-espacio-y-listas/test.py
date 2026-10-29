from fletsim import *

campo = find_one(ft.TextField, label="Buscar")
assert campo.expand is True, "El campo «Buscar» debería ocupar el espacio libre: expand=True"
assert isinstance(campo.parent, ft.Row), "El campo «Buscar» debería estar dentro de una ft.Row"
find_one(ft.IconButton, icon=ft.Icons.SEARCH)
lista = find_one(ft.ListView)
assert lista.expand is True, "El ListView debería tener expand=True"
assert lista.spacing == 5, "El ListView debería tener spacing=5"
valores = [c.value for c in lista.controls if isinstance(c, ft.Text)]
esperados = ["Resultado " + str(n) for n in range(1, 21)]
assert valores == esperados, "El ListView debería tener 20 textos, de «Resultado 1» a «Resultado 20». Ahora tiene " + str(len(valores))
