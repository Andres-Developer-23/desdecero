otra = Bateria()
otra.cargar(5)
assert otra.nivel == 10, "cargar(5) debería subir el nivel de 0 a 10, no a " + str(otra.nivel)
otra.usar(3)
assert otra.nivel == 7, "usar(3) debería bajar el nivel de 10 a 7, no a " + str(otra.nivel)
assert otra.estado() == "Batería al 7 %", "estado() debería devolver el texto, no imprimirlo: " + repr(otra.estado())
assert bateria.nivel == 0, "Cada batería debería tener su propio nivel"
