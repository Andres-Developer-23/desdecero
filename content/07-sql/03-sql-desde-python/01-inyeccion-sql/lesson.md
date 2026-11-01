---
title: Parámetros e inyección de SQL
minutes: 16
summary: "Por qué nunca se construye el SQL con f-strings, parámetros ? y :nombre, LIKE e IN con parámetros, y listas blancas para lo que no puede ser un parámetro."
db: libreria.db
---

Imagina un formulario de inicio de sesión. Lo más tentador es pegar lo que escribe el usuario en el SQL con un f-string. Mira lo que pasa:

```py
import sqlite3

conexion = sqlite3.connect(":memory:")
conexion.execute("CREATE TABLE usuarios (nombre TEXT, clave TEXT)")
conexion.execute("INSERT INTO usuarios VALUES ('ana', 'gato123'), ('luis', 'sol456')")


def entrar_inseguro(nombre, clave):
    sql = f"SELECT nombre FROM usuarios WHERE nombre = '{nombre}' AND clave = '{clave}'"
    print("SQL:", sql)
    return conexion.execute(sql).fetchone()


def entrar(nombre, clave):
    sql = "SELECT nombre FROM usuarios WHERE nombre = ? AND clave = ?"
    return conexion.execute(sql, (nombre, clave)).fetchone()


print(entrar_inseguro("ana", "no-la-sé"))
print(entrar_inseguro("ana", "' OR '1'='1"))
print(entrar("ana", "' OR '1'='1"))
print(entrar("ana", "gato123"))
```

Con la clave `' OR '1'='1`, el texto del usuario **cambia la consulta**: la condición pasa a ser «nombre y clave correctos, *o* 1 igual a 1», que siempre se cumple, y entra sin saber la clave. Esto es la **inyección de SQL**, uno de los fallos de seguridad más antiguos y más explotados: con ella se han robado millones de contraseñas y tarjetas. Además, el f-string falla con datos normales: un apellido como `O'Neill` rompe las comillas y da un error de sintaxis.

(Y en una aplicación real, las claves nunca se guardan tal cual, sino cifradas con un *hash*; aquí es solo un ejemplo.)

### Parámetros: los datos van aparte

Con parámetros, el SQL y los datos viajan **por separado**: la base de datos prepara la consulta con sus `?` y después coloca los valores, que nunca se interpretan como SQL. Da igual lo que contengan: comillas, puntos y comas o `OR`.

- Con `?`, los valores van en una tupla o una lista, en orden: `execute(sql, (nombre, clave))`. Un solo valor también va en una tupla: `(nombre,)`.
- Con `:nombre`, van en un diccionario, y el orden da igual: es más legible cuando hay muchos.

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
consulta = "SELECT titulo, precio FROM libros WHERE categoria = :categoria AND precio <= :maximo"
print(conexion.execute(consulta, {"categoria": "Novela", "maximo": 45000}).fetchall())

texto = "pa"
print(conexion.execute("SELECT titulo FROM libros WHERE titulo LIKE ?", (f"%{texto}%",)).fetchall())

ids = [2, 7, 13]
marcas = ", ".join("?" * len(ids))
print(conexion.execute(f"SELECT titulo FROM libros WHERE id IN ({marcas})", ids).fetchall())
conexion.close()
```

- En un `LIKE`, los `%` van **en el valor**, no en el SQL: `(f"%{texto}%",)`. Ese f-string es seguro, porque construye el dato, no la consulta.
- Para un `IN` con una lista de tamaño variable, se escribe un `?` por elemento: `", ".join("?" * 3)` da `"?, ?, ?"`. En el SQL solo entran esos `?`; los valores siguen yendo aparte.

### Lo que no puede ser un parámetro

Los parámetros sirven para **valores**, no para nombres de tablas o columnas ni para palabras como `ASC` o `DESC`. Si el usuario elige el orden, no pegues lo que escribió: usa una **lista blanca** con las opciones permitidas.

```py
import sqlite3

ORDENES = {"precio": "precio", "titulo": "titulo", "novedades": "publicado DESC"}


def catalogo(conexion, orden):
    if orden not in ORDENES:
        raise ValueError(f"Orden no válido: {orden}")
    return conexion.execute(f"SELECT titulo FROM libros ORDER BY {ORDENES[orden]} LIMIT 3").fetchall()


conexion = sqlite3.connect("libreria.db")
print(catalogo(conexion, "novedades"))
print(catalogo(conexion, "precio"))
conexion.close()
```

La regla es sencilla: **en el texto del SQL solo puede haber texto que escribiste tú**. Todo lo que venga de fuera (un formulario, una URL, un archivo, una API) va como parámetro.

## Ejercicio

Escribe la función `buscar_libros(conexion, texto, categoria=None)`, que devuelve la **lista de títulos** de los libros cuyo título contiene `texto` (sin distinguir mayúsculas de minúsculas), ordenados alfabéticamente. Si se da `categoria`, solo los de esa categoría.

```txt
>>> buscar_libros(conexion, "python")
['Python para curiosos']
>>> buscar_libros(conexion, "DE", "Novela")
['Cartas desde el páramo', 'El faro de la niebla', 'La ciudad de los relojes parados']
```

Las comprobaciones también buscan textos con apóstrofos e intentos de inyección de SQL: tu función tiene que tratarlos como texto normal.

## Pista

Empieza con `sql = "SELECT titulo FROM libros WHERE titulo LIKE ?"` y `valores = [f"%{texto}%"]`. Si hay categoría, añade `" AND categoria = ?"` al SQL y la categoría a `valores`. Termina con `" ORDER BY titulo"` y devuelve `[titulo for (titulo,) in conexion.execute(sql, valores)]`.
