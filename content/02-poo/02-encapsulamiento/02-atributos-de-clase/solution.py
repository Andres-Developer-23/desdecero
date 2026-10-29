class Usuario:
    DOMINIO = "escuela.example"
    total = 0

    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
        Usuario.total += 1

    def correo(self):
        usuario = self.nombre.lower().replace(" ", ".")
        return f"{usuario}@{Usuario.DOMINIO}"

    @classmethod
    def desde_texto(cls, texto):
        nombre, edad = texto.split(",")
        return cls(nombre.strip(), int(edad))

    @staticmethod
    def es_mayor_de_edad(edad):
        return edad >= 18


usuarios = [Usuario.desde_texto("Ana Ruiz, 15"), Usuario("Luis Mora Vega", 32)]
for usuario in usuarios:
    mayor = Usuario.es_mayor_de_edad(usuario.edad)
    print(f"{usuario.correo()} · {usuario.edad} años · mayor: {mayor}")
print("Usuarios creados:", Usuario.total)
