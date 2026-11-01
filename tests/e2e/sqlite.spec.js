/*
 * Simulador de sqlite3: el módulo de Python (con SQLite de verdad por debajo,
 * sql.js), las bases de práctica y la pestaña «datos» que enseña las tablas.
 */

import { expect, openApp, test } from "./fixtures.js";

/** Pone código en el editor del playground y lo ejecuta. */
async function runInPlayground(page, code) {
  await page.evaluate((source) => {
    document.querySelector("#playground-editor .CodeMirror").CodeMirror.setValue(source);
  }, code);
  await page.locator("#view-playground [data-action='run']").click();
}

/** Ejecuta código con las comprobaciones de un ejercicio y devuelve el informe. */
async function check(page, code, testCode = "") {
  return page.evaluate(
    async ({ code, testCode }) => {
      const { checkExercise, createTerminal } = window.__desdecero;
      const output = document.createElement("pre");
      const result = await checkExercise(
        { checks: {}, test: testCode },
        code,
        createTerminal(output),
      );
      return { ...result, log: output.textContent };
    },
    { code, testCode },
  );
}

test("sqlite3 funciona como en Python: cursores, parámetros, transacciones y errores", async ({
  page,
}) => {
  await openApp(page);
  const result = await check(
    page,
    `import sqlite3

conexion = sqlite3.connect("tienda.db")
conexion.execute("CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT UNIQUE NOT NULL, precio REAL)")
cursor = conexion.execute("INSERT INTO productos (nombre, precio) VALUES (?, ?)", ("Café", 9500))
print(cursor.lastrowid, cursor.rowcount, conexion.in_transaction)
datos = [("Té", 4200), ("Cacao", 12000.5)]
print(conexion.executemany("INSERT INTO productos (nombre, precio) VALUES (?, ?)", datos).rowcount)
conexion.commit()

cursor = conexion.execute("SELECT * FROM productos WHERE precio < :tope ORDER BY precio", {"tope": 10000})
print([columna[0] for columna in cursor.description])
print(cursor.fetchall())

conexion.execute("DELETE FROM productos")
conexion.rollback()
print(conexion.execute("SELECT count(*) FROM productos").fetchone()[0])

conexion.row_factory = sqlite3.Row
fila = conexion.execute("SELECT nombre, precio FROM productos WHERE id = 3").fetchone()
print(fila["nombre"], fila["PRECIO"], dict(fila))

try:
    with conexion:
        conexion.execute("INSERT INTO productos (nombre) VALUES ('Leche')")
        conexion.execute("INSERT INTO productos (nombre) VALUES ('Café')")
except sqlite3.IntegrityError as error:
    print("IntegrityError:", error)
print(conexion.execute("SELECT count(*) FROM productos").fetchone()[0])
conexion.close()

libreria = sqlite3.connect("libreria.db")
print(libreria.execute("SELECT count(*) FROM libros").fetchone())
libreria.execute("SELECT * FROM libro")
`,
  );
  expect(result.log).toContain(
    [
      "1 1 True",
      "2",
      "['id', 'nombre', 'precio']",
      "[(2, 'Té', 4200.0), (1, 'Café', 9500.0)]",
      "3",
      "Cacao 12000.5 {'nombre': 'Cacao', 'precio': 12000.5}",
      "IntegrityError: UNIQUE constraint failed: productos.nombre",
      "3",
      "(18,)",
    ].join("\n"),
  );
  // El error de SQL se explica en español, con la línea del alumno.
  expect(result.log).toContain("OperationalError en la línea 34");
  expect(result.log).toContain("no such table: libro");
  expect(result.log).toContain("Esa tabla no existe en la base de datos");
});

test("la pestaña «datos» del playground enseña las tablas y lanza consultas SQL", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import sqlite3

conexion = sqlite3.connect("tienda.db")
conexion.execute("CREATE TABLE productos (id INTEGER PRIMARY KEY, nombre TEXT NOT NULL, precio REAL)")
conexion.executemany(
    "INSERT INTO productos (nombre, precio) VALUES (?, ?)",
    [("Café", 9500), ("Té", None), ("Cacao", 12000.5)],
)
conexion.commit()
conexion.close()
print("listo")
`,
  );
  const output = page.locator("#playground-output");
  await expect(output).toContainText(
    "# base de datos: tienda.db · productos (3 filas) · míralas en «datos»",
  );

  const viewer = page.locator("#playground-db");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".db-viewer__databases")).toHaveValue("tienda.db");
  await expect(viewer.locator(".db-viewer__tables button")).toHaveText(["productos 3"]);
  const grid = viewer.locator(".db-viewer__grid");
  await expect(grid.locator("th")).toHaveText(["id", "nombre", "precio"]);
  await expect(grid.locator("tbody tr").nth(0).locator("td")).toHaveText(["1", "Café", "9500.0"]);
  await expect(grid.locator("tbody tr").nth(1).locator("td")).toHaveText(["2", "Té", "NULL"]);

  // La base de práctica también está, aunque el programa no la abriera.
  await expect(viewer.locator(".db-viewer__databases option")).toHaveText([
    "tienda.db",
    "libreria.db (de práctica)",
  ]);

  // Una consulta desde la consola SQL, y un error.
  const sql = viewer.locator(".db-viewer__sql");
  await sql.fill("SELECT nombre FROM productos WHERE precio > 10000");
  await viewer.locator(".db-viewer__run").click();
  await expect(viewer.locator(".db-viewer__message")).toHaveText("1 fila");
  await expect(grid.locator("tbody td")).toHaveText(["Cacao"]);
  await sql.fill("SELEC 1");
  await sql.press("Control+Enter");
  await expect(viewer.locator(".db-viewer__message")).toHaveText(
    'OperationalError: near "SELEC": syntax error',
  );

  // Un programa sin sqlite3 esconde la pestaña.
  await runInPlayground(page, 'print("hola")\n');
  await expect(output).toContainText("hola");
  await expect(viewer).toBeHidden();
});

test("una API de Flask guarda en SQLite y la pestaña «datos» enseña lo que guardó", async ({
  page,
}) => {
  await openApp(page, "#playground");
  await runInPlayground(
    page,
    `import sqlite3
from flask import Flask, request

app = Flask(__name__)
conexion = sqlite3.connect("notas.db")
conexion.execute("CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT NOT NULL)")


@app.get("/notas")
def listar():
    filas = conexion.execute("SELECT id, texto FROM notas").fetchall()
    return [{"id": id, "texto": texto} for id, texto in filas]


@app.post("/notas")
def crear():
    texto = request.get_json()["texto"]
    with conexion:
        cursor = conexion.execute("INSERT INTO notas (texto) VALUES (?)", (texto,))
    return {"id": cursor.lastrowid, "texto": texto}, 201


app.run()
`,
  );
  const output = page.locator("#playground-output");
  await expect(output).toContainText("tu servidor está en marcha en http://127.0.0.1:5000");

  const web = page.locator("#playground-web");
  // El navegador abre primero la raíz del servidor, que esta API no tiene.
  await expect(web.locator(".web-viewer__status")).toHaveText("404 NOT FOUND");
  await web.locator(".web-viewer__address").fill("127.0.0.1:5000/notas");
  await web.locator(".web-viewer__compose summary").click();
  await web.locator(".web-viewer__compose-body").fill('{"texto": "Comprar pan"}');
  await web.locator(".web-viewer__method").selectOption("POST");
  await web.locator(".web-viewer__send").click();
  await expect(web.locator(".web-viewer__status")).toHaveText("201 CREATED");

  // Los datos se actualizan solos después de cada petición al servidor.
  const viewer = page.locator("#playground-db");
  await expect(viewer).toBeVisible();
  await expect(viewer.locator(".db-viewer__databases")).toHaveValue("notas.db");
  await expect(viewer.locator(".db-viewer__grid tbody td")).toHaveText(["1", "Comprar pan"]);
});

test("las lecciones de SQL abren la base de práctica en la pestaña «datos»", async ({ page }) => {
  await openApp(page, "#l-que-es-una-base-de-datos");
  const tabs = page.locator("#exercise-tabs");
  const viewer = page.locator("#exercise-db");
  await expect(tabs.locator("[data-tab='db']")).toHaveAttribute("aria-selected", "true");
  await expect(tabs.locator("[data-tab='web']")).toBeHidden();
  await expect(viewer.locator(".db-viewer__databases")).toHaveValue("libreria.db");
  await expect(viewer.locator(".db-viewer__tables button")).toHaveText([
    "autores 11",
    "clientes 10",
    "libros 18",
    "ventas 40",
  ]);
  await viewer.locator(".db-viewer__sql").fill("SELECT nombre FROM autores WHERE pais = 'Chile'");
  await viewer.locator(".db-viewer__run").click();
  await expect(viewer.locator(".db-viewer__grid tbody td")).toHaveText(["Sofía Cárdenas"]);

  // Al ejecutar, la consola enseña la salida; la base de práctica no cuenta como creada.
  await page.evaluate(() => {
    const { course } = window.__desdecero;
    document
      .querySelector("#exercise-editor .CodeMirror")
      .CodeMirror.setValue(course.getLesson("que-es-una-base-de-datos").solution);
  });
  await page.locator("#view-lesson [data-action='run']").first().click();
  const output = page.locator("#exercise-output");
  await expect(output).toContainText("11 autores");
  await expect(output).not.toContainText("# base de datos:");
});

test("el proyecto final tiene a la vez el navegador y los datos", async ({ page }) => {
  await openApp(page, "#l-api-con-base-de-datos");
  const tabs = page.locator("#exercise-tabs");
  await expect(tabs.locator("[data-tab='db']")).toBeVisible();
  await expect(tabs.locator("[data-tab='web']")).toBeVisible();
  await page.evaluate(() => {
    const { course } = window.__desdecero;
    document
      .querySelector("#exercise-editor .CodeMirror")
      .CodeMirror.setValue(course.getLesson("api-con-base-de-datos").solution);
  });
  await page.locator("#view-lesson [data-action='run']").first().click();
  await expect(page.locator("#exercise-output")).toContainText("tu servidor está en marcha");

  // Una venta desde el navegador cambia la base de datos: «datos» avisa con un punto.
  await tabs.locator("[data-tab='web']").click();
  const web = page.locator("#exercise-web");
  await expect(web.locator(".web-viewer__status")).toHaveText("200 OK");
  await web.locator(".web-viewer__address").fill("http://127.0.0.1:5000/ventas");
  await web.locator(".web-viewer__compose summary").click();
  await web
    .locator(".web-viewer__compose-body")
    .fill('{"cliente_id": 3, "libro_id": 7, "cantidad": 2}');
  await web.locator(".web-viewer__method").selectOption("POST");
  await web.locator(".web-viewer__send").click();
  await expect(web.locator(".web-viewer__status")).toHaveText("201 CREATED");
  await expect(tabs.locator("[data-tab='db'] .tabs__dot")).toBeVisible();

  await tabs.locator("[data-tab='db']").click();
  const viewer = page.locator("#exercise-db");
  await expect(viewer.locator(".db-viewer__tables button")).toContainText(["ventas 41"]);
});
