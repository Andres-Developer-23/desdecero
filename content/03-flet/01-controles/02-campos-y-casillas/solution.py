import flet as ft

def main(page: ft.Page):
    page.add(
        ft.TextField(label="Usuario"),
        ft.TextField(label="Contraseña", password=True, can_reveal_password=True),
        ft.Checkbox(label="Recordarme", value=True),
        ft.FilledButton(content="Entrar"),
    )

ft.run(main)
