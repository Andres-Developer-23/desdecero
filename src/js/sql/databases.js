/*
 * Las bases de datos de una ejecución, sobre sql.js (SQLite compilado a
 * WebAssembly). Es la parte del simulador de sqlite3 que no depende de
 * Skulpt: abre conexiones, ejecuta sentencias con parámetros, lleva las
 * transacciones como el módulo sqlite3 de Python y da a la pestaña
 * «datos» las tablas y sus filas.
 *
 * - Una base con nombre de archivo ("tienda.db") dura toda la ejecución y
 *   la comparten las conexiones que la abren. Las de práctica
 *   (content/db/*.sql) se crean con su script la primera vez que se abren.
 * - Cada connect(":memory:") es una base nueva, que desaparece al cerrarla.
 *
 * Los valores van como en sql.js con useBigInt: los enteros, BigInt; los
 * reales, number; los textos, string; los BLOB, Uint8Array; NULL, null.
 * Al enlazar parámetros, un float de Python llega como {real: número}:
 * sql.js enlazaría 2.0 como el entero 2, y en SQLite no es lo mismo (2.0 / 4
 * da 0.5, pero 2 / 4 da 0).
 *
 * No depende del navegador: se prueba en tests/unit con sql.js.
 */

import { firstKeyword, isBlankSql, isDml, sqlParameters } from "./sql-text.js";

/** Un error con la clase de excepción de sqlite3 que le corresponde. */
export class SqlError extends Error {
  constructor(type, message) {
    super(message);
    this.type = type;
  }
}

/** Qué excepción de Python corresponde a un mensaje de error de SQLite. */
export function errorType(message) {
  if (/constraint failed|datatype mismatch/.test(message)) return "IntegrityError";
  if (/string or blob too big/.test(message)) return "DataError";
  if (/column index out of range/.test(message)) return "ProgrammingError";
  return "OperationalError";
}

const MAX_VIEWER_ROWS = 200;

/**
 * @param {any} SQL El módulo de sql.js (con SQL.Database).
 * @param {{practice?: Record<string, string>}} [options] Scripts de las bases de práctica, por nombre.
 */
export function createDatabases(SQL, { practice = {} } = {}) {
  /** Bases con nombre de archivo de esta ejecución: nombre → {db, inTransaction, owner}. */
  let files = new Map();
  /** Conexiones abiertas: handle → {name, entry, memory}. */
  let connections = new Map();
  let nextHandle = 1;

  function newEntry(script) {
    const db = new SQL.Database();
    if (script) db.exec(script);
    return { db, inTransaction: false, owner: null };
  }

  function fileEntry(name) {
    if (!files.has(name)) files.set(name, newEntry(practice[name]));
    return files.get(name);
  }

  function connection(handle) {
    const found = connections.get(handle);
    if (!found) throw new SqlError("ProgrammingError", "Cannot operate on a closed database.");
    return found;
  }

  /** Abre una conexión y devuelve su número. */
  function connect(path) {
    const name = normalizeName(path);
    const handle = nextHandle++;
    const memory = name === ":memory:";
    const entry = memory ? newEntry() : fileEntry(name);
    connections.set(handle, {
      name: memory ? `:memory: · conexión ${handle}` : name,
      entry,
      memory,
    });
    return handle;
  }

  function close(handle) {
    const found = connections.get(handle);
    if (!found) return;
    // Lo que no se confirmó con commit() se pierde, como en SQLite.
    if (found.entry.inTransaction && found.entry.owner === handle) rollback(handle);
    connections.delete(handle);
    if (found.memory) found.entry.db.close();
  }

  /** Ejecuta un trozo de SQL con sql.js, convirtiendo sus errores. */
  function guard(run) {
    try {
      return run();
    } catch (error) {
      if (error instanceof SqlError) throw error;
      const message = String(error?.message ?? error);
      throw new SqlError(errorType(message), message);
    }
  }

  /** BEGIN, COMMIT y ROLLBACK escritos en el SQL también cambian el estado de la transacción. */
  function trackTransaction(entry, sql, handle) {
    const keyword = firstKeyword(sql);
    if (keyword === "BEGIN") {
      entry.inTransaction = true;
      entry.owner = handle;
    } else if (keyword === "COMMIT" || keyword === "END") {
      entry.inTransaction = false;
    } else if (keyword === "ROLLBACK" && !/^\s*ROLLBACK\s+(TRANSACTION\s+)?TO\b/i.test(sql)) {
      entry.inTransaction = false;
    }
  }

  /**
   * Prepara los parámetros como los pide sql.js, con los errores de sqlite3.
   * values es una lista (para ?) o un objeto {nombre: valor} (para :nombre).
   * @returns {{bound: unknown[] | Record<string, unknown>, reals: Array<[number, number]>}}
   *   reals: las posiciones (desde 1) de los float, que hay que enlazar como REAL.
   */
  function bindings(sql, values) {
    const slots = sqlParameters(sql);
    if (values == null) values = [];
    const named = !Array.isArray(values);
    if (!named && values.length !== slots.length) {
      throw new SqlError(
        "ProgrammingError",
        `Incorrect number of bindings supplied. The current statement uses ${slots.length}, and there are ${values.length} supplied.`,
      );
    }
    // sql.js recibe una lista para los "?" (por posición) o un objeto {":nombre": valor}.
    const result = named ? {} : [];
    const reals = [];
    slots.forEach((slot, index) => {
      let value;
      if (named) {
        if (slot === null) {
          throw new SqlError(
            "ProgrammingError",
            `Binding ${index + 1} has no name, but you supplied a dictionary (which has only names).`,
          );
        }
        const key = slot.slice(1);
        if (!Object.prototype.hasOwnProperty.call(values, key)) {
          throw new SqlError(
            "ProgrammingError",
            `You did not supply a value for binding parameter ${slot}.`,
          );
        }
        value = values[key];
      } else {
        value = values[index];
      }
      if (value !== null && typeof value === "object" && "unsupported" in value) {
        throw new SqlError(
          "ProgrammingError",
          `Error binding parameter ${index + 1}: type '${value.unsupported}' is not supported`,
        );
      }
      if (value !== null && typeof value === "object" && "real" in value) {
        value = value.real;
        reals.push([index + 1, value]);
      }
      if (named) result[slot] = value;
      else result.push(value);
    });
    return { bound: result, reals };
  }

  /** Vuelve a enlazar los float como REAL: sql.js enlaza como entero todo número sin decimales. */
  function bindReals(statement, reals) {
    if (!reals.length || typeof SQL._sqlite3_bind_double !== "function") return;
    // El puntero de la sentencia es la primera propiedad del objeto Statement de sql.js (antes de db).
    const keys = Object.keys(statement);
    const pointer = keys[1] === "db" ? statement[keys[0]] : null;
    if (typeof pointer !== "number") return;
    for (const [position, value] of reals) SQL._sqlite3_bind_double(pointer, position, value);
  }

  /**
   * Ejecuta una sola sentencia, como Cursor.execute().
   * @returns {{columns: string[] | null, rows: unknown[][], rowcount: number, lastrowid: bigint | null}}
   *   lastrowid es null solo si el SQL estaba vacío.
   */
  function execute(handle, sql, values = null, { implicitTransactions = true } = {}) {
    const { entry } = connection(handle);
    const { db } = entry;
    const { bound, reals } = bindings(sql, values);
    if (isBlankSql(sql)) return { columns: null, rows: [], rowcount: -1, lastrowid: null };

    return guard(() => {
      const iterator = db.iterateStatements(sql);
      const first = iterator.next();
      if (first.done) return { columns: null, rows: [], rowcount: -1, lastrowid: null };
      const statement = first.value;
      try {
        if (!isBlankSql(iterator.getRemainingSQL())) {
          throw new SqlError("ProgrammingError", "You can only execute one statement at a time.");
        }
        // Como sqlite3 de Python: antes de modificar datos se abre una transacción.
        const dml = isDml(sql);
        if (implicitTransactions && dml && !entry.inTransaction) {
          db.exec("BEGIN");
          entry.inTransaction = true;
          entry.owner = handle;
        }
        if (Array.isArray(bound) ? bound.length : Object.keys(bound).length) {
          statement.bind(bound);
          bindReals(statement, reals);
        }
        const columns = statement.getColumnNames();
        const rows = [];
        while (statement.step()) rows.push(statement.get(null, { useBigInt: true }));
        trackTransaction(entry, sql, handle);
        // Como sqlite3 de Python, lastrowid es siempre el último rowid insertado en la base.
        return {
          columns: columns.length ? columns : null,
          rows,
          rowcount: dml ? db.getRowsModified() : -1,
          lastrowid: scalar(db, "SELECT last_insert_rowid()"),
        };
      } finally {
        statement.free();
        iterator.finalize?.();
      }
    });
  }

  /** Ejecuta varias sentencias seguidas, como Connection.executescript(). */
  function executeScript(handle, sql) {
    const { entry } = connection(handle);
    commit(handle);
    guard(() => {
      for (const statement of entry.db.iterateStatements(sql)) {
        const text = statement.getSQL();
        try {
          while (statement.step());
        } finally {
          statement.free();
        }
        trackTransaction(entry, text, handle);
      }
    });
  }

  function commit(handle) {
    const { entry } = connection(handle);
    if (!entry.inTransaction) return;
    guard(() => entry.db.exec("COMMIT"));
    entry.inTransaction = false;
  }

  function rollback(handle) {
    const { entry } = connection(handle);
    if (!entry.inTransaction) return;
    guard(() => entry.db.exec("ROLLBACK"));
    entry.inTransaction = false;
  }

  const inTransaction = (handle) => connection(handle).entry.inTransaction;
  const totalChanges = (handle) =>
    Number(scalar(connection(handle).entry.db, "SELECT total_changes()"));

  /** Cierra todo: cada ejecución empieza sin bases de datos. */
  function reset() {
    for (const { entry, memory } of connections.values()) if (memory) entry.db.close();
    for (const entry of files.values()) entry.db.close();
    files = new Map();
    connections = new Map();
    nextHandle = 1;
  }

  /* ---- Para la pestaña «datos» ---- */

  /** Las bases que se pueden ver: las del programa y las de práctica. */
  function list() {
    const names = new Set();
    const result = [];
    for (const name of files.keys()) {
      names.add(name);
      result.push({ name, kind: name in practice ? "practice" : "file" });
    }
    for (const found of connections.values()) {
      if (found.memory) result.push({ name: found.name, kind: "memory" });
    }
    for (const name of Object.keys(practice).sort()) {
      if (!names.has(name)) result.push({ name, kind: "practice" });
    }
    return result;
  }

  function databaseByName(name) {
    for (const found of connections.values()) if (found.name === name) return found.entry.db;
    if (name in practice || files.has(name)) return fileEntry(name).db;
    return null;
  }

  /** Las tablas de una base: nombre, columnas, filas y la sentencia CREATE. */
  function describe(name) {
    const db = databaseByName(name);
    if (!db) return [];
    const tables = rowsOf(
      db,
      "SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
    );
    return tables.map(([table, sql]) => ({
      name: table,
      sql,
      columns: rowsOf(db, `PRAGMA table_info(${quoteName(table)})`).map((column) => ({
        name: column[1],
        type: column[2],
        notNull: Boolean(Number(column[3])),
        primaryKey: Boolean(Number(column[5])),
      })),
      count: Number(scalar(db, `SELECT count(*) FROM ${quoteName(table)}`)),
    }));
  }

  /** Ejecuta SQL desde la pestaña «datos» y devuelve el resultado de la última sentencia. */
  function query(name, sql) {
    const db = databaseByName(name);
    if (!db) throw new SqlError("OperationalError", `No existe la base de datos ${name}`);
    return guard(() => {
      let last = { columns: null, rows: [], changes: 0, truncated: false };
      for (const statement of db.iterateStatements(sql)) {
        try {
          const columns = statement.getColumnNames();
          const rows = [];
          let truncated = false;
          while (statement.step()) {
            if (rows.length < MAX_VIEWER_ROWS) rows.push(statement.get(null, { useBigInt: true }));
            else truncated = true;
          }
          const text = statement.getSQL();
          last = {
            columns: columns.length ? columns : null,
            rows,
            changes: isDml(text) ? db.getRowsModified() : 0,
            truncated,
          };
        } finally {
          statement.free();
        }
      }
      return last;
    });
  }

  return {
    connect,
    close,
    execute,
    executeScript,
    commit,
    rollback,
    inTransaction,
    totalChanges,
    reset,
    list,
    describe,
    query,
  };
}

/** "./tienda.db" y "tienda.db" son el mismo archivo. */
function normalizeName(path) {
  const text = String(path);
  if (text === ":memory:" || text === "") return ":memory:";
  return text.replace(/^(\.\/)+/, "");
}

function quoteName(name) {
  return `"${String(name).replace(/"/g, '""')}"`;
}

function rowsOf(db, sql) {
  const result = db.exec(sql);
  return result.length ? result[0].values : [];
}

function scalar(db, sql) {
  const statement = db.prepare(sql);
  try {
    statement.step();
    return statement.get(null, { useBigInt: true })[0];
  } finally {
    statement.free();
  }
}
