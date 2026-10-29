import flet as ft
from dataclasses import field
from typing import Callable

@ft.control
class Tarea(ft.Row):
    texto: str = ""
    al_borrar: Callable = field(default=lambda tarea: None)
    al_cambiar: Callable = field(default=lambda: None)

    def init(self):
        self.casilla = ft.Checkbox(label=self.texto, on_change=self.cambiar)
        self.controls = [
            self.casilla,
            ft.IconButton(icon=ft.Icons.DELETE_OUTLINE, tooltip="Borrar", on_click=self.borrar),
        ]
        self.alignment = ft.MainAxisAlignment.SPACE_BETWEEN

    @property
    def hecha(self):
        return self.casilla.value

    def cambiar(self, e):
        self.al_cambiar()

    def borrar(self, e):
        self.al_borrar(self)

def main(page: ft.Page):
    page.title = "Tareas"
    nueva = ft.TextField(label="¿Qué tienes que hacer?", expand=True)
    tareas = ft.Column()
    pendientes = ft.Text("0 tareas pendientes")

    def actualizar_contador():
        pass  # escribe aquí tu código

    def borrar(tarea):
        pass  # escribe aquí tu código

    def agregar(e):
        pass  # escribe aquí tu código

    nueva.on_submit = agregar
    page.add(
        ft.Row([nueva, ft.FilledButton(content="Añadir", icon=ft.Icons.ADD, on_click=agregar)]),
        tareas,
        pendientes,
    )

ft.run(main)
