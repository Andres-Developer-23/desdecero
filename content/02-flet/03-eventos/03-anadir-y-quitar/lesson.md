---
title: Añadir y quitar controles
minutes: 20
summary: Cambiar la lista controls de una columna con la app abierta, y esconder controles con visible.
---

Los controles de una `Column`, una `Row` o un `ListView` están en su lista `controls`. Es una lista de Python normal, así que con la app ya abierta puedes añadir, quitar o vaciar elementos, y al terminar el manejador la pantalla lo refleja:

```py
import flet as ft

def main(page: ft.Page):
    notas = ft.Column()

    def agregar(e):
        numero = len(notas.controls) + 1
        notas.controls.append(ft.Text("Nota " + str(numero)))

    def quitar_ultima(e):
        if notas.controls:
            notas.controls.pop()

    def vaciar(e):
        notas.controls.clear()

    page.add(
        ft.Row([
            ft.FilledButton(content="Añadir", on_click=agregar),
            ft.OutlinedButton(content="Quitar", on_click=quitar_ultima),
            ft.TextButton(content="Vaciar", on_click=vaciar),
        ]),
        notas,
    )

ft.run(main)
```

Los métodos son los de cualquier lista: `append()` añade al final, `insert(0, ...)` al principio, `remove(control)` quita uno concreto, `pop()` el último y `clear()` todos.

A veces no hace falta quitar un control, solo esconderlo. Todos tienen la propiedad `visible`:

```py
import flet as ft

def main(page: ft.Page):
    secreto = ft.Text("¡Sorpresa!", size=24, visible=False)

    def alternar(e):
        secreto.visible = not secreto.visible

    page.add(ft.Button(content="Mostrar u ocultar", on_click=alternar), secreto)

ft.run(main)
```

## Ejercicio

Termina la lista de la compra. Tiene un campo `Producto`, un botón `Añadir`, una `Column` para los productos y un botón `Vaciar`:

- `Añadir` agrega a la columna un `Text` con el producto, sin espacios de más, y deja el campo vacío.
- Si el campo está vacío, no se añade nada.
- `Vaciar` quita todos los productos.

## Pista

En agregar: guarda producto.value.strip(); si no está vacío, haz lista.controls.append(ft.Text(...)) y luego producto.value = "". En vaciar: lista.controls.clear().
