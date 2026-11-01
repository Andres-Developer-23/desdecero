import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { before, describe, test } from "node:test";
import initSqlJs from "sql.js";
import { createDatabases, errorType } from "../../src/js/sql/databases.js";
import { firstKeyword, isBlankSql, isDml, sqlParameters } from "../../src/js/sql/sql-text.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const LIBRERIA = readFileSync(path.join(ROOT, "content/db/libreria.sql"), "utf8");

let SQL;
before(async () => {
  SQL = await initSqlJs();
});

/** Lanza la función y devuelve [tipo, mensaje] del error de sqlite3. */
function failure(run) {
  try {
    run();
  } catch (error) {
    return [error.type, error.message];
  }
  assert.fail("debería fallar");
}

describe("texto de las sentencias SQL", () => {
  test("encuentra los parámetros y se salta textos y comentarios", () => {
    assert.deepEqual(sqlParameters("SELECT * FROM t WHERE a = ? AND b = ?"), [null, null]);
    assert.deepEqual(sqlParameters("SELECT :a, :b, :a, @c, $d"), [":a", ":b", "@c", "$d"]);
    assert.deepEqual(sqlParameters("SELECT '?', \"a?\", ? -- ¿y esto?\n /* ? */"), [null]);
    assert.deepEqual(sqlParameters("SELECT ?3"), [null, null, null]);
    assert.deepEqual(sqlParameters("SELECT 'it''s ?' || :año"), [":año"]);
  });

  test("reconoce la primera palabra, las sentencias vacías y las que modifican datos", () => {
    assert.equal(firstKeyword("  -- hola\n /* x */ insert into t values (1)"), "INSERT");
    assert.ok(isDml("UPDATE t SET a = 1"));
    assert.ok(isDml("replace INTO t VALUES (1)"));
    assert.ok(!isDml("SELECT 1"));
    assert.ok(!isDml("CREATE TABLE t (a)"));
    assert.ok(isBlankSql("  ;  -- nada\n /* tampoco */ "));
    assert.ok(!isBlankSql(" 'texto' "));
    assert.ok(!isBlankSql("SELECT 2"));
  });

  test("clasifica los errores de SQLite como las excepciones de sqlite3", () => {
    assert.equal(errorType("UNIQUE constraint failed: t.email"), "IntegrityError");
    assert.equal(errorType("datatype mismatch"), "IntegrityError");
    assert.equal(errorType("no such table: x"), "OperationalError");
    assert.equal(errorType('near "SELEC": syntax error'), "OperationalError");
  });
});

describe("bases de datos de una ejecución", () => {
  test("ejecuta sentencias con parámetros ? y :nombre, con los tipos de SQLite", () => {
    const databases = createDatabases(SQL);
    const db = databases.connect(":memory:");
    databases.execute(
      db,
      "CREATE TABLE p (id INTEGER PRIMARY KEY, nombre TEXT UNIQUE, precio REAL, foto BLOB)",
    );
    const insert = databases.execute(db, "INSERT INTO p (nombre, precio) VALUES (?, ?)", [
      "Café",
      9500,
    ]);
    assert.equal(insert.rowcount, 1);
    assert.equal(insert.lastrowid, 1n);
    databases.execute(db, "INSERT INTO p (nombre, precio, foto) VALUES (:n, :p, :f)", {
      n: "Té",
      p: 4200.5,
      f: new Uint8Array([65, 66]),
    });
    const select = databases.execute(
      db,
      "SELECT id, nombre, precio, foto, NULL FROM p ORDER BY id",
    );
    assert.deepEqual(select.columns, ["id", "nombre", "precio", "foto", "NULL"]);
    assert.deepEqual(select.rows[0], [1n, "Café", 9500, null, null]);
    assert.deepEqual(select.rows[1].slice(0, 3), [2n, "Té", 4200.5]);
    assert.deepEqual([...select.rows[1][3]], [65, 66]);
    assert.equal(select.rowcount, -1);
  });

  test("da los errores de sqlite3 con sus mensajes", () => {
    const databases = createDatabases(SQL);
    const db = databases.connect(":memory:");
    databases.execute(db, "CREATE TABLE t (id INTEGER PRIMARY KEY, email TEXT NOT NULL UNIQUE)");
    databases.execute(db, "INSERT INTO t (email) VALUES ('a@b.example')");
    assert.deepEqual(
      failure(() => databases.execute(db, "INSERT INTO t (email) VALUES (?)", ["a@b.example"])),
      ["IntegrityError", "UNIQUE constraint failed: t.email"],
    );
    assert.deepEqual(
      failure(() => databases.execute(db, "SELECT * FROM nada")),
      ["OperationalError", "no such table: nada"],
    );
    assert.deepEqual(
      failure(() => databases.execute(db, "SELECT 1; SELECT 2")),
      ["ProgrammingError", "You can only execute one statement at a time."],
    );
    assert.deepEqual(
      failure(() => databases.execute(db, "SELECT ?, ?", [1])),
      [
        "ProgrammingError",
        "Incorrect number of bindings supplied. The current statement uses 2, and there are 1 supplied.",
      ],
    );
    assert.deepEqual(
      failure(() => databases.execute(db, "SELECT :a", { b: 1 })),
      ["ProgrammingError", "You did not supply a value for binding parameter :a."],
    );
    assert.deepEqual(
      failure(() => databases.execute(db, "SELECT ?", [{ unsupported: "list" }])),
      ["ProgrammingError", "Error binding parameter 1: type 'list' is not supported"],
    );
  });

  test("abre una transacción antes de modificar datos y la pierde si no se confirma", () => {
    const databases = createDatabases(SQL);
    const first = databases.connect("tienda.db");
    databases.execute(first, "CREATE TABLE t (x INTEGER)");
    assert.equal(databases.inTransaction(first), false, "CREATE no abre una transacción");
    databases.execute(first, "INSERT INTO t VALUES (1)");
    assert.equal(databases.inTransaction(first), true);
    databases.close(first);

    const second = databases.connect("./tienda.db");
    assert.deepEqual(databases.execute(second, "SELECT count(*) FROM t").rows, [[0n]]);
    databases.execute(second, "INSERT INTO t VALUES (2)");
    databases.commit(second);
    assert.equal(databases.inTransaction(second), false);
    databases.execute(second, "UPDATE t SET x = 5");
    databases.rollback(second);
    assert.deepEqual(databases.execute(second, "SELECT x FROM t").rows, [[2n]]);

    // Sin transacciones implícitas (isolation_level=None), cada cambio queda al momento.
    databases.execute(second, "INSERT INTO t VALUES (3)", [], { implicitTransactions: false });
    assert.equal(databases.inTransaction(second), false);
  });

  test("las bases de práctica se crean con su script en cada ejecución", () => {
    const databases = createDatabases(SQL, { practice: { "libreria.db": LIBRERIA } });
    const db = databases.connect("libreria.db");
    assert.deepEqual(databases.execute(db, "SELECT count(*) FROM libros").rows, [[18n]]);
    databases.execute(db, "DELETE FROM libros");
    databases.commit(db);
    databases.reset();
    const again = databases.connect("libreria.db");
    assert.deepEqual(databases.execute(again, "SELECT count(*) FROM libros").rows, [[18n]]);
  });

  test("da a la pestaña «datos» las bases, sus tablas y el resultado de una consulta", () => {
    const databases = createDatabases(SQL, { practice: { "libreria.db": LIBRERIA } });
    const memory = databases.connect(":memory:");
    databases.execute(memory, "CREATE TABLE notas (id INTEGER PRIMARY KEY, texto TEXT NOT NULL)");
    assert.deepEqual(databases.list(), [
      { name: ":memory: · conexión 1", kind: "memory" },
      { name: "libreria.db", kind: "practice" },
    ]);
    const tables = databases.describe("libreria.db");
    assert.deepEqual(
      tables.map((table) => [table.name, table.count]),
      [
        ["autores", 11],
        ["clientes", 10],
        ["libros", 18],
        ["ventas", 40],
      ],
    );
    assert.deepEqual(tables[0].columns[0], {
      name: "id",
      type: "INTEGER",
      notNull: false,
      primaryKey: true,
    });
    const result = databases.query("libreria.db", "SELECT titulo FROM libros WHERE id = 2");
    assert.deepEqual(result.rows, [["Python para curiosos"]]);
    assert.equal(databases.query("libreria.db", "UPDATE libros SET stock = 0").changes, 18);
    databases.close(memory);
    assert.deepEqual(
      databases.list().map((item) => item.name),
      ["libreria.db"],
      "una base :memory: desaparece al cerrarla",
    );
  });
});
