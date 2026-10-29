import flet as ft

def main(page: ft.Page):
    contador = ft.Text("0", size=40)

    def sumar(e):
        contador.value = str(int(contador.value) + 1)

    # Escribe aquí el manejador para restar

    page.add(
        contador,
        ft.Row([
            # Añade aquí el botón «Restar»
            ft.FilledButton(content="Sumar", on_click=sumar),
        ]),
    )

ft.run(main)
