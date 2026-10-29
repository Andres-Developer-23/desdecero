import requests


class ErrorDeApi(Exception):
    """La API respondió con un error."""

    def __init__(self, estado, mensaje):
        super().__init__(f"Error {estado}: {mensaje}")
        self.estado = estado


class ClienteTareas:
    BASE = "https://api.tareas.example/v1"

    def __init__(self):
        self.sesion = requests.Session()

    def _pedir(self, metodo, ruta, **opciones):
        """Hace la petición y devuelve el JSON (o None si es 204). Lanza ErrorDeApi si falla."""
        respuesta = self.sesion.request(metodo, self.BASE + ruta, **opciones)
        return respuesta.json()

    def iniciar_sesion(self, usuario, clave):
        pass

    def pendientes(self):
        return []

    def crear(self, titulo, prioridad="media"):
        pass

    def completar(self, id_tarea):
        pass

    def borrar(self, id_tarea):
        pass


# Programa principal: no hace falta cambiarlo
cliente = ClienteTareas()
cliente.iniciar_sesion("ana", "python123")
print("Sesión iniciada como ana")

for titulo, prioridad in [("Repasar los métodos HTTP", "alta"), ("Escribir el informe", "media")]:
    tarea = cliente.crear(titulo, prioridad)
    print("Creada:", tarea["id"], tarea["titulo"])

cliente.completar(6)
print("Completada: 6")
cliente.borrar(1)
print("Borrada: 1")

try:
    cliente.completar(99)
except ErrorDeApi as error:
    print(error)

print("Pendientes:")
for tarea in cliente.pendientes():
    print("-", tarea["id"], tarea["titulo"], f"({tarea['prioridad']})")
