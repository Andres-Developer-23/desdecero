---
title: Filas y columnas
minutes: 20
summary: "Row y Column: colocar controles en horizontal y en vertical, y alinearlos."
---

Hasta ahora todo se colocaba uno debajo de otro. Para organizar la pantalla se combinan dos controles:

- `ft.Row` coloca sus controles **en horizontal**.
- `ft.Column` los coloca **en vertical**.

Los dos reciben una lista de controles (en `controls` o como primer argumento) y dejan un espacio entre ellos que se ajusta con `spacing` (10 píxeles por defecto).

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Row(
            controls=[
                ft.FilledButton(content="Uno"),
                ft.FilledButton(content="Dos"),
                ft.FilledButton(content="Tres"),
            ],
            spacing=20,
        ),
        ft.Column(
            [ft.Text("Arriba"), ft.Text("En medio"), ft.Text("Abajo")],
            spacing=0,
        ),
    )

ft.run(main)
```

Cada una tiene dos direcciones. La **principal** es hacia donde avanzan los controles: horizontal en una fila y vertical en una columna. La **cruzada** es la perpendicular. Por eso se alinean con propiedades distintas:

- En la dirección principal, `alignment` con `ft.MainAxisAlignment`: `START`, `CENTER` o `END`, y para repartir el espacio que sobra `SPACE_BETWEEN`, `SPACE_AROUND` o `SPACE_EVENLY`.
- En la cruzada, `ft.CrossAxisAlignment` (`START`, `CENTER`, `END`): en una fila con `vertical_alignment` y en una columna con `horizontal_alignment`.

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Row(
            [ft.Text("Inicio"), ft.Text("Centro"), ft.Text("Fin")],
            alignment=ft.MainAxisAlignment.SPACE_BETWEEN,
        ),
        ft.Row(
            [ft.Icon(ft.Icons.STAR), ft.Icon(ft.Icons.STAR), ft.Icon(ft.Icons.STAR)],
            alignment=ft.MainAxisAlignment.CENTER,
        ),
    )

ft.run(main)
```

Filas y columnas se pueden anidar: una columna de filas es una tabla, y una fila con una columna dentro es una ficha con foto y textos. Casi cualquier pantalla se construye así.

## Ejercicio

Crea los controles de un reproductor de música:

1. Un `Text` con el valor `Reproduciendo` y tamaño 20.
2. Debajo, una fila centrada (`alignment=ft.MainAxisAlignment.CENTER`) con `spacing=20` y tres `IconButton`, en este orden: `ft.Icons.SKIP_PREVIOUS`, `ft.Icons.PLAY_ARROW` y `ft.Icons.SKIP_NEXT`.

## Pista

Escribe ft.Row([...], alignment=ft.MainAxisAlignment.CENTER, spacing=20) y, dentro de la lista, los tres ft.IconButton(icon=...).
