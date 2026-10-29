import flet as ft

def main(page: ft.Page):
    resultados = ft.ListView(spacing=5, expand=True)
    for numero in range(1, 21):
        resultados.controls.append(ft.Text(f"Resultado {numero}"))

    page.add(
        ft.Row([
            ft.TextField(label="Buscar", expand=True),
            ft.IconButton(icon=ft.Icons.SEARCH),
        ]),
        resultados,
    )

ft.run(main)
