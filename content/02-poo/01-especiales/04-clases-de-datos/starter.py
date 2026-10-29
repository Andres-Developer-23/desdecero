# Importa lo que necesites de dataclasses


# Escribe aquí la clase Tarea


tareas = [Tarea("Ordenar"), Tarea("Estudiar", 1), Tarea("Pasear", 2), Tarea("Llamar", 2)]
tareas[1].etiquetas.append("clase")
tareas[2].completar()
print(tareas[1])

print("Pendientes por prioridad:")
for tarea in sorted(tareas, key=lambda t: t.prioridad):
    if not tarea.hecha:
        print(f"- {tarea.titulo} ({tarea.prioridad})")
print(Tarea("Leer", 2) == Tarea("Leer", 2))
