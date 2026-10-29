class Producto:
    def __init__(self, nombre, precio, stock=0):
        self.nombre = nombre
        self.precio = precio
        self.stock = stock

    @property
    def precio(self):
        return self._precio

    @precio.setter
    def precio(self, valor):
        if valor <= 0:
            raise ValueError("El precio debe ser positivo")
        self._precio = valor

    @property
    def stock(self):
        return self._stock

    @stock.setter
    def stock(self, valor):
        if valor < 0:
            raise ValueError("El stock no puede ser negativo")
        self._stock = valor

    @property
    def agotado(self):
        return self._stock == 0


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
