def aprobados(notas, minima=3.0):
    lista = []
    for nombre, nota in notas.items():
        if nota >= minima:
            lista.append(nombre)
    return sorted(lista)

grupo = {"Valentina": 4.2, "Santiago": 2.8, "Mariana": 3.0, "Sebastián": 3.9, "Isabella": 2.5}
print(aprobados(grupo))
print(aprobados(grupo, 4.0))
