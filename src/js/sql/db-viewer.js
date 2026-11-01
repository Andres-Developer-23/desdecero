/*
 * Explorador de bases de datos (pestaña «datos» de las lecciones de SQL y
 * del playground). Enseña las bases del último programa y las de práctica:
 * sus tablas, su estructura y sus filas, y permite lanzar consultas SQL.
 *
 * Lo que se cambia desde aquí cambia la base de datos de verdad (como en
 * un programa como DB Browser for SQLite), hasta la siguiente ejecución.
 */

import { escapeHtml } from "../lib/dom.js";

/**
 * @param {HTMLElement} host
 * @param {object} options
 * @param {() => ReturnType<import("./databases.js").createDatabases> | null} options.databases
 * @param {() => Promise<boolean>} options.load Carga sql.js si hace falta.
 */
export function createDbViewer(host, { databases, load }) {
  host.classList.add("db-viewer");
  host.innerHTML = `
    <div class="db-viewer__bar">
      <select class="db-viewer__databases" aria-label="Base de datos"></select>
      <span class="db-viewer__summary"></span>
      <span class="db-viewer__spacer"></span>
      <button type="button" class="db-viewer__refresh" aria-label="Actualizar">↻</button>
    </div>
    <div class="db-viewer__tables" role="group" aria-label="Tablas"></div>
    <details class="db-viewer__structure" hidden>
      <summary>estructura de la tabla</summary>
      <pre class="db-viewer__create"></pre>
    </details>
    <div class="db-viewer__result">
      <p class="db-viewer__message"></p>
      <div class="db-viewer__grid"></div>
    </div>
    <form class="db-viewer__console" autocomplete="off">
      <textarea class="db-viewer__sql" rows="2" spellcheck="false" aria-label="Consulta SQL"
        placeholder="SELECT * FROM libros WHERE precio < 40000"></textarea>
      <button type="submit" class="db-viewer__run">ejecutar SQL</button>
    </form>`;

  const parts = {
    select: host.querySelector(".db-viewer__databases"),
    summary: host.querySelector(".db-viewer__summary"),
    refresh: host.querySelector(".db-viewer__refresh"),
    tables: host.querySelector(".db-viewer__tables"),
    structure: host.querySelector(".db-viewer__structure"),
    create: host.querySelector(".db-viewer__create"),
    message: host.querySelector(".db-viewer__message"),
    grid: host.querySelector(".db-viewer__grid"),
    form: host.querySelector(".db-viewer__console"),
    sql: host.querySelector(".db-viewer__sql"),
  };

  let selectedDatabase = null;
  let selectedTable = null;
  let preferred = null;

  function message(text, state = "") {
    parts.message.textContent = text;
    parts.message.dataset.state = state;
    parts.message.hidden = !text;
  }

  /** Vuelve a leer las bases y las tablas, y enseña la tabla elegida. */
  async function refresh() {
    let manager = databases();
    if (!manager) {
      message("cargando SQLite…");
      if (!(await load())) {
        message("No se pudo cargar SQLite. Revisa tu conexión a internet.", "error");
        return;
      }
      manager = databases();
    }
    const list = manager.list();
    if (!list.some((item) => item.name === selectedDatabase)) {
      selectedDatabase =
        list.find((item) => item.name === preferred)?.name ??
        list.find((item) => item.kind !== "practice")?.name ??
        list[0]?.name ??
        null;
    }
    parts.select.innerHTML = list
      .map(
        (item) =>
          `<option value="${escapeHtml(item.name)}"${item.name === selectedDatabase ? " selected" : ""}>${escapeHtml(item.name)}${item.kind === "practice" ? " (de práctica)" : ""}</option>`,
      )
      .join("");
    parts.select.disabled = !list.length;
    if (!selectedDatabase) {
      parts.tables.innerHTML = "";
      parts.grid.innerHTML = "";
      parts.structure.hidden = true;
      parts.summary.textContent = "";
      message("Cuando tu programa cree una base de datos con sqlite3.connect(), aparecerá aquí.");
      return;
    }
    showDatabase();
  }

  function showDatabase() {
    const tables = databases().describe(selectedDatabase);
    parts.summary.textContent = tables.length === 1 ? "1 tabla" : `${tables.length} tablas`;
    if (!tables.some((table) => table.name === selectedTable)) {
      selectedTable = tables[0]?.name ?? null;
    }
    parts.tables.innerHTML = tables
      .map(
        (table) =>
          `<button type="button" data-table="${escapeHtml(table.name)}" aria-pressed="${table.name === selectedTable}">${escapeHtml(table.name)} <span>${table.count}</span></button>`,
      )
      .join("");
    const table = tables.find((item) => item.name === selectedTable);
    parts.structure.hidden = !table;
    if (!table) {
      parts.grid.innerHTML = "";
      message("Esta base de datos todavía no tiene tablas.");
      return;
    }
    parts.create.innerHTML = describeColumns(table);
    showResult(
      databases().query(selectedDatabase, `SELECT * FROM "${table.name.replace(/"/g, '""')}"`),
      table.count,
    );
  }

  /** Enseña el resultado de una consulta: sus filas o cuántas cambió. */
  function showResult(result, total) {
    if (!result.columns) {
      parts.grid.innerHTML = "";
      message(
        result.changes === 1
          ? "Hecho: 1 fila modificada."
          : `Hecho: ${result.changes} filas modificadas.`,
        "ok",
      );
      return;
    }
    const count = total ?? result.rows.length;
    message(
      result.truncated
        ? `${count} filas · se enseñan las ${result.rows.length} primeras`
        : count === 1
          ? "1 fila"
          : `${count} filas`,
    );
    // Las columnas de números se alinean a la derecha, también su título.
    const numeric = result.columns.map((_, index) => {
      const values = result.rows.map((row) => row[index]).filter((value) => value != null);
      return (
        values.length > 0 &&
        values.every((value) => typeof value !== "string" && !(value instanceof Uint8Array))
      );
    });
    parts.grid.innerHTML = `<table>
      <thead><tr>${result.columns.map((column, index) => `<th scope="col"${numeric[index] ? ' class="db-viewer__number"' : ""}>${escapeHtml(column)}</th>`).join("")}</tr></thead>
      <tbody>${result.rows
        .map((row) => `<tr>${row.map((value) => cell(value)).join("")}</tr>`)
        .join("")}</tbody>
    </table>`;
  }

  parts.select.addEventListener("change", () => {
    selectedDatabase = parts.select.value;
    selectedTable = null;
    showDatabase();
  });
  parts.refresh.addEventListener("click", () => refresh());
  parts.tables.addEventListener("click", (event) => {
    const button = event.target.closest("[data-table]");
    if (!button) return;
    selectedTable = button.dataset.table;
    showDatabase();
  });
  parts.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const sql = parts.sql.value.trim();
    if (!sql || !selectedDatabase || !databases()) return;
    try {
      const result = databases().query(selectedDatabase, sql);
      // Las tablas pueden haber cambiado (CREATE, INSERT...): se actualiza la lista.
      const tables = databases().describe(selectedDatabase);
      parts.tables.innerHTML = tables
        .map(
          (table) =>
            `<button type="button" data-table="${escapeHtml(table.name)}" aria-pressed="false">${escapeHtml(table.name)} <span>${table.count}</span></button>`,
        )
        .join("");
      parts.summary.textContent = tables.length === 1 ? "1 tabla" : `${tables.length} tablas`;
      selectedTable = null;
      parts.structure.hidden = true;
      showResult(result);
    } catch (error) {
      parts.grid.innerHTML = "";
      message(`${error.type ?? "Error"}: ${error.message}`, "error");
    }
  });
  parts.sql.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      parts.form.requestSubmit();
    }
  });

  return {
    refresh,
    /** Prepara el explorador para una lección: la base de práctica que conviene enseñar. */
    reset(database = null) {
      preferred = database;
      selectedDatabase = null;
      selectedTable = null;
      parts.sql.value = "";
      return refresh();
    },
    selectedDatabase: () => selectedDatabase,
  };
}

/** Las columnas de una tabla, con su tipo y sus restricciones, y la sentencia CREATE. */
function describeColumns(table) {
  const columns = table.columns
    .map((column) => {
      const marks = [column.primaryKey ? "clave primaria" : "", column.notNull ? "NOT NULL" : ""]
        .filter(Boolean)
        .join(", ");
      return `<span class="db-viewer__column">${escapeHtml(column.name)}</span> ${escapeHtml(column.type || "(sin tipo)")}${marks ? ` <span class="db-viewer__marks">· ${marks}</span>` : ""}`;
    })
    .join("\n");
  return `${columns}\n\n<span class="db-viewer__sql-text">${escapeHtml(table.sql ?? "")}</span>`;
}

/** Un valor como lo enseñaría Python: NULL, números (3.0 con su punto), textos y BLOB. */
function cell(value) {
  if (value === null || value === undefined) return '<td class="db-viewer__null">NULL</td>';
  if (typeof value === "bigint") return `<td class="db-viewer__number">${value}</td>`;
  if (typeof value === "number") {
    const text = Number.isInteger(value) ? `${value}.0` : String(value);
    return `<td class="db-viewer__number">${text}</td>`;
  }
  if (value instanceof Uint8Array)
    return `<td class="db-viewer__null">BLOB · ${value.length} bytes</td>`;
  return `<td>${escapeHtml(value)}</td>`;
}
