class Producto:
    def __init__(self, nombre, precio):
        self.nombre = nombre
        self.precio = precio

    def __str__(self):
        precio = f"{self.precio:,}".replace(",", ".")
        return f"{self.nombre} · $ {precio}"

    def __repr__(self):
        return f"Producto({self.nombre!r}, {self.precio})"


cafe = Producto("Café", 18900)
print(cafe)
print(repr(cafe))
pedido = [Producto("Pan", 2500), Producto("Leche", 4200)]
print(pedido)
print(f"Total del pedido: {pedido[0]} y {pedido[1]}")
