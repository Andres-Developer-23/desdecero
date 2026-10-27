import flet as ft

def main(page: ft.Page):
    contador = ft.Text("0", size=40)

    def sumar(e):
        contador.value = str(int(contador.value) + 1)

    def restar(e):
        numero = int(contador.value)
        if numero > 0:
            contador.value = str(numero - 1)

    page.add(
        contador,
        ft.Row([
            ft.FilledButton(content="Restar", on_click=restar),
            ft.FilledButton(content="Sumar", on_click=sumar),
        ]),
    )

ft.run(main)
