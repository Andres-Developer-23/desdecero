import flet as ft

def main(page: ft.Page):
    nombre = ft.TextField(label="Nombre")
    resultado = ft.Text("")

    def saludar(e):
        texto = nombre.value.strip()
        if texto:
            resultado.value = "¡Hola, " + texto + "!"
        else:
            resultado.value = "Escribe tu nombre"

    nombre.on_submit = saludar
    page.add(nombre, ft.FilledButton(content="Saludar", on_click=saludar), resultado)

ft.run(main)
