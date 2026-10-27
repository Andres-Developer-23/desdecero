assert convertir(100000) == 25.0, "convertir(100000) debería devolver 25.0, usando USD por defecto"
assert convertir(100000, "EUR") == 22.73, "convertir(100000, 'EUR') debería devolver 22.73"
assert convertir(50000, moneda="USD") == 12.5, "convertir(50000, moneda='USD') debería devolver 12.5"
assert convertir(1000, "JPY") is None, "Con una moneda que no está en tasas debería devolver None"
