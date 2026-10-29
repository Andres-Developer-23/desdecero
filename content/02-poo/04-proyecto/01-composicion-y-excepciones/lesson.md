---
title: Composición y excepciones propias
minutes: 25
summary: Objetos que contienen otros objetos, y errores con nombre propio para tu programa.
---

La herencia expresa «**es un**». Pero la relación más común entre objetos es otra: «**tiene un**». Una biblioteca no *es* un libro, *tiene* libros; un pedido tiene líneas; un coche tiene un motor. Construir objetos a partir de otros objetos se llama **composición**, y en la práctica se usa mucho más que la herencia.

```py
class Linea:
    def __init__(self, producto, cantidad, precio):
        self.producto = producto
        self.cantidad = cantidad
        self.precio = precio

    def subtotal(self):
        return self.cantidad * self.precio


class Pedido:
    def __init__(self, cliente):
        self.cliente = cliente
        self.lineas = []

    def agregar(self, producto, cantidad, precio):
        self.lineas.append(Linea(producto, cantidad, precio))

    def total(self):
        return sum(linea.subtotal() for linea in self.lineas)


pedido = Pedido("Ana")
pedido.agregar("Pan", 2, 2500)
pedido.agregar("Café", 1, 18900)
print(pedido.cliente, len(pedido.lineas), pedido.total())
```

`Pedido` no hereda de `Linea`: la contiene. Cada clase sabe hacer lo suyo (la línea calcula su subtotal, el pedido suma) y se combinan.

### Excepciones propias

Cuando algo sale mal dentro de tus clases, lanza un error con `raise` en lugar de imprimir un mensaje o devolver `None`: así quien usa la clase decide qué hacer. Y en vez de usar siempre `ValueError`, puedes crear **tus propias excepciones** con nombres que digan qué pasó. Son clases que heredan de `Exception`:

```py
class SinExistencias(Exception):
    def __init__(self, producto, pedidas, disponibles):
        super().__init__(f"Solo quedan {disponibles} unidades de {producto} y pediste {pedidas}")
        self.producto = producto
        self.disponibles = disponibles


class Almacen:
    def __init__(self):
        self.stock = {"pan": 5, "café": 0}

    def sacar(self, producto, cantidad):
        disponibles = self.stock.get(producto, 0)
        if cantidad > disponibles:
            raise SinExistencias(producto, cantidad, disponibles)
        self.stock[producto] = disponibles - cantidad


almacen = Almacen()
for producto, cantidad in [("pan", 2), ("café", 1), ("pan", 10)]:
    try:
        almacen.sacar(producto, cantidad)
        print("OK:", producto, cantidad)
    except SinExistencias as error:
        print("Error:", error)
        print("   quedan", error.disponibles)
```

- `super().__init__(mensaje)` fija el texto que se ve al imprimir el error.
- La excepción puede guardar datos (`error.disponibles`) para que quien la captura los use.
- Si tienes varias, una clase base común (`class AlmacenError(Exception)`) permite capturarlas todas juntas con un solo `except`.

## Ejercicio

Termina la biblioteca. Ya tiene la clase `Libro` y la base de errores `BibliotecaError`. Te faltan dos excepciones que hereden de `BibliotecaError`:

- `LibroNoEncontrado(titulo)`, con el mensaje `No existe el libro «X»`.
- `LibroPrestado(titulo)`, con el mensaje `«X» ya está prestado`.

Y cuatro métodos de `Biblioteca`:

- `buscar(titulo)`: devuelve el `Libro` con ese título o lanza `LibroNoEncontrado`.
- `prestar(titulo)`: lo busca y, si ya está prestado, lanza `LibroPrestado`; si no, lo marca como prestado.
- `devolver(titulo)`: lo busca y lo marca como no prestado.
- `disponibles()`: devuelve la lista de títulos que no están prestados, en orden.

Con el programa de abajo, la salida debería ser:

```txt
Prestado: Rayuela
Error: «Rayuela» ya está prestado
Error: No existe el libro «Ficciones»
Disponibles: ['Pedro Páramo', 'Aura']
Disponibles: ['Rayuela', 'Pedro Páramo', 'Aura']
```

## Pista

Escribe class LibroNoEncontrado(BibliotecaError) con un __init__(self, titulo) que llame a super().__init__(f"No existe el libro «{titulo}»"). En buscar, recorre self.libros y, si ninguno coincide, raise LibroNoEncontrado(titulo).
