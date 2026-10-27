import flet as ft

def main(page: ft.Page):
    producto = ft.TextField(label="Producto", expand=True)
    lista = ft.Column()

    def agregar(e):
        texto = producto.value.strip()
        if texto:
            lista.controls.append(ft.Text(texto))
            producto.value = ""

    def vaciar(e):
        lista.controls.clear()

    page.add(
        ft.Row([producto, ft.FilledButton(content="Añadir", on_click=agregar)]),
        lista,
        ft.TextButton(content="Vaciar", on_click=vaciar),
    )

ft.run(main)
