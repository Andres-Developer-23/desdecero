---
title: Campos de texto y casillas
minutes: 20
summary: "TextField, Checkbox y Switch: los controles con los que el usuario escribe y elige."
---

`ft.TextField` es un campo donde el usuario escribe. Sus propiedades más útiles:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.TextField(label="Nombre"),
        ft.TextField(label="Correo", hint_text="tu@correo.com"),
        ft.TextField(label="Contraseña", password=True, can_reveal_password=True),
    )

ft.run(main)
```

- `label`: la etiqueta que describe el campo. Queda sobre el borde.
- `hint_text`: un ejemplo de lo que hay que escribir. Desaparece al escribir.
- `password=True` oculta lo que se escribe; con `can_reveal_password=True` aparece un ojo para mostrarlo.
- `value`: el texto del campo. Puedes darle un valor inicial y, más adelante, leerlo para saber qué escribió el usuario.

Para elegir entre sí y no hay dos controles:

```py
import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Checkbox(label="Acepto las condiciones"),
        ft.Checkbox(label="Recibir novedades", value=True),
        ft.Switch(label="Modo oscuro"),
    )

ft.run(main)
```

`ft.Checkbox` es una casilla y `ft.Switch` un interruptor. Los dos tienen `label` y `value`, que vale `True` cuando están activados. La diferencia es de uso: una casilla se marca para aceptar o elegir algo, y un interruptor activa o desactiva una opción al momento, como en los ajustes del móvil.

Escribe en los campos y marca las casillas de los ejemplos: ya funcionan, aunque la app todavía no hace nada con esos valores.

## Ejercicio

Crea un formulario de inicio de sesión con estos controles, en este orden:

1. Un `TextField` con la etiqueta `Usuario`.
2. Un `TextField` con la etiqueta `Contraseña` que oculte el texto y permita mostrarlo.
3. Un `Checkbox` con la etiqueta `Recordarme`, marcado desde el principio.
4. Un `FilledButton` con el texto `Entrar`.

## Pista

Para la contraseña: password=True y can_reveal_password=True. Para que la casilla empiece marcada: value=True.
