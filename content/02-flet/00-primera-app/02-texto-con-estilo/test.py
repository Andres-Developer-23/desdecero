from fletsim import *

nombre = find_one(ft.Text, value="Ana Ruiz")
assert nombre.size == 30, "«Ana Ruiz» debería tener size=30"
assert nombre.weight == ft.FontWeight.BOLD, "«Ana Ruiz» debería ir en negrita: weight=ft.FontWeight.BOLD"
cargo = find_one(ft.Text, value="Desarrolladora de apps")
assert cargo.italic, "«Desarrolladora de apps» debería ir en cursiva: italic=True"
assert cargo.color == ft.Colors.BLUE_GREY_400, "«Desarrolladora de apps» debería tener color=ft.Colors.BLUE_GREY_400"
find_one(ft.Text, value="Bogotá, Colombia")
assert page().horizontal_alignment == ft.CrossAxisAlignment.CENTER, "Centra el contenido con page.horizontal_alignment = ft.CrossAxisAlignment.CENTER"
