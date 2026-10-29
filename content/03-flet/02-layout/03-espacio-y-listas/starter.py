import flet as ft

def main(page: ft.Page):
    resultados = ft.ListView()
    # Llena la lista con un bucle for

    page.add(
        # Añade aquí la fila del buscador
        resultados,
    )

ft.run(main)
