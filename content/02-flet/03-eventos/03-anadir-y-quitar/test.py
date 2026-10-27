from fletsim import *

campo = find_one(ft.TextField, label="Producto")
lista = find_one(ft.Column)
type_text(campo, " Pan ")
click("Añadir")
type_text(campo, "Leche")
click("Añadir")
productos = [c.value for c in lista.controls if isinstance(c, ft.Text)]
assert productos == ["Pan", "Leche"], "Después de añadir « Pan » y «Leche» la lista debería tener «Pan» y «Leche». Ahora: " + str(productos)
assert campo.value == "", "Después de añadir, el campo debería quedar vacío"
type_text(campo, "   ")
click("Añadir")
assert len(lista.controls) == 2, "Con el campo vacío no se debería añadir nada"
click("Vaciar")
assert len(lista.controls) == 0, "«Vaciar» debería quitar todos los productos"
