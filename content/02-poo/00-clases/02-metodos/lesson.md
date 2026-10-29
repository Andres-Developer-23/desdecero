---
title: Métodos
minutes: 20
summary: Funciones dentro de una clase que leen y cambian el estado de cada objeto.
---

Los atributos son los datos de un objeto. Su comportamiento se define con **métodos**: funciones escritas dentro de la clase que reciben el objeto como primer parámetro, `self`.

```py
class Mascota:
    def __init__(self, nombre):
        self.nombre = nombre
        self.energia = 50

    def comer(self):
        self.energia += 30

    def jugar(self, minutos):
        self.energia -= minutos

    def estado(self):
        return f"{self.nombre} tiene {self.energia} de energía"


michi = Mascota("Michi")
michi.comer()
michi.jugar(20)
print(michi.estado())
```

- Un método se llama con un punto, como los de los textos o las listas: `michi.comer()`.
- Python pasa el objeto como `self` sin que lo escribas: `michi.jugar(20)` es lo mismo que `Mascota.jugar(michi, 20)`.
- Dentro del método, `self.energia` es la energía de **ese** objeto. Por eso los métodos pueden leerla y cambiarla.
- Un método puede devolver un valor con `return`, como cualquier función.

Los métodos son el lugar ideal para las **reglas** del objeto. Si la energía nunca puede pasar de 100 ni bajar de 0, esa regla se escribe una vez dentro de la clase y nadie tiene que acordarse de ella al usarla. `min` y `max` vienen muy bien para eso:

```py
class Mascota:
    def __init__(self, nombre):
        self.nombre = nombre
        self.energia = 50

    def comer(self):
        self.energia = min(100, self.energia + 30)

    def jugar(self, minutos):
        self.energia = max(0, self.energia - minutos)
        if self.esta_cansada():
            print(f"{self.nombre} necesita descansar")

    def esta_cansada(self):
        return self.energia < 20


michi = Mascota("Michi")
for _ in range(3):
    michi.comer()
print(michi.energia)
michi.jugar(90)
print(michi.energia, michi.esta_cansada())
```

Un método puede llamar a otro del mismo objeto con `self.otro_metodo()`, como hace `jugar` con `esta_cansada`. Así cada método hace una sola cosa y el código se lee casi como una frase.

## Ejercicio

Crea una clase `Bateria` con un atributo `nivel` que empiece en `0` y estos métodos:

- `cargar(minutos)`: sube el nivel 2 puntos por minuto, **sin pasar de 100**.
- `usar(minutos)`: baja el nivel 1 punto por minuto, **sin bajar de 0**.
- `estado()`: devuelve `"Batería llena"` si el nivel es 100, `"Batería agotada"` si es 0 y, si no, `"Batería al N %"` con el nivel.

El programa de abajo ya usa la clase. Su salida debería ser:

```txt
Batería agotada
Batería al 40 %
Batería llena
Batería al 70 %
Batería agotada
```

## Pista

Para no pasar de 100 usa self.nivel = min(100, self.nivel + minutos * 2), y para no bajar de 0, max(0, ...). En estado(), compara self.nivel con 100 y con 0 antes de devolver el porcentaje.
