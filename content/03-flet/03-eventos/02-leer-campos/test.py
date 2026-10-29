from fletsim import *

campo = find_one(ft.TextField, label="Nombre")
type_text(campo, "  Ana ")
click("Saludar")
assert "¡Hola, Ana!" in texts(), "Con «  Ana » en el campo, al pulsar Saludar debería verse «¡Hola, Ana!». Ahora se ve: " + str(texts())
type_text(campo, "   ")
click("Saludar")
assert "Escribe tu nombre" in texts(), "Con el campo vacío debería verse «Escribe tu nombre»"
type_text(campo, "Luis")
submit(campo)
assert "¡Hola, Luis!" in texts(), "Al pulsar Enter en el campo debería saludar igual que el botón (usa on_submit)"
