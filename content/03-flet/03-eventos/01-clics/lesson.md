---
title: Clics y actualización automática
minutes: 20
summary: on_click, el objeto del evento y cómo Flet actualiza la pantalla al terminar.
---

Para que un botón haga algo se le pasa una función en `on_click`. Esa función se llama **manejador de eventos**, y Flet la ejecuta cada vez que se pulsa el botón:

```py
import flet as ft

def main(page: ft.Page):
    mensaje = ft.Text("Todavía no has pulsado")

    def saludar(e):
        mensaje.value = "¡Hola! Has pulsado el botón"

    page.add(mensaje, ft.FilledButton(content="Pulsa aquí", on_click=saludar))

ft.run(main)
```

Fíjate en tres cosas:

- Se pasa `saludar` **sin paréntesis**. Con paréntesis, la función se ejecutaría al crear el botón y no al pulsarlo.
- El manejador está dentro de `main`, así puede usar `mensaje`.
- Para cambiar lo que se ve basta con cambiar las propiedades del control (`mensaje.value = ...`). En Flet 1.0, **al terminar el manejador la pantalla se actualiza sola**. En versiones anteriores había que llamar a `page.update()`; hoy solo hace falta para que algo se vea *antes* de que el manejador termine.

El parámetro `e` es el **evento**: trae información sobre lo que pasó. `e.control` es el control que lo lanzó, y es muy útil cuando varios botones comparten manejador:

```py
import flet as ft

def main(page: ft.Page):
    elegido = ft.Text("Elige una fruta")

    def elegir(e):
        elegido.value = "Has elegido: " + e.control.content

    page.add(
        elegido,
        ft.Row([
            ft.Button(content="Manzana", on_click=elegir),
            ft.Button(content="Pera", on_click=elegir),
            ft.Button(content="Uva", on_click=elegir),
        ]),
    )

ft.run(main)
```

Si no necesitas el evento, el manejador puede no tener parámetros: `def saludar():` también funciona.

Para llevar la cuenta de algo, como un contador, lo más sencillo es guardar el número como texto en el propio `Text` y convertirlo con `int()` cuando haga falta:

```py
import flet as ft

def main(page: ft.Page):
    contador = ft.Text("0", size=40)

    def sumar(e):
        contador.value = str(int(contador.value) + 1)

    page.add(contador, ft.FilledButton(content="Sumar 1", on_click=sumar))

ft.run(main)
```

## Ejercicio

Termina el contador: el `Text` empieza en `0`, el botón `Sumar` ya suma 1 y te falta un botón `Restar` que reste 1. El contador **nunca puede bajar de 0**.

## Pista

Copia el manejador sumar como restar, pero antes de restar comprueba con un if que el número sea mayor que 0. Luego añade ft.FilledButton(content="Restar", on_click=restar) a la fila.
