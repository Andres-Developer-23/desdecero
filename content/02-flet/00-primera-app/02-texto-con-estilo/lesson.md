---
title: Texto con estilo
minutes: 15
summary: Tamaño, grosor, color y cursiva del texto, y cómo centrar el contenido de la página.
---

`ft.Text` tiene propiedades para cambiar su aspecto. Se pasan como argumentos con nombre:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Text("Título", size=32, weight=ft.FontWeight.BOLD),
        ft.Text("Subtítulo en cursiva", size=18, italic=True),
        ft.Text("Texto de color", color=ft.Colors.DEEP_ORANGE),
    )

ft.run(main)
```

- `size`: tamaño en píxeles (por defecto, 14).
- `weight`: grosor. `ft.FontWeight.BOLD` es negrita; también hay de `ft.FontWeight.W_100` (muy fina) a `ft.FontWeight.W_900`.
- `italic=True`: cursiva.
- `color`: color del texto.

Los colores con nombre están en `ft.Colors`: `RED`, `BLUE`, `GREEN`, `AMBER`... Cada uno tiene tonos del 50 (muy claro) al 900 (muy oscuro), como `ft.Colors.BLUE_100` o `ft.Colors.BLUE_900`. También puedes escribir un color en hexadecimal, como en la web: `color="#7b1fa2"`.

La página también tiene propiedades. Con `horizontal_alignment` y `vertical_alignment` se centra su contenido, y con `bgcolor` cambia el fondo:

```py
import flet as ft

def main(page: ft.Page):
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.vertical_alignment = ft.MainAxisAlignment.CENTER
    page.bgcolor = ft.Colors.BLUE_GREY_50
    page.add(
        ft.Text("Centrado", size=28, weight=ft.FontWeight.BOLD, color=ft.Colors.INDIGO),
    )

ft.run(main)
```

¿Por qué dos tipos distintos? La página coloca los controles en columna: su dirección **principal** es la vertical (`ft.MainAxisAlignment`) y la **cruzada**, la horizontal (`ft.CrossAxisAlignment`). Lo verás con calma en el módulo de layout.

## Ejercicio

Crea una tarjeta de presentación con el contenido centrado en horizontal (`page.horizontal_alignment`) y estos tres textos, en este orden:

- `Ana Ruiz`, de tamaño 30 y en negrita.
- `Desarrolladora de apps`, en cursiva y de color `ft.Colors.BLUE_GREY_400`.
- `Bogotá, Colombia`, sin estilo.

## Pista

Los estilos van dentro de cada ft.Text: size=30, weight=ft.FontWeight.BOLD, italic=True y color=ft.Colors.BLUE_GREY_400. Para centrar: page.horizontal_alignment = ft.CrossAxisAlignment.CENTER.
