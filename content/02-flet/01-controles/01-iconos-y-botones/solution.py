import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Icon(ft.Icons.STAR, color=ft.Colors.AMBER, size=48),
        ft.FilledButton(content="Guardar", icon=ft.Icons.SAVE),
        ft.OutlinedButton(content="Cancelar"),
        ft.IconButton(icon=ft.Icons.DELETE, tooltip="Borrar"),
    )

ft.run(main)
