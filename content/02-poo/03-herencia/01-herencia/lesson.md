---
title: Herencia
minutes: 25
summary: "Crear clases a partir de otras: heredar, ampliar con super() y sobrescribir métodos."
---

A menudo varias clases se parecen mucho: un gerente es un empleado con algo más; una moto y un camión son vehículos. Copiar el código de una clase a otra obliga a cambiarlo en dos sitios. La **herencia** permite crear una clase a partir de otra: la nueva (**subclase** o clase hija) recibe todos los atributos y métodos de la original (**clase base** o padre) y añade o cambia lo que necesite.

```py
class Empleado:
    def __init__(self, nombre, sueldo):
        self.nombre = nombre
        self.sueldo = sueldo

    def presentarse(self):
        return f"Soy {self.nombre}"

    def sueldo_anual(self):
        return self.sueldo * 12


class Gerente(Empleado):
    pass


jefa = Gerente("Lucía", 5000)
print(jefa.presentarse(), jefa.sueldo_anual())
print(isinstance(jefa, Gerente), isinstance(jefa, Empleado))
```

`class Gerente(Empleado):` dice que `Gerente` hereda de `Empleado`. Aunque no tenga nada propio (`pass`), ya sabe presentarse y calcular el sueldo anual. Y un gerente **es un** empleado: `isinstance(jefa, Empleado)` es `True`.

Lo interesante es **ampliar** y **cambiar**:

```py
class Empleado:
    def __init__(self, nombre, sueldo):
        self.nombre = nombre
        self.sueldo = sueldo

    def presentarse(self):
        return f"Soy {self.nombre}"

    def sueldo_anual(self):
        return self.sueldo * 12


class Gerente(Empleado):
    def __init__(self, nombre, sueldo, equipo):
        super().__init__(nombre, sueldo)
        self.equipo = equipo

    def presentarse(self):
        return super().presentarse() + f" y dirijo a {len(self.equipo)} personas"

    def sueldo_anual(self):
        return super().sueldo_anual() + 2000


jefa = Gerente("Lucía", 5000, ["Ana", "Luis", "Eva"])
for persona in [Empleado("Ana", 3000), jefa]:
    print(persona.presentarse(), "·", persona.sueldo_anual())
```

- Si la subclase define un método con el mismo nombre, **sobrescribe** el de la base: los gerentes se presentan de otra forma.
- `super()` da acceso a la versión de la clase base. `super().__init__(nombre, sueldo)` reutiliza la inicialización del empleado y luego se añade lo propio (`self.equipo`). Sin esa línea, el gerente no tendría `nombre` ni `sueldo`.
- `super().sueldo_anual() + 2000` aprovecha el cálculo de la base y lo amplía, en lugar de repetirlo.

Usa la herencia cuando la relación «**es un**» tenga sentido de verdad (un gerente es un empleado). Si solo quieres reutilizar un trozo de código, suele ser mejor otra herramienta: lo verás en el proyecto final.

## Ejercicio

Crea estas tres clases:

- `Vehiculo(marca, modelo)`, con un atributo de clase `ruedas = 4` y un método `descripcion()` que devuelve `"Renault Kangoo (4 ruedas)"`.
- `Moto`, que hereda de `Vehiculo` y solo cambia `ruedas` a `2`.
- `Camion`, que hereda de `Vehiculo`, recibe además `carga` (toneladas), llama a `super().__init__` y sobrescribe `descripcion()` para añadir `" · carga: 12 t"` a la descripción de la base, usando `super()`.

Con el programa de abajo, la salida debería ser:

```txt
Renault Kangoo (4 ruedas)
Yamaha XTZ (2 ruedas)
Volvo FH (4 ruedas) · carga: 12 t
```

## Pista

En descripcion(), usa self.ruedas: así cada subclase enseña sus ruedas. En Camion.descripcion(), return super().descripcion() + f" · carga: {self.carga} t".
