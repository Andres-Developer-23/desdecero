import flet as ft

def main(page: ft.Page):
    page.title = "Mi primera app"
    page.add(
        ft.Text("Hola, Flet"),
        ft.Text("Estoy aprendiendo a crear apps"),
    )

ft.run(main)
