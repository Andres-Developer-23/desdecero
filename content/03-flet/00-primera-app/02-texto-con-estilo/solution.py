import flet as ft

def main(page: ft.Page):
    page.horizontal_alignment = ft.CrossAxisAlignment.CENTER
    page.add(
        ft.Text("Ana Ruiz", size=30, weight=ft.FontWeight.BOLD),
        ft.Text("Desarrolladora de apps", italic=True, color=ft.Colors.BLUE_GREY_400),
        ft.Text("Bogotá, Colombia"),
    )

ft.run(main)
