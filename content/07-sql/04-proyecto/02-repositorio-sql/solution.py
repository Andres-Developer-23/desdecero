import sqlite3


class RepositorioTareas:
    def __init__(self, conexion):
        self.conexion = conexion
        self.conexion.row_factory = sqlite3.Row
        self.conexion.execute("""
            CREATE TABLE IF NOT EXISTS tareas (
                id INTEGER PRIMARY KEY,
                titulo TEXT NOT NULL,
                hecha INTEGER NOT NULL DEFAULT 0
            )
        """)

    @staticmethod
    def _tarea(fila):
        return {"id": fila["id"], "titulo": fila["titulo"], "hecha": bool(fila["hecha"])}

    def crear(self, titulo):
        titulo = titulo.strip()
        if not titulo:
            raise ValueError("El título no puede estar vacío")
        with self.conexion:
            cursor = self.conexion.execute("INSERT INTO tareas (titulo) VALUES (?)", (titulo,))
        return self.buscar(cursor.lastrowid)

    def todas(self, solo_pendientes=False):
        sql = "SELECT id, titulo, hecha FROM tareas"
        if solo_pendientes:
            sql += " WHERE hecha = 0"
        sql += " ORDER BY id"
        return [self._tarea(fila) for fila in self.conexion.execute(sql)]

    def buscar(self, id):
        fila = self.conexion.execute("SELECT id, titulo, hecha FROM tareas WHERE id = ?", (id,)).fetchone()
        return self._tarea(fila) if fila else None

    def marcar_hecha(self, id):
        with self.conexion:
            cursor = self.conexion.execute("UPDATE tareas SET hecha = 1 WHERE id = ?", (id,))
        return cursor.rowcount == 1

    def borrar(self, id):
        with self.conexion:
            cursor = self.conexion.execute("DELETE FROM tareas WHERE id = ?", (id,))
        return cursor.rowcount == 1


tareas = RepositorioTareas(sqlite3.connect("tareas.db"))
tareas.crear("Comprar pan")
tareas.crear("Estudiar SQL")
tareas.marcar_hecha(1)
for tarea in tareas.todas():
    print(tarea)
print("Pendientes:", tareas.todas(solo_pendientes=True))
