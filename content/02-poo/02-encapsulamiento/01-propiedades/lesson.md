---
title: Propiedades
minutes: 20
summary: Atributos internos con _, y @property para leer, validar y calcular atributos.
---

Hasta ahora cualquiera puede cambiar los atributos de un objeto a cualquier valor, aunque no tenga sentido:

```py
class Producto:
    def __init__(self, nombre, precio):
        self.nombre = nombre
        self.precio = precio


cafe = Producto("Café", 18900)
cafe.precio = -500
print(cafe.precio)
```

Un precio negativo rompe el resto del programa, y el error aparecerá lejos de donde se cometió. **Encapsular** es proteger los datos de un objeto para que solo cambien de formas válidas.

Python no tiene atributos realmente privados. Se usa una **convención**: un nombre que empieza por guion bajo (`self._precio`) avisa de que es interno y que no se debe tocar desde fuera de la clase. (Con dos guiones bajos, `self.__precio`, Python además cambia el nombre por dentro para que sea más difícil tocarlo por accidente.)

Para controlar la lectura y la escritura se usan las **propiedades**. Desde fuera se ven como un atributo normal, pero por dentro son métodos:

```py
class Producto:
    def __init__(self, nombre, precio):
        self.nombre = nombre
        self.precio = precio  # pasa por el setter: también se valida al crear

    @property
    def precio(self):
        return self._precio

    @precio.setter
    def precio(self, valor):
        if valor <= 0:
            raise ValueError("El precio debe ser positivo")
        self._precio = valor


cafe = Producto("Café", 18900)
cafe.precio = 21000
print(cafe.precio)
try:
    cafe.precio = -500
except ValueError as error:
    print("Error:", error)
print(cafe.precio)
```

- `@property` convierte el método `precio` en la forma de **leer** `cafe.precio`.
- `@precio.setter` define qué pasa al **escribir** `cafe.precio = valor`: aquí, comprobar y guardar en `_precio`.
- En `__init__`, `self.precio = precio` usa el setter, así que también se valida al crear el objeto.

Una propiedad sin setter es **de solo lectura**, y es la forma natural de tener atributos calculados que siempre están al día:

```py
class Temperatura:
    def __init__(self, celsius):
        self.celsius = celsius

    @property
    def fahrenheit(self):
        return self.celsius * 9 / 5 + 32


hoy = Temperatura(25)
print(hoy.fahrenheit)
hoy.celsius = 30
print(hoy.fahrenheit)
```

Si intentas asignar `hoy.fahrenheit = 100`, Python da un `AttributeError`: no hay setter.

## Ejercicio

Crea una clase `Producto` con `nombre`, `precio` y `stock` (por defecto `0`), donde:

- `precio` es una propiedad: al asignarla, si el valor no es mayor que 0, lanza `ValueError("El precio debe ser positivo")`.
- `stock` es una propiedad: si el valor es negativo, lanza `ValueError("El stock no puede ser negativo")`.
- `agotado` es una propiedad de solo lectura que vale `True` cuando el stock es 0.
- Las validaciones se aplican también al crear el producto.

Con el programa de abajo, la salida debería ser:

```txt
Café: 18900 · agotado: True
Café: 18900 · agotado: False
Error: El stock no puede ser negativo
Error: El precio debe ser positivo
```

## Pista

Guarda los valores en self._precio y self._stock. En __init__, asigna self.precio = precio y self.stock = stock para que pasen por los setters. agotado solo necesita @property y return self._stock == 0.
