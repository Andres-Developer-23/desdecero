---
title: Comparar y ordenar objetos
minutes: 20
summary: __eq__ y __lt__ para comparar objetos, ordenarlos con sorted() y buscar el mayor con max().
---

Dos objetos distintos con los mismos datos **no son iguales** para Python, salvo que le digas cómo compararlos:

```py
class Punto:
    def __init__(self, x, y):
        self.x = x
        self.y = y


a = Punto(1, 2)
b = Punto(1, 2)
print(a == b)
print(a == a)
```

Por defecto, `==` solo es verdadero si los dos lados son **el mismo objeto**, igual que `is`. Para comparar por contenido se escribe `__eq__`, que Python llama al hacer `a == b`. Si el otro objeto no es de la misma clase, lo correcto es devolver `NotImplemented`: así Python sabe que no puede compararlos y responde `False` en lugar de dar un error.

```py
class Punto:
    def __init__(self, x, y):
        self.x = x
        self.y = y

    def __eq__(self, otro):
        if not isinstance(otro, Punto):
            return NotImplemented
        return self.x == otro.x and self.y == otro.y


print(Punto(1, 2) == Punto(1, 2))
print(Punto(1, 2) != Punto(3, 4))
print(Punto(1, 2) == "un texto")
print(Punto(1, 2) in [Punto(0, 0), Punto(1, 2)])
```

Con `__eq__`, también funcionan `!=` y el operador `in` con listas.

Para **ordenar**, Python necesita saber qué objeto va antes. Eso lo dice `__lt__` (*less than*, «menor que»), que se usa al hacer `a < b`. Con él funcionan también `sorted()`, `.sort()`, `min()` y `max()`:

```py
class Carta:
    def __init__(self, valor, palo):
        self.valor = valor
        self.palo = palo

    def __lt__(self, otra):
        return self.valor < otra.valor

    def __repr__(self):
        return f"{self.valor} de {self.palo}"


mano = [Carta(7, "copas"), Carta(1, "oros"), Carta(12, "espadas")]
print(sorted(mano))
print(max(mano))
print(sorted(mano, reverse=True))
```

Si solo necesitas ordenar de una forma concreta una vez, no hace falta tocar la clase: `sorted(mano, key=lambda carta: carta.palo)` ordena por el atributo que quieras. `__lt__` define el orden **natural** de tus objetos, el que tiene sentido por defecto.

## Ejercicio

Crea una clase `Jugador` con los atributos `nombre` y `puntos` y estos métodos especiales:

- `__eq__`: dos jugadores son iguales si tienen el mismo nombre **y** los mismos puntos. Si el otro no es un `Jugador`, devuelve `NotImplemented`.
- `__lt__`: un jugador es menor que otro si tiene **menos puntos**.
- `__repr__`: devuelve `Jugador('Ana', 30)`.

El programa de abajo los usa para mostrar la clasificación; su salida debería ser:

```txt
[Jugador('Bruno', 45), Jugador('Ana', 30), Jugador('Carla', 12)]
Ganador: Bruno
True
False
```

## Pista

__eq__ compara self.nombre con otro.nombre y self.puntos con otro.puntos; __lt__ solo compara los puntos. sorted(..., reverse=True) ordena de mayor a menor.
