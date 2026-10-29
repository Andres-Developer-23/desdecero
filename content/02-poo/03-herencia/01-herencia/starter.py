# Escribe aquí las clases Vehiculo, Moto y Camion


flota = [Vehiculo("Renault", "Kangoo"), Moto("Yamaha", "XTZ"), Camion("Volvo", "FH", 12)]
for vehiculo in flota:
    print(vehiculo.descripcion())
