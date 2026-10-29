---
title: "Proyecto: lista de tareas"
minutes: 30
summary: "Una app completa: añadir, completar y borrar tareas, con el número de pendientes."
---

Es hora de juntarlo todo en una app de verdad: una lista de tareas. Antes de escribir código, el plan:

1. Un control propio `Tarea` con una casilla para marcarla como hecha y un botón para borrarla.
2. En `main`: un campo para escribir la tarea nueva, un botón para añadirla, la lista de tareas y un texto con las pendientes.
3. Cada vez que algo cambia, volver a contar las pendientes.

Falta una pieza: cuando se pulsa el botón de borrar de una `Tarea`, la tarea tiene que avisar a `main` para que la quite de la lista. Se resuelve con un campo que guarda una **función**: la tarea la llama y `main` decide qué hacer. Este ejemplo lo hace con avisos que se pueden cerrar:

```py
import flet as ft
from dataclasses import field
from typing import Callable

@ft.control
class Aviso(ft.Row):
    texto: str = ""
    al_cerrar: Callable = field(default=lambda aviso: None)

    def init(self):
        self.controls = [
            ft.Text(self.texto),
            ft.IconButton(icon=ft.Icons.CLOSE, tooltip="Cerrar", on_click=self.cerrar),
        ]

    def cerrar(self, e):
        self.al_cerrar(self)

def main(page: ft.Page):
    avisos = ft.Column()

    def quitar(aviso):
        avisos.controls.remove(aviso)

    for texto in ["Tienes 3 mensajes", "Hoy hay reunión", "Actualiza la app"]:
        avisos.controls.append(Aviso(texto=texto, al_cerrar=quitar))
    page.add(avisos)

ft.run(main)
```

- `from typing import Callable` sirve para anotar que el campo es una función.
- `field(default=...)`, de `dataclasses`, le da un valor por defecto: una función que no hace nada, `lambda aviso: None`, por si alguien crea un `Aviso` sin decir qué hacer al cerrarlo.
- `Aviso` no sabe nada de la lista: solo llama a `self.al_cerrar(self)`. Es `main` quien decide que «cerrar» significa quitarlo de `avisos`.

Así cada pieza tiene una sola responsabilidad, la misma idea que con las funciones de Python.

El código de partida del ejercicio ya trae el control `Tarea` completo, con dos funciones de aviso: `al_borrar` y `al_cambiar`, que se llama al marcar o desmarcar la casilla. Además tiene una **propiedad** `hecha`, que se lee como un campo (`tarea.hecha`) pero se calcula con un método: devuelve si la casilla está marcada.

## Ejercicio

Termina la lista de tareas. Te falta la lógica de `main`:

1. `agregar`: si el campo `nueva` no está vacío, añade a `tareas` una `Tarea` con ese texto (sin espacios de más), con `al_borrar=borrar` y `al_cambiar=actualizar_contador`. Después vacía el campo y actualiza el contador. Funciona con el botón `Añadir` y con Enter.
2. `borrar(tarea)`: quita esa tarea de la lista y actualiza el contador.
3. `actualizar_contador()`: cuenta las tareas sin hacer y muestra `3 tareas pendientes`, o `1 tarea pendiente` si solo queda una.

## Pista

Para contar: len([t for t in tareas.controls if not t.hecha]). En agregar, crea Tarea(texto=..., al_borrar=borrar, al_cambiar=actualizar_contador). Recuerda el caso de una sola tarea, en singular.
