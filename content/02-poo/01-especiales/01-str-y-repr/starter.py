class Producto:
    def __init__(self, nombre, precio):
        self.nombre = nombre
        self.precio = precio

    # Escribe aquí __str__ y __repr__


cafe = Producto("Café", 18900)
print(cafe)
print(repr(cafe))
pedido = [Producto("Pan", 2500), Producto("Leche", 4200)]
print(pedido)
print(f"Total del pedido: {pedido[0]} y {pedido[1]}")
