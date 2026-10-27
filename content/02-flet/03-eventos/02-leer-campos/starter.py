import flet as ft

def main(page: ft.Page):
    nombre = ft.TextField(label="Nombre")
    resultado = ft.Text("")

    def saludar(e):
        resultado.value = "Hola"

    page.add(nombre, ft.FilledButton(content="Saludar", on_click=saludar), resultado)

ft.run(main)
