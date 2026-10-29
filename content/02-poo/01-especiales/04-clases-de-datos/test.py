assert repr(Tarea("X")) == "Tarea(titulo='X', prioridad=3, hecha=False, etiquetas=[])", "Tarea(\"X\") debería mostrarse como Tarea(titulo='X', prioridad=3, hecha=False, etiquetas=[]), no " + repr(Tarea("X"))
assert tareas[0].etiquetas == [], "Cada tarea debería tener su propia lista de etiquetas: usa field(default_factory=list)"
assert tareas[2].hecha is True and tareas[0].hecha is False, "completar() debería marcar como hecha solo esa tarea"
