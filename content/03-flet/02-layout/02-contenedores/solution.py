import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Container(
            content=ft.Text("Nivel 1", size=24, weight=ft.FontWeight.BOLD),
            width=200,
            height=100,
            bgcolor=ft.Colors.AMBER_100,
            border_radius=12,
            alignment=ft.Alignment.CENTER,
        ),
    )

ft.run(main)
