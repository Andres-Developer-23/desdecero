---
title: Un repositorio con SQL
minutes: 16
summary: "El patrón repositorio: una clase que guarda y lee los datos, para que el resto del programa no tenga que saber SQL."
---

Cuando un programa crece, tener sentencias SQL repartidas por todas partes se vuelve un problema: para cambiar una tabla hay que buscar cada consulta que la usa, y probar el programa obliga a preparar una base de datos para cada prueba. La solución habitual es concentrar todo el acceso a los datos en una clase, un **repositorio**:

- es la **única** parte del programa que habla con la base de datos;
- el resto del programa le pide y le da objetos de Python (diccionarios, clases de datos), sin ver ni una línea de SQL;
- recibe la conexión desde fuera, así que en las pruebas se le puede dar una base de datos `":memory:"` nueva.

```py
import sqlite3


class RepositorioClientes:
    """Guarda y lee los clientes de la librería."""

    def __init__(self, conexion):
        self.conexion = conexion
        self.conexion.row_factory = sqlite3.Row

    def todos(self, ciudad=None):
        if ciudad is None:
            filas = self.conexion.execute("SELECT id, nombre, ciudad FROM clientes ORDER BY id")
        else:
            filas = self.conexion.execute(
                "SELECT id, nombre, ciudad FROM clientes WHERE ciudad = ? ORDER BY id", (ciudad,)
            )
        return [dict(fila) for fila in filas]

    def buscar(self, id):
        fila = self.conexion.execute("SELECT id, nombre, ciudad FROM clientes WHERE id = ?", (id,)).fetchone()
        return dict(fila) if fila else None

    def mudar(self, id, ciudad):
        """Cambia la ciudad de un cliente. Devuelve False si no existe."""
        with self.conexion:
            cursor = self.conexion.execute("UPDATE clientes SET ciudad = ? WHERE id = ?", (ciudad, id))
        return cursor.rowcount == 1


clientes = RepositorioClientes(sqlite3.connect("libreria.db"))
print(clientes.todos("Cali"))
print(clientes.mudar(3, "Popayán"), clientes.mudar(99, "Popayán"))
print(clientes.buscar(3))
print(clientes.buscar(99))
```

Fíjate en las decisiones que toma el repositorio por el resto del programa:

- **Qué devuelve**: diccionarios con claves claras, no tuplas ni objetos `Row`. Si una fila no existe, `None`.
- **Las transacciones**: cada método que cambia datos usa `with self.conexion:`, así que quien lo llama no tiene que acordarse del `commit()`.
- **Qué pasó**: `rowcount` permite responder `True` o `False` (¿existía el cliente?), algo que una API necesitará para elegir entre 200 y 404.
- **Los tipos**: SQLite no tiene `bool`, así que si una columna guarda 0 o 1, el repositorio la convierte con `bool()` para que el resto del programa vea `True` y `False`.

Un repositorio también puede crear sus tablas al empezar, con `CREATE TABLE IF NOT EXISTS` en el `__init__`, para que el programa funcione con una base de datos vacía.

Es la misma idea de la ruta de programación orientada a objetos: cada clase con una responsabilidad. Si mañana los datos pasan a otra base de datos (PostgreSQL, por ejemplo), solo cambia el repositorio.

## Ejercicio

Escribe la clase `RepositorioTareas`, que guarda tareas en una base de datos:

- `__init__(self, conexion)`: guarda la conexión en `self.conexion` y crea, si no existe, la tabla `tareas` con `id` (clave primaria), `titulo` (texto obligatorio) y `hecha` (entero obligatorio, 0 por defecto).
- `crear(titulo)`: guarda la tarea con el título sin espacios en los extremos y devuelve su diccionario. Si el título queda vacío, lanza `ValueError("El título no puede estar vacío")`.
- `todas(solo_pendientes=False)`: la lista de tareas por orden de `id`; con `solo_pendientes=True`, solo las que no están hechas.
- `buscar(id)`: el diccionario de la tarea, o `None`.
- `marcar_hecha(id)` y `borrar(id)`: devuelven `True` si la tarea existía y `False` si no.

Cada tarea es un diccionario como `{"id": 1, "titulo": "Comprar pan", "hecha": False}`, con `hecha` como `bool`. Los cambios tienen que quedar confirmados.

## Pista

Una función auxiliar evita repetir la conversión: `def _tarea(fila): return {"id": fila["id"], "titulo": fila["titulo"], "hecha": bool(fila["hecha"])}`. Para `todas()`, añade `WHERE hecha = 0` solo si `solo_pendientes`. En `marcar_hecha` y `borrar`, devuelve `cursor.rowcount == 1`.
