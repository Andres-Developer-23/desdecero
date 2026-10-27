---
title: Leer lo que escribe el usuario
minutes: 20
summary: El value de un TextField, on_change para reaccionar al escribir y on_submit para el Enter.
---

El texto de un `TextField` está siempre en su propiedad `value`. En un manejador basta con leerla:

```py
import flet as ft

def main(page: ft.Page):
    nombre = ft.TextField(label="Nombre")
    saludo = ft.Text("")

    def saludar(e):
        saludo.value = "Hola, " + nombre.value

    page.add(nombre, ft.FilledButton(content="Saludar", on_click=saludar), saludo)

ft.run(main)
```

Además del botón, el propio campo tiene dos eventos:

- `on_change` se lanza **cada vez que cambia el texto**, letra a letra. Sirve para reaccionar mientras se escribe.
- `on_submit` se lanza al pulsar **Enter** dentro del campo.

```py
import flet as ft

def main(page: ft.Page):
    contador = ft.Text("0 caracteres")
    eco = ft.Text("")

    def al_escribir(e):
        contador.value = str(len(e.control.value)) + " caracteres"

    def al_pulsar_enter(e):
        eco.value = "Enviaste: " + e.control.value

    page.add(
        ft.TextField(label="Escribe y pulsa Enter", on_change=al_escribir, on_submit=al_pulsar_enter),
        contador,
        eco,
    )

ft.run(main)
```

Un manejador también se puede asignar después de crear el control, como cualquier propiedad: `campo.on_submit = enviar`. Es útil cuando el manejador se define más abajo que el control.

Lo que escribe el usuario siempre es texto, como con `input()`, y puede estar vacío o tener espacios de más. Antes de usarlo conviene limpiarlo con `strip()` y comprobar que no esté vacío. También puedes cambiar `value` desde el código, por ejemplo para vaciar el campo: `campo.value = ""`.

## Ejercicio

Termina el saludador. Tiene un `TextField` con la etiqueta `Nombre`, un botón `Saludar` y un `Text` para el resultado:

- Al pulsar `Saludar`, el texto muestra `¡Hola, Ana!` con el nombre escrito, sin espacios al principio ni al final.
- Si el campo está vacío o solo tiene espacios, muestra `Escribe tu nombre`.
- Pulsar Enter en el campo hace lo mismo que el botón.

## Pista

Guarda nombre.value.strip() en una variable y usa if / else. Para el Enter, asigna el mismo manejador al campo: nombre.on_submit = saludar.
