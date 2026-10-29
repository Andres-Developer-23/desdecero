---
title: Contenedores
minutes: 20
summary: "Container: fondo, bordes, esquinas redondeadas, márgenes, relleno y tamaño fijo."
---

`ft.Container` envuelve un control para darle aspecto y espacio. Es la «caja» con la que se hacen tarjetas, botones a medida o zonas de color.

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Container(
            content=ft.Text("Dentro de un contenedor"),
            bgcolor=ft.Colors.AMBER_100,
            padding=20,
            border_radius=10,
        ),
        ft.Container(
            content=ft.Text("Con borde y margen"),
            border=ft.Border.all(2, ft.Colors.TEAL),
            padding=ft.Padding.symmetric(vertical=8, horizontal=24),
            margin=ft.Margin.only(left=40),
            border_radius=20,
        ),
    )

ft.run(main)
```

- `content`: el control que va dentro.
- `bgcolor`: el color de fondo.
- `padding`: el espacio **entre el borde y el contenido**. Con un número es igual en los cuatro lados; con `ft.Padding.all(10)`, `ft.Padding.symmetric(vertical=..., horizontal=...)` o `ft.Padding.only(left=..., top=...)` eliges lado a lado.
- `margin`: el espacio **por fuera** del borde, con `ft.Margin` de la misma forma.
- `border_radius`: redondea las esquinas.
- `border`: un borde, por ejemplo `ft.Border.all(2, ft.Colors.TEAL)` (grosor y color).
- `width` y `height`: tamaño fijo en píxeles.
- `alignment`: dónde va el contenido dentro de la caja, por ejemplo `ft.Alignment.CENTER`, `ft.Alignment.TOP_LEFT` o `ft.Alignment.BOTTOM_RIGHT`.

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Container(
            content=ft.Text("Centro", color=ft.Colors.WHITE),
            width=160,
            height=100,
            bgcolor=ft.Colors.INDIGO,
            border_radius=12,
            alignment=ft.Alignment.CENTER,
        ),
    )

ft.run(main)
```

En Flet 1.0 estos valores se crean con clases: `ft.Padding.all(10)`, `ft.Border.all(...)`, `ft.Alignment.CENTER`. Las funciones antiguas en minúscula, como `ft.padding.all` o `ft.alignment.center`, ya no existen.

## Ejercicio

Crea una insignia: un `Container` de 200 píxeles de ancho y 100 de alto, con fondo `ft.Colors.AMBER_100`, esquinas redondeadas de 12, el contenido centrado y, dentro, un `Text` con el valor `Nivel 1` en negrita y de tamaño 24.

## Pista

El texto va en content=ft.Text(...). Para centrarlo, alignment=ft.Alignment.CENTER; para el tamaño, width=200 y height=100.
