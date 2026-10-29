---
title: Repartir el espacio y listas largas
minutes: 20
summary: expand para ocupar el espacio libre y ListView para listas con desplazamiento.
---

Con `expand=True` un control ocupa todo el espacio que queda libre en su fila o columna. Es lo habitual para un buscador, con el campo estirado y el botón a su lado:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Row([
            ft.TextField(label="Buscar", expand=True),
            ft.IconButton(icon=ft.Icons.SEARCH, tooltip="Buscar"),
        ]),
    )

ft.run(main)
```

Un `TextField` dentro de una fila **necesita** `expand=True` o un `width`: sin eso, Flet no sabe qué ancho darle y la app da un error al arrancar. El simulador le da un ancho fijo para que puedas seguir, pero en Flet de verdad falla, así que acostúmbrate a escribirlo.

Si varios controles tienen `expand`, se reparten el espacio. Con números en lugar de `True` decides la proporción: `expand=2` ocupa el doble que `expand=1`.

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Row([
            ft.Container(content=ft.Text("1/3"), bgcolor=ft.Colors.TEAL_100, padding=10, expand=1),
            ft.Container(content=ft.Text("2/3"), bgcolor=ft.Colors.TEAL_300, padding=10, expand=2),
        ]),
    )

ft.run(main)
```

Para listas largas está `ft.ListView`: funciona como una columna, pero se puede **desplazar** cuando los elementos no caben. Con `expand=True` ocupa el alto que queda en la página. Y como `controls` es una lista de Python, puedes llenarla con un bucle:

```py
import flet as ft

def main(page: ft.Page):
    lista = ft.ListView(spacing=8, expand=True)
    for numero in range(1, 31):
        lista.controls.append(ft.Text(f"Elemento {numero}"))
    page.add(ft.Text("Mi lista", size=20), lista)

ft.run(main)
```

## Ejercicio

Crea la pantalla de un buscador:

1. Una fila con un `TextField` con la etiqueta `Buscar` que ocupe todo el espacio libre (`expand=True`) y un `IconButton` con `ft.Icons.SEARCH`.
2. Debajo, un `ListView` con `expand=True` y `spacing=5` que contenga 20 textos: `Resultado 1`, `Resultado 2`... hasta `Resultado 20`. Créalos con un bucle `for`.

## Pista

Recorre range(1, 21) y en cada vuelta haz resultados.controls.append(ft.Text(...)). Al ListView le faltan expand=True y spacing=5.
