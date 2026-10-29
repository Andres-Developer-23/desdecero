class Producto:
    def __init__(self, nombre, precio, stock=0):
        self.nombre = nombre
        # Asigna aquí precio y stock pasando por las propiedades

    # Escribe aquí las propiedades precio, stock y agotado


cafe = Producto("Café", 18900)
print(f"{cafe.nombre}: {cafe.precio} · agotado: {cafe.agotado}")
cafe.stock = 12
print(f"{cafe.nombre}: {cafe.precio} · agotado: {cafe.agotado}")
try:
    cafe.stock = -1
except ValueError as error:
    print("Error:", error)
try:
    Producto("Té", 0)
except ValueError as error:
    print("Error:", error)
