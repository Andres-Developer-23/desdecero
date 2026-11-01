---
title: Actualizar, borrar y transacciones
minutes: 18
summary: "UPDATE y DELETE con su WHERE, rowcount, y transacciones con commit(), rollback() y «with conexion:» para que los cambios ocurran todos o ninguno."
db: libreria.db
---

Para cambiar filas está `UPDATE` y para borrarlas, `DELETE`. Los dos llevan un `WHERE` que dice **a qué filas** afectan:

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")
cursor = conexion.execute("UPDATE libros SET precio = precio + 1000 WHERE categoria = 'Poesía'")
print("libros con precio nuevo:", cursor.rowcount)

cursor = conexion.execute("DELETE FROM libros WHERE stock = 0 AND id NOT IN (SELECT libro_id FROM ventas)")
print("libros borrados:", cursor.rowcount)
conexion.commit()

print(conexion.execute("SELECT titulo, precio FROM libros WHERE categoria = 'Poesía'").fetchall())
conexion.close()
```

- `SET` puede cambiar varias columnas (`SET precio = 50000, stock = 3`) y usar su valor actual (`SET stock = stock - 1`).
- `cursor.rowcount` dice cuántas filas cambiaron: si es 0, ninguna cumplía el `WHERE` (por ejemplo, porque ese `id` no existe).
- El `NOT IN (SELECT ...)` es una **subconsulta**: una consulta dentro de otra. Aquí borra los libros agotados que nunca se vendieron, para no dejar ventas que apunten a libros borrados.

**Cuidado**: sin `WHERE`, `UPDATE` cambia **todas** las filas y `DELETE` las borra todas. Un buen hábito: antes de un `UPDATE` o un `DELETE`, ejecuta un `SELECT` con el mismo `WHERE` (en la consola de **datos**, por ejemplo) y comprueba qué filas salen. Y recuerda que `libreria.db` vuelve a su estado inicial en cada ejecución, así que aquí puedes equivocarte sin consecuencias.

### Transacciones: todo o nada

Vender un libro son dos cambios: registrar la venta y descontar el stock. Si el programa falla entre uno y otro, la base de datos queda incoherente: una venta sin descontar, o stock descontado sin venta. Una **transacción** agrupa cambios para que ocurran **todos o ninguno**:

- `conexion.commit()` confirma los cambios pendientes;
- `conexion.rollback()` los deshace, como si no hubieran ocurrido.

Y `with conexion:` lo hace por ti: si el bloque termina bien, confirma; si salta una excepción, deshace **todo** lo que se hizo dentro y deja pasar la excepción.

```py
import sqlite3

conexion = sqlite3.connect("libreria.db")


def stock(libro_id):
    return conexion.execute("SELECT stock FROM libros WHERE id = ?", (libro_id,)).fetchone()[0]


print("stock inicial:", stock(2))
conexion.execute("UPDATE libros SET stock = 0 WHERE id = 2")
print("antes del rollback:", stock(2))
conexion.rollback()
print("después del rollback:", stock(2))

try:
    with conexion:
        conexion.execute("UPDATE libros SET stock = stock - 1 WHERE id = 2")
        conexion.execute(
            "INSERT INTO ventas (cliente_id, libro_id, cantidad, fecha) VALUES (?, ?, ?, ?)",
            (1, 2, 0, "2026-11-02"),
        )
except sqlite3.IntegrityError as error:
    print("Venta cancelada:", error)
print("stock al final:", stock(2))
conexion.close()
```

El `INSERT` falla porque la tabla `ventas` exige `cantidad > 0`, y `with conexion:` deshace también el `UPDATE` que ya se había hecho: el stock vuelve a 12.

Ojo: `with conexion:` confirma o deshace, pero **no cierra** la conexión; sigue abierta después del bloque.

## Ejercicio

Escribe la función `vender(conexion, cliente_id, libro_id, cantidad, fecha)`, que registra una venta en `libreria.db` dentro de una transacción:

- Si el libro no existe, lanza `ValueError("El libro no existe")`.
- Si no hay stock suficiente, lanza `ValueError("No hay stock suficiente")`.
- Si no, descuenta las unidades del stock del libro, inserta la venta en `ventas` y devuelve el `id` de la venta nueva.

Si algo falla a mitad (por ejemplo, la tabla rechaza una cantidad que no es mayor que 0), no debe quedar **ningún** cambio. Y si todo va bien, los cambios tienen que quedar confirmados.

## Pista

Mete todo el cuerpo en un `with conexion:`. Dentro, lee el stock con `SELECT stock FROM libros WHERE id = ?` y `fetchone()`: si devuelve `None`, el libro no existe. Lanzar el `ValueError` dentro del `with` también deshace lo que hubiera pendiente. Para el id, `cursor.lastrowid` del `INSERT`.
