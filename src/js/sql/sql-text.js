/*
 * Lectura del texto de una sentencia SQL, sin ejecutarla: sus parámetros
 * (? y :nombre) y la palabra con la que empieza. Se saltan los textos
 * ('...'), los identificadores entre comillas y los comentarios.
 *
 * No depende del navegador: se prueba en tests/unit.
 */

const NAME_START = /[A-Za-z_À-￿]/;
const NAME_PART = /[A-Za-z0-9_$À-￿]/;

/** Recorre el SQL y llama a visit(i) en cada carácter que no está en un texto ni en un comentario. */
function scan(sql, visit) {
  let i = 0;
  while (i < sql.length) {
    const char = sql[i];
    if (char === "'" || char === '"' || char === "`") {
      i = skipQuoted(sql, i, char);
    } else if (char === "[") {
      const end = sql.indexOf("]", i + 1);
      i = end < 0 ? sql.length : end + 1;
    } else if (char === "-" && sql[i + 1] === "-") {
      const end = sql.indexOf("\n", i);
      i = end < 0 ? sql.length : end + 1;
    } else if (char === "/" && sql[i + 1] === "*") {
      const end = sql.indexOf("*/", i + 2);
      i = end < 0 ? sql.length : end + 2;
    } else {
      i = visit(i) ?? i + 1;
    }
  }
}

function skipQuoted(sql, start, quote) {
  let i = start + 1;
  while (i < sql.length) {
    if (sql[i] === quote) {
      if (sql[i + 1] === quote) i += 2;
      else return i + 1;
    } else i++;
  }
  return sql.length;
}

/**
 * Los parámetros de una sentencia, en el orden de SQLite: cada posición
 * tiene su nombre (":nombre", "@x", "$x") o null si es un "?".
 * @returns {Array<string | null>}
 */
export function sqlParameters(sql) {
  const slots = [];
  scan(sql, (i) => {
    const char = sql[i];
    if (char === "?") {
      let end = i + 1;
      while (end < sql.length && /\d/.test(sql[end])) end++;
      if (end > i + 1) {
        const index = Number(sql.slice(i + 1, end));
        while (slots.length < index) slots.push(null);
      } else {
        slots.push(null);
      }
      return end;
    }
    if ((char === ":" || char === "@" || char === "$") && NAME_START.test(sql[i + 1] ?? "")) {
      let end = i + 1;
      while (end < sql.length && NAME_PART.test(sql[end])) end++;
      const name = sql.slice(i, end);
      if (!slots.includes(name)) slots.push(name);
      return end;
    }
    return undefined;
  });
  return slots;
}

/** La primera palabra de la sentencia, en mayúsculas ("SELECT", "INSERT"...), o "". */
export function firstKeyword(sql) {
  let word = "";
  scan(sql, (i) => {
    if (word) return sql.length;
    if (/[A-Za-z]/.test(sql[i])) {
      let end = i;
      while (end < sql.length && /[A-Za-z]/.test(sql[end])) end++;
      word = sql.slice(i, end).toUpperCase();
      return sql.length;
    }
    return undefined;
  });
  return word;
}

/** true si el texto no tiene ninguna sentencia: solo espacios, ; y comentarios. */
export function isBlankSql(sql) {
  let blank = true;
  scan(sql, (i) => {
    if (!/[\s;]/.test(sql[i])) {
      blank = false;
      return sql.length;
    }
    return undefined;
  });
  // Un texto o un identificador entre comillas también es contenido.
  return blank && !/['"`[]/.test(sql.replace(/--[^\n]*|\/\*[\s\S]*?\*\//g, ""));
}

/** INSERT, UPDATE, DELETE y REPLACE: las sentencias que cuentan filas en rowcount. */
export const isDml = (sql) => ["INSERT", "UPDATE", "DELETE", "REPLACE"].includes(firstKeyword(sql));
