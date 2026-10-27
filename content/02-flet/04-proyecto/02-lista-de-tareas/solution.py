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
        cuantas = len([t for t in tareas.controls if not t.hecha])
        if cuantas == 1:
            pendientes.value = "1 tarea pendiente"
        else:
            pendientes.value = str(cuantas) + " tareas pendientes"

    def borrar(tarea):
        tareas.controls.remove(tarea)
        actualizar_contador()

    def agregar(e):
        texto = nueva.value.strip()
        if not texto:
            return
        tareas.controls.append(Tarea(texto=texto, al_borrar=borrar, al_cambiar=actualizar_contador))
        nueva.value = ""
        actualizar_contador()

    nueva.on_submit = agregar
    page.add(
        ft.Row([nueva, ft.FilledButton(content="Añadir", icon=ft.Icons.ADD, on_click=agregar)]),
        tareas,
        pendientes,
    )

ft.run(main)
