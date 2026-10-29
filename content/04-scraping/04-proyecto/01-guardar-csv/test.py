import websim

texto = websim.leer("clima.csv")
primera = texto.replace("\r\n", "\n").split("\n")[0]
assert primera == "ciudad,maxima,minima,lluvia,cielo", "La primera línea de clima.csv deberían ser los encabezados ciudad,maxima,minima,lluvia,cielo, no " + repr(primera)
filas = websim.filas_csv("clima.csv")
assert len(filas) == 12, "clima.csv debería tener 12 filas de datos, y tiene " + str(len(filas))
assert filas[0] == {"ciudad": "Bogotá", "maxima": "19", "minima": "8", "lluvia": "70", "cielo": "Lluvioso"}, "La primera fila debería ser Bogotá,19,8,70,Lluvioso, no " + str(filas[0])
assert filas[11]["ciudad"] == "Leticia", "Las ciudades deberían ir en el orden de la tabla"
