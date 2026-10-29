from fletsim import *

caja = find_one(ft.Container)
assert caja.width == 200 and caja.height == 100, "El contenedor debería medir width=200 y height=100"
assert caja.bgcolor == ft.Colors.AMBER_100, "El fondo debería ser ft.Colors.AMBER_100"
assert caja.border_radius in (12, ft.BorderRadius.all(12)), "Las esquinas deberían tener border_radius=12"
assert caja.alignment == ft.Alignment.CENTER, "El contenido debería estar centrado: alignment=ft.Alignment.CENTER"
texto = caja.content
assert isinstance(texto, ft.Text) and texto.value == "Nivel 1", "Dentro del contenedor (content) debería ir un ft.Text con «Nivel 1»"
assert texto.weight == ft.FontWeight.BOLD and texto.size == 24, "El texto debería ir en negrita y con size=24"
