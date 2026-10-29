---
title: Clases y objetos
minutes: 15
summary: Qué es un objeto, cómo se define una clase y para qué sirven __init__ y self.
---

Hasta ahora has guardado los datos en variables, listas y diccionarios, y los has procesado con funciones. Funciona, pero cuando un programa crece, datos y funciones acaban dispersos: un diccionario para cada libro, otro para cada lector, funciones que reciben esos diccionarios y que hay que acordarse de no mezclar.

La **programación orientada a objetos** (POO) junta en un mismo lugar los datos de una cosa y lo que se puede hacer con ella. Esa unión es un **objeto**. Ya los has usado sin saberlo: un texto es un objeto con datos (sus letras) y comportamiento (`.upper()`, `.split()`...), y una lista también.

Para crear tus propios tipos de objetos defines una **clase**: el molde a partir del cual se fabrican objetos del mismo tipo. Cada objeto fabricado con ese molde es una **instancia** de la clase.

```py
class Libro:
    def __init__(self, titulo, autor, paginas):
        self.titulo = titulo
        self.autor = autor
        self.paginas = paginas


faro = Libro("El faro de la niebla", "Marta Ibáñez", 312)
versos = Libro("Versos para un lunes", "Clara Montoya", 96)

print(faro.titulo, "·", faro.paginas, "páginas")
print(versos.autor)
print(type(faro))
```

Línea a línea:

- `class Libro:` define la clase. Por convención, los nombres de clase van en **CamelCase**: cada palabra con mayúscula y sin guiones bajos (`Libro`, `CuentaBancaria`).
- `__init__` es un método especial que Python llama **automáticamente** al crear un objeto. Sirve para darle sus datos iniciales.
- `self` es el objeto que se está creando. `self.titulo = titulo` guarda el valor en un **atributo** del objeto: una variable que pertenece a ese objeto.
- `Libro("El faro de la niebla", ...)` crea un objeto nuevo. Los argumentos van a `__init__`; `self` lo pone Python solo.
- `faro.titulo` lee un atributo con un punto.

Cada objeto tiene sus propios atributos, independientes de los de los demás, y se pueden cambiar en cualquier momento:

```py
class Perro:
    def __init__(self, nombre, edad):
        self.nombre = nombre
        self.edad = edad
        self.trucos = []


toby = Perro("Toby", 3)
luna = Perro("Luna", 5)
toby.trucos.append("sentarse")
toby.edad = 4

print(toby.nombre, toby.edad, toby.trucos)
print(luna.nombre, luna.edad, luna.trucos)
print(isinstance(toby, Perro))
```

Fíjate en `self.trucos = []`: no todos los atributos vienen de un argumento. Algunos empiezan siempre con el mismo valor. Y como cada `Perro` crea su propia lista al nacer, el truco de Toby no aparece en la de Luna.

`isinstance(objeto, Clase)` responde si un objeto es de una clase: lo usarás mucho más adelante, con la herencia.

## Ejercicio

Crea una clase `Pelicula` cuyo `__init__` reciba `titulo`, `director` y `anio`, los guarde en atributos con esos mismos nombres y cree además el atributo `vista`, que empieza siempre en `False`.

Después crea dos películas, marca la primera como vista cambiando su atributo y muestra:

```txt
La ciudad dormida (2019), de Ana Torres · vista: True
Viaje al fondo del mar (2023), de Luis Vega · vista: False
```

## Pista

En __init__, escribe self.titulo = titulo y lo mismo con director y anio; vista no es un argumento: self.vista = False. Para marcar la primera, primera.vista = True.
