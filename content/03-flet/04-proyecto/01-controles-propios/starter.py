import flet as ft

@ft.control
class Marcador(ft.Row):
    # Declara aquí los campos equipo y puntos

    def init(self):
        pass  # construye aquí los controles

def main(page: ft.Page):
    page.add(
        # Añade aquí los dos marcadores
    )

ft.run(main)
