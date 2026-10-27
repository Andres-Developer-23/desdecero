_g = {"Valentina": 4.2, "Santiago": 2.8, "Mariana": 3.0, "Sebastián": 3.9, "Isabella": 2.5}
assert aprobados(_g) == ["Mariana", "Sebastián", "Valentina"], "Con la mínima por defecto (3.0) deberían aprobar Mariana, Sebastián y Valentina, en ese orden"
assert aprobados(_g, 4.0) == ["Valentina"], "Con mínima 4.0 solo aprueba Valentina"
assert aprobados({}) == [], "Con un diccionario vacío debería devolver una lista vacía"
assert aprobados({"Zoe": 5.0, "Ana": 3.5}) == ["Ana", "Zoe"], "La lista tiene que salir ordenada alfabéticamente"
