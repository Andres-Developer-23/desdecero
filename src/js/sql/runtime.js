/*
 * Conecta el módulo sqlite3 de Python (src/python/sqlite3/) con las bases
 * de datos de sql.js (databases.js) a través del módulo puente _sqlite.
 *
 * Antes de cada ejecución se cierran las bases de la anterior, y si el
 * programa usa sqlite3 se carga sql.js (la primera vez tarda un poco: es
 * SQLite entero). Los valores se convierten en los tipos de Python: los
 * enteros de SQLite en int, los reales en float, NULL en None.
 */

import sqliteSource from "../../python/sqlite3/__init__.py";
import { createEmitter } from "../lib/events.js";
import { addRunSetup, onRunningChange, registerPythonFiles } from "../python/engine.js";
import { SqlError, createDatabases } from "./databases.js";
import { usesSqlite } from "./detect.js";
import { loadSqlEngine } from "./engine.js";

/* Módulo nativo de Skulpt ("import _sqlite"): pasa los objetos de Python tal cual. */
const BRIDGE_SOURCE = `
var $builtinmodule = function (name) {
  var host = window.__desdeceroSql;
  var mod = { __name__: new Sk.builtin.str("_sqlite") };
  ["available", "sqlite_version", "connect", "execute", "execute_script", "commit", "rollback",
   "close", "in_transaction", "total_changes"].forEach(function (pyName) {
    mod[pyName] = new Sk.builtin.func(function () {
      return host.call(pyName, Array.prototype.slice.call(arguments));
    });
  });
  return mod;
};
`;

let practiceScripts = {};
let databases = null;
let version = null;
const emitter = createEmitter();

/**
 * Registra sqlite3 y las bases de práctica. Se llama una vez al arrancar.
 * @param {{databases?: Record<string, string>}} sources Scripts SQL de las bases de práctica, por nombre de archivo.
 */
export function installSqlRuntime({ databases: scripts = {} } = {}) {
  practiceScripts = scripts;
  registerPythonFiles({
    "src/lib/sqlite3/__init__.py": sqliteSource,
    "src/lib/_sqlite.js": BRIDGE_SOURCE,
  });
  window.__desdeceroSql = { call: (name, args) => BRIDGE[name](window.Sk, ...args) };

  addRunSetup(async (Sk, code) => {
    databases?.reset();
    if (usesSqlite(code)) await loadSqlRuntime();
  });
  onRunningChange((running) => {
    if (!running) emitter.emit("run");
  });
}

/** Carga sql.js si hace falta. Resuelve true si las bases de datos están disponibles. */
export async function loadSqlRuntime() {
  if (databases) return true;
  const SQL = await loadSqlEngine();
  if (!SQL) return false;
  databases ??= createDatabases(SQL, { practice: practiceScripts });
  if (!version) {
    const scratch = new SQL.Database();
    version = scratch.exec("SELECT sqlite_version()")[0].values[0][0];
    scratch.close();
  }
  return true;
}

/** Las bases de datos de la ejecución (para la pestaña «datos»), o null si sql.js no está cargado. */
export const sqlDatabases = () => databases;

/** Los nombres de las bases de práctica. */
export const practiceDatabases = () => Object.keys(practiceScripts).sort();

/** Avisa al terminar cada ejecución, para que la pestaña «datos» se actualice. */
export const onSqlRun = (listener) => emitter.on("run", listener);

/* ---- Funciones del módulo _sqlite ---- */

/** Errores de sqlite3 como diccionario {"error", "message"}: el módulo de Python lanza la excepción. */
function attempt(Sk, run) {
  try {
    return run();
  } catch (error) {
    const type = error instanceof SqlError ? error.type : "OperationalError";
    return pyDict(Sk, { error: str(Sk, type), message: str(Sk, error.message ?? String(error)) });
  }
}

const BRIDGE = {
  available: (Sk) => (databases ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$),
  sqlite_version: (Sk) => str(Sk, version ?? "3"),
  connect: (Sk, path) =>
    attempt(Sk, () => new Sk.builtin.int_(databases.connect(new Sk.builtin.str(path).v))),
  execute: (Sk, handle, sql, names, values, implicit) =>
    attempt(Sk, () => {
      const list = values.v.map((value) => toJs(Sk, value));
      let parameters = list;
      if (names !== Sk.builtin.none.none$) {
        parameters = {};
        names.v.forEach((name, index) => {
          parameters[new Sk.builtin.str(name).v] = list[index];
        });
      }
      const result = databases.execute(handle.v, sql.v, parameters, {
        implicitTransactions: Sk.misceval.isTrue(implicit),
      });
      return pyDict(Sk, {
        columns: result.columns
          ? new Sk.builtin.list(result.columns.map((column) => str(Sk, column)))
          : Sk.builtin.none.none$,
        rows: new Sk.builtin.list(
          result.rows.map((row) => new Sk.builtin.tuple(row.map((value) => toPython(Sk, value)))),
        ),
        rowcount: new Sk.builtin.int_(result.rowcount),
        lastrowid:
          result.lastrowid === null ? Sk.builtin.none.none$ : toPython(Sk, result.lastrowid),
      });
    }),
  execute_script: (Sk, handle, sql) =>
    attempt(Sk, () => {
      databases.executeScript(handle.v, sql.v);
      return Sk.builtin.none.none$;
    }),
  commit: (Sk, handle) =>
    attempt(Sk, () => {
      databases.commit(handle.v);
      return Sk.builtin.none.none$;
    }),
  rollback: (Sk, handle) =>
    attempt(Sk, () => {
      databases.rollback(handle.v);
      return Sk.builtin.none.none$;
    }),
  close: (Sk, handle) => {
    databases.close(handle.v);
    return Sk.builtin.none.none$;
  },
  in_transaction: (Sk, handle) =>
    databases.inTransaction(handle.v) ? Sk.builtin.bool.true$ : Sk.builtin.bool.false$,
  total_changes: (Sk, handle) => new Sk.builtin.int_(databases.totalChanges(handle.v)),
};

const str = (Sk, text) => new Sk.builtin.str(text);

function pyDict(Sk, entries) {
  const dict = new Sk.builtin.dict([]);
  for (const [key, value] of Object.entries(entries)) {
    dict.mp$ass_subscript(new Sk.builtin.str(key), value);
  }
  return dict;
}

/** Un valor de Python como lo espera sql.js (o {unsupported} si SQLite no lo admite). */
function toJs(Sk, value) {
  if (value === Sk.builtin.none.none$) return null;
  if (value instanceof Sk.builtin.bool) return Sk.misceval.isTrue(value) ? 1 : 0;
  if (value instanceof Sk.builtin.int_) {
    // sql.js guarda como entero exacto los números de 32 bits; los mayores van como BigInt,
    // que SQLite convierte en entero en las columnas INTEGER.
    const big = BigInt(new Sk.builtin.str(value).v);
    return big >= -(2n ** 31n) && big < 2n ** 31n ? Number(big) : big;
  }
  // Los float se marcan para enlazarlos como REAL aunque no tengan decimales (2.0).
  if (value instanceof Sk.builtin.float_) return { real: value.v };
  if (value instanceof Sk.builtin.str) return value.v;
  if (value instanceof Sk.builtin.bytes) return new Uint8Array(value.v);
  return { unsupported: Sk.abstr.typeName(value) };
}

/** Un valor de SQLite como objeto de Python: INTEGER → int, REAL → float, TEXT → str... */
function toPython(Sk, value) {
  if (value === null || value === undefined) return Sk.builtin.none.none$;
  if (typeof value === "bigint") {
    const number = Number(value);
    return Number.isSafeInteger(number)
      ? new Sk.builtin.int_(number)
      : Sk.misceval.callsimArray(Sk.builtin.int_, [new Sk.builtin.str(value.toString())]);
  }
  if (typeof value === "number") return new Sk.builtin.float_(value);
  if (typeof value === "string") return new Sk.builtin.str(value);
  if (value instanceof Uint8Array) return new Sk.builtin.bytes(new Uint8Array(value));
  return Sk.builtin.none.none$;
}
