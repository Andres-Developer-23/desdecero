---
title: Tus propios controles
minutes: 25
summary: Crear controles reutilizables con @ft.control a partir de Row, Column o Container.
---

Cuando una pieza de la interfaz se repite (una tarjeta de producto, una fila de la lista de tareas), lo mejor es convertirla en un **control propio**: una clase que hereda de un control de Flet y que luego usas como cualquier otro.

```py
import flet as ft

@ft.control
class Etiqueta(ft.Container):
    texto: str = ""
    color_fondo: str = ft.Colors.BLUE_100

    def init(self):
        self.content = ft.Text(self.texto, weight=ft.FontWeight.BOLD)
        self.bgcolor = self.color_fondo
        self.padding = ft.Padding.symmetric(vertical=4, horizontal=12)
        self.border_radius = 20

def main(page: ft.Page):
    page.add(
        ft.Row([
            Etiqueta(texto="Python"),
            Etiqueta(texto="Flet", color_fondo=ft.Colors.TEAL_100),
            Etiqueta(texto="Apps", color_fondo=ft.Colors.AMBER_100),
        ]),
    )

ft.run(main)
```

Cómo funciona:

- `@ft.control` encima de la clase la convierte en un control de Flet.
- `class Etiqueta(ft.Container)` hereda de `Container`, así que tiene todas sus propiedades: `content`, `bgcolor`, `padding`...
- `texto: str = ""` declara un **campo propio** con su tipo y su valor por defecto. Se rellena al crear el control: `Etiqueta(texto="Python")`.
- `init()` se ejecuta justo después de crear el control, con los campos ya rellenos. Es donde se construye su contenido.

Un control propio puede tener sus propios manejadores de eventos, escritos como métodos. Cada copia guarda su propio estado:

```py
import flet as ft

@ft.control
class MeGusta(ft.Row):
    total: int = 0

    def init(self):
        self.numero = ft.Text(str(self.total))
        self.controls = [
            ft.IconButton(icon=ft.Icons.FAVORITE, icon_color=ft.Colors.PINK, on_click=self.sumar),
            self.numero,
        ]

    def sumar(self, e):
        self.total += 1
        self.numero.value = str(self.total)

def main(page: ft.Page):
    page.add(MeGusta(), MeGusta(total=10))

ft.run(main)
```

Pulsa los corazones: cada `MeGusta` cuenta por separado. Es la ventaja de las clases: un mismo molde, muchas copias independientes.

## Ejercicio

Crea un control `Marcador` que herede de `ft.Row`, con dos campos: `equipo` (texto, por defecto `""`) y `puntos` (número entero, por defecto `0`). Debe mostrar, en este orden:

1. Un `Text` con el nombre del equipo.
2. Un `Text` con los puntos.
3. Un `IconButton` con `ft.Icons.ADD` que sume 1 punto a ese marcador.

En `main`, añade dos marcadores: `Marcador(equipo="Rojos")` y `Marcador(equipo="Azules", puntos=3)`.

## Pista

Declara los campos como equipo: str = "" y puntos: int = 0. En init(), guarda el Text de los puntos en self.marcador para poder cambiarlo en el método que suma.
