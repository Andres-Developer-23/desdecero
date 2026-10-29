assert cafe.stock == 12, "Un valor no válido no debería cambiar el stock: sigue siendo 12, no " + str(cafe.stock)
try:
    Producto("Agua", 1000, -3)
    assert False, "Producto(\"Agua\", 1000, -3) debería lanzar ValueError: valida el stock también al crear"
except ValueError:
    pass
try:
    cafe.agotado = True
    assert False, "agotado debería ser de solo lectura (una @property sin setter)"
except AttributeError:
    pass
