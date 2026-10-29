---
title: Atributos y métodos de clase
minutes: 20
summary: Datos compartidos por todos los objetos, constructores alternativos con @classmethod y utilidades con @staticmethod.
---

Los atributos que se crean con `self.` son de cada objeto. Los que se escriben directamente en el cuerpo de la clase son **atributos de clase**: un único valor compartido por todos los objetos. Sirven para constantes y para datos comunes, como un contador:

```py
class Pedido:
    IVA = 0.19
    creados = 0

    def __init__(self, subtotal):
        self.subtotal = subtotal
        Pedido.creados += 1
        self.numero = Pedido.creados

    def total(self):
        return self.subtotal * (1 + self.IVA)


a = Pedido(10000)
b = Pedido(5000)
print(a.numero, b.numero, Pedido.creados)
print(a.total())
```

- Desde fuera se leen con el nombre de la clase (`Pedido.creados`), y también a través de un objeto (`self.IVA`): si el objeto no tiene un atributo con ese nombre, Python lo busca en la clase.
- Para **cambiarlos**, usa la clase: `Pedido.creados += 1`. Si escribieras `self.creados += 1`, crearías un atributo nuevo solo en ese objeto y el contador de la clase no cambiaría.
- Las constantes se escriben en MAYÚSCULAS por convención.

Ojo con las listas y diccionarios como atributo de clase: todos los objetos compartirían **la misma** lista. Las listas de cada objeto van en `__init__`.

### Métodos de clase y estáticos

Un **método de clase** recibe la clase (`cls`) en lugar del objeto. Su uso más común son los **constructores alternativos**: otras formas de crear objetos, por ejemplo a partir de un texto.

```py
class Fecha:
    def __init__(self, dia, mes, anio):
        self.dia = dia
        self.mes = mes
        self.anio = anio

    @classmethod
    def desde_texto(cls, texto):
        dia, mes, anio = texto.split("/")
        return cls(int(dia), int(mes), int(anio))

    @staticmethod
    def es_bisiesto(anio):
        return anio % 4 == 0 and (anio % 100 != 0 or anio % 400 == 0)

    def __repr__(self):
        return f"Fecha({self.dia}, {self.mes}, {self.anio})"


navidad = Fecha.desde_texto("25/12/2026")
print(navidad)
print(Fecha.es_bisiesto(2028), Fecha.es_bisiesto(2026))
```

- `@classmethod`: el método recibe la clase como `cls`, y `cls(...)` crea un objeto. Se llama desde la clase: `Fecha.desde_texto(...)`.
- `@staticmethod`: el método no recibe ni objeto ni clase. Es una función normal que se guarda en la clase porque tiene que ver con ella.

## Ejercicio

Crea una clase `Usuario` con:

- Un atributo de clase `DOMINIO = "escuela.example"` y un contador de clase `total`, que empieza en `0` y sube cada vez que se crea un usuario.
- `__init__(self, nombre, edad)`.
- Un método `correo()` que devuelve el nombre en minúsculas, con los espacios cambiados por puntos, seguido de `@` y el dominio: `ana.ruiz@escuela.example`.
- Un método de clase `desde_texto(texto)` que crea un usuario a partir de un texto como `"Ana Ruiz, 15"` (nombre, coma y edad).
- Un método estático `es_mayor_de_edad(edad)` que devuelve `True` si la edad es 18 o más.

Con el programa de abajo, la salida debería ser:

```txt
ana.ruiz@escuela.example · 15 años · mayor: False
luis.mora.vega@escuela.example · 32 años · mayor: True
Usuarios creados: 2
```

## Pista

En __init__, Usuario.total += 1. En desde_texto: nombre, edad = texto.split(",") y return cls(nombre.strip(), int(edad)). En correo, usa Usuario.DOMINIO (o self.DOMINIO).
