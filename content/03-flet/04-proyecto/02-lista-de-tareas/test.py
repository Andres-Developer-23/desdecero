from fletsim import *

campo = find_one(ft.TextField)
type_text(campo, "Comprar pan")
click("Añadir")
type_text(campo, "  Llamar a mamá ")
submit(campo)
type_text(campo, "Estudiar Flet")
click("Añadir")
assert campo.value == "", "Después de añadir, el campo debería quedar vacío"
type_text(campo, "   ")
click("Añadir")

lista = find(Tarea)
nombres = [t.texto for t in lista]
assert nombres == ["Comprar pan", "Llamar a mamá", "Estudiar Flet"], "Después de añadir tres tareas (una con Enter) y un intento vacío, la lista debería tener las tres en orden y sin espacios de más. Ahora: " + str(nombres)
assert "3 tareas pendientes" in texts(), "Con tres tareas sin hacer debería verse «3 tareas pendientes». Ahora se ve: " + str(texts())

toggle(lista[0].casilla)
toggle(lista[2].casilla)
assert "1 tarea pendiente" in texts(), "Con una sola tarea sin hacer debería verse «1 tarea pendiente», en singular"

click(find(ft.IconButton, icon=ft.Icons.DELETE_OUTLINE)[1])
assert [t.texto for t in find(Tarea)] == ["Comprar pan", "Estudiar Flet"], "El botón de borrar de «Llamar a mamá» debería quitar solo esa tarea"
assert "0 tareas pendientes" in texts(), "Después de borrar la única pendiente debería verse «0 tareas pendientes»"
