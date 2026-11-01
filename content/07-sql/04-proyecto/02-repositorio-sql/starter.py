import sqlite3


class RepositorioTareas:
    def __init__(self, conexion):
        self.conexion = conexion

    def crear(self, titulo):
        pass

    def todas(self, solo_pendientes=False):
        return []

    def buscar(self, id):
        return None

    def marcar_hecha(self, id):
        return False

    def borrar(self, id):
        return False


tareas = RepositorioTareas(sqlite3.connect("tareas.db"))
tareas.crear("Comprar pan")
tareas.crear("Estudiar SQL")
tareas.marcar_hecha(1)
for tarea in tareas.todas():
    print(tarea)
print("Pendientes:", tareas.todas(solo_pendientes=True))
