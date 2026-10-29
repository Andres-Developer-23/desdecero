from fletsim import *

campos = find(ft.TextField)
assert len(campos) == 2, "El formulario debería tener dos TextField; ahora tiene " + str(len(campos))
usuario, clave = campos
assert usuario.label == "Usuario", "El primer campo debería tener label=\"Usuario\""
assert clave.label == "Contraseña", "El segundo campo debería tener label=\"Contraseña\""
assert clave.password, "El campo de la contraseña debería ocultar el texto: password=True"
assert clave.can_reveal_password, "Permite mostrar la contraseña con can_reveal_password=True"
recordar = find_one(ft.Checkbox, label="Recordarme")
assert recordar.value is True, "La casilla «Recordarme» debería empezar marcada: value=True"
find_one(ft.FilledButton, content="Entrar")
