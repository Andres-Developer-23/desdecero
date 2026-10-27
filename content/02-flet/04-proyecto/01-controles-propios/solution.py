import flet as ft

@ft.control
class Marcador(ft.Row):
    equipo: str = ""
    puntos: int = 0

    def init(self):
        self.marcador = ft.Text(str(self.puntos), size=20)
        self.controls = [
            ft.Text(self.equipo, size=20, weight=ft.FontWeight.BOLD),
            self.marcador,
            ft.IconButton(icon=ft.Icons.ADD, on_click=self.anotar),
        ]

    def anotar(self, e):
        self.puntos += 1
        self.marcador.value = str(self.puntos)

def main(page: ft.Page):
    page.add(
        Marcador(equipo="Rojos"),
        Marcador(equipo="Azules", puntos=3),
    )

ft.run(main)
