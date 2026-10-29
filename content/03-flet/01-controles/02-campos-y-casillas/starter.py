import flet as ft

def main(page: ft.Page):
    page.add(
        ft.TextField(label="Usuario"),
        # Añade aquí el resto del formulario
    )

ft.run(main)
