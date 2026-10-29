---
title: Iconos y botones
minutes: 15
summary: ft.Icon, los cuatro estilos de botón y los botones de icono.
---

Los iconos se muestran con `ft.Icon` y se eligen en `ft.Icons`, que incluye todos los iconos de Material Design: `ft.Icons.HOME`, `ft.Icons.FAVORITE`, `ft.Icons.SETTINGS`... Puedes cambiar su `color` y su `size`:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Icon(ft.Icons.FAVORITE, color=ft.Colors.PINK, size=40),
        ft.Icon(ft.Icons.STAR, color=ft.Colors.AMBER),
        ft.Icon(ft.Icons.SETTINGS),
    )

ft.run(main)
```

Flet tiene varios estilos de botón. Todos llevan el texto en `content` y pueden llevar un `icon`:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.FilledButton(content="FilledButton", icon=ft.Icons.CHECK),
        ft.Button(content="Button"),
        ft.OutlinedButton(content="OutlinedButton"),
        ft.TextButton(content="TextButton"),
    )

ft.run(main)
```

- `ft.FilledButton`: relleno de color. Para la acción principal de una pantalla.
- `ft.Button`: fondo suave con sombra.
- `ft.OutlinedButton`: solo el borde. Para acciones secundarias.
- `ft.TextButton`: solo el texto. Para acciones de poca importancia, como «Cancelar».

Cuando un botón solo necesita un icono (borrar, cerrar, añadir) se usa `ft.IconButton`. Como no tiene texto, conviene darle un `tooltip`: el texto que aparece al pasar el ratón y que leen los lectores de pantalla.

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.IconButton(icon=ft.Icons.DELETE, icon_color=ft.Colors.RED, tooltip="Borrar"),
        ft.IconButton(icon=ft.Icons.FAVORITE_BORDER, tooltip="Me gusta"),
    )

ft.run(main)
```

Si has visto código de versiones anteriores de Flet: en Flet 1.0 `ft.ElevatedButton` pasó a llamarse `ft.Button`, y el texto de los botones va en `content`, no en `text`. El simulador te avisa si usas los nombres antiguos.

De momento los botones no hacen nada al pulsarlos. En el módulo de eventos les darás vida.

## Ejercicio

Crea una app con estos cuatro controles, en este orden:

1. Un icono `ft.Icons.STAR` de color `ft.Colors.AMBER` y tamaño 48.
2. Un `ft.FilledButton` con el texto `Guardar` y el icono `ft.Icons.SAVE`.
3. Un `ft.OutlinedButton` con el texto `Cancelar`.
4. Un `ft.IconButton` con el icono `ft.Icons.DELETE` y el tooltip `Borrar`.

## Pista

Ponlos todos en el mismo page.add(...), separados por comas. El texto de los botones va en content="..." y el icono en icon=ft.Icons.SAVE.
