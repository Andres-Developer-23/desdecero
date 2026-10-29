class Usuario:
    # Escribe aquí los atributos de clase

    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad

    # Escribe aquí correo, desde_texto y es_mayor_de_edad


usuarios = [Usuario.desde_texto("Ana Ruiz, 15"), Usuario("Luis Mora Vega", 32)]
for usuario in usuarios:
    mayor = Usuario.es_mayor_de_edad(usuario.edad)
    print(f"{usuario.correo()} · {usuario.edad} años · mayor: {mayor}")
print("Usuarios creados:", Usuario.total)
