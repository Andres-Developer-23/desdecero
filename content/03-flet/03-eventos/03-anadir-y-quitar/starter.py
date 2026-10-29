import flet as ft

def main(page: ft.Page):
    producto = ft.TextField(label="Producto", expand=True)
    lista = ft.Column()

    def agregar(e):
        pass  # escribe aquí tu código

    def vaciar(e):
        pass  # escribe aquí tu código

    page.add(
        ft.Row([producto, ft.FilledButton(content="Añadir", on_click=agregar)]),
        lista,
        ft.TextButton(content="Vaciar", on_click=vaciar),
    )

ft.run(main)
