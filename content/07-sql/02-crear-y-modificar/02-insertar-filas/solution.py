import sqlite3

contactos = [
    ("Ana Ruiz", "3001112233", "Bogotá"),
    ("Luis Mora", "3014445566", "Medellín"),
    ("Sofía Gómez", "3027778899", "Cali"),
    ("Mateo Herrera", "3150001122", None),
]
nuevo = ("Laura Gil", "3005550199", "Manizales")

conexion = sqlite3.connect("agenda.db")
conexion.execute("""
    CREATE TABLE IF NOT EXISTS contactos (
        id INTEGER PRIMARY KEY,
        nombre TEXT NOT NULL,
        telefono TEXT NOT NULL UNIQUE,
        ciudad TEXT
    )
""")

conexion.executemany("INSERT INTO contactos (nombre, telefono, ciudad) VALUES (?, ?, ?)", contactos)
cursor = conexion.execute("INSERT INTO contactos (nombre, telefono, ciudad) VALUES (?, ?, ?)", nuevo)
print(f"{nuevo[0]} tiene el id {cursor.lastrowid}")
conexion.commit()

total = conexion.execute("SELECT COUNT(*) FROM contactos").fetchone()[0]
print(total, "contactos guardados")
conexion.close()
