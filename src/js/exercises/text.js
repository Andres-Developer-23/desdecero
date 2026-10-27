/* Utilidades puras de texto que usa el comprobador de ejercicios. */

/** Quita los comentarios (#) de un código Python, respetando los # dentro de textos. */
export function stripComments(code) {
  return code
    .split("\n")
    .map((line) => {
      let quote = null;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (quote) {
          if (char === "\\") i++;
          else if (char === quote) quote = null;
        } else if (char === '"' || char === "'") {
          quote = char;
        } else if (char === "#") {
          return line.slice(0, i);
        }
      }
      return line;
    })
    .join("\n");
}

/** Normaliza una salida para compararla: sin espacios al final de línea ni líneas vacías en los extremos. */
export function normalizeOutput(text) {
  return text
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .join("\n")
    .replace(/^\n+|\n+$/g, "");
}

/** Sangra cada línea de un texto. */
export const indentLines = (text, prefix = "    ") =>
  text
    .split("\n")
    .map((line) => prefix + line)
    .join("\n");

/** Número de líneas de un código. */
export const countLines = (code) => code.split("\n").length;
