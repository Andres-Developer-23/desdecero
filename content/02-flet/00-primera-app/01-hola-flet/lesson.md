---
title: Hola, Flet
minutes: 10
summary: Qué es Flet y las cuatro líneas que tiene cualquier app.
---

Flet es una librería de Python para crear apps con interfaz gráfica: ventanas con textos, botones y campos que funcionan en el escritorio, en el móvil y en la web, sin escribir HTML ni JavaScript. Por debajo usa Flutter, el sistema de Google para dibujar interfaces, pero tú solo escribes Python.

Toda app de Flet tiene la misma estructura:

```py
import flet as ft

def main(page: ft.Page):
    page.title = "Mi app"
    page.add(ft.Text("¡Hola, Flet!"))

ft.run(main)
```

Pulsa **ejecutar**: la app aparece debajo del código. Línea a línea:

- `import flet as ft` carga Flet con el nombre corto `ft`. Es la convención: todo lo de Flet empieza por `ft.`.
- `def main(page: ft.Page):` define la función que construye la app. Flet la llama una vez al arrancar y le pasa `page`, la ventana. Lo de `: ft.Page` es una anotación: solo documenta qué es `page`.
- `page.title` es el título de la ventana.
- `page.add(...)` añade **controles** a la página. Un control es cada pieza de la interfaz: un texto, un botón, un campo...
- `ft.run(main)` arranca la app. Sin esta línea no se abre nada.

`page.add()` acepta varios controles a la vez, separados por comas, y los coloca uno debajo de otro:

```py
import flet as ft

def main(page: ft.Page):
    page.title = "Varios textos"
    page.add(
        ft.Text("Primera línea"),
        ft.Text("Segunda línea"),
        ft.Text("Tercera línea"),
    )

ft.run(main)
```

En tu ordenador, Flet se instala con `pip install flet` y una app se ejecuta con `flet run main.py`: se abre en una ventana propia. En este curso se ejecuta en un **simulador** dentro del navegador que imita Flet 1.0. El código es el mismo.

## Ejercicio

Crea una app con el título `Mi primera app` que muestre estos dos textos, en este orden:

```txt
Hola, Flet
Estoy aprendiendo a crear apps
```

## Pista

Dentro de main, escribe page.title = "Mi primera app" y añade los dos ft.Text con un solo page.add(...), separados por una coma.
