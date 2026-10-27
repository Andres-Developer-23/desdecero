import flet as ft

def main(page: ft.Page):
    page.add(
        ft.Text("Reproduciendo", size=20),
        ft.Row(
            [
                ft.IconButton(icon=ft.Icons.SKIP_PREVIOUS),
                ft.IconButton(icon=ft.Icons.PLAY_ARROW),
                ft.IconButton(icon=ft.Icons.SKIP_NEXT),
            ],
            alignment=ft.MainAxisAlignment.CENTER,
            spacing=20,
        ),
    )

ft.run(main)
