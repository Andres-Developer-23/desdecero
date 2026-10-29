caro = Producto("Queso", 1234567)
assert str(caro) == "Queso · $ 1.234.567", "str() de Producto(\"Queso\", 1234567) debería ser «Queso · $ 1.234.567», no " + repr(str(caro))
assert repr(caro) == "Producto('Queso', 1234567)", "repr() debería ser «Producto('Queso', 1234567)», no " + repr(repr(caro))
