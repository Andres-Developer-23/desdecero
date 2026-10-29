assert isinstance(ciudades, list) and len(ciudades) == 12, "ciudades debería tener las 12 filas de la tabla, no " + str(len(ciudades))
assert ciudades[0] == {"ciudad": "Bogotá", "maxima": 19, "minima": 8, "lluvia": 70}, "La primera fila debería ser {'ciudad': 'Bogotá', 'maxima': 19, 'minima': 8, 'lluvia': 70}, no " + str(ciudades[0])
