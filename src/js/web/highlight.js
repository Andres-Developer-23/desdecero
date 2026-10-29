/*
 * Resaltado del código que enseña la pestaña «web»: HTML de las páginas y
 * JSON de las APIs (con sangría, aunque la API lo envíe en una sola línea).
 *
 * No depende del navegador: se prueba en tests/unit.
 */

import { escapeHtml } from "../lib/dom.js";

/** Resaltado sencillo de HTML: etiquetas, atributos, valores y comentarios. */
export function highlightHtml(source) {
  return escapeHtml(source)
    .replace(/&lt;!--[\s\S]*?--&gt;/g, (comment) => `<span class="hl-comment">${comment}</span>`)
    .replace(
      /(&lt;\/?)([a-zA-Z][\w-]*)([^]*?)(\/?&gt;)/g,
      (match, open, name, attributes, close) =>
        `${open}<span class="hl-tag">${name}</span>${attributes.replace(
          /([\w:-]+)(=)(&quot;[^]*?&quot;|&#39;[^]*?&#39;|[^\s&]+)/g,
          '<span class="hl-attr">$1</span>$2<span class="hl-value">$3</span>',
        )}${close}`,
    );
}

const JSON_TOKEN = /"(?:[^"\\]|\\.)*"|-?\d+(?:\.\d+)?(?:[eE][-+]?\d+)?|true|false|null|[{}[\],:]/g;

/**
 * JSON con sangría de 2 espacios y colores, o null si el texto no es JSON.
 * Respeta los números tal como vienen (2.0 sigue siendo 2.0).
 */
export function highlightJson(text) {
  try {
    JSON.parse(text);
  } catch {
    return null;
  }
  const tokens = text.match(JSON_TOKEN) ?? [];
  const pad = (level) => "  ".repeat(level);
  let html = "";
  let level = 0;
  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    const next = tokens[i + 1];
    if (token === "{" || token === "[") {
      if (next === "}" || next === "]") {
        html += token + next;
        i++;
      } else {
        level++;
        html += `${token}\n${pad(level)}`;
      }
    } else if (token === "}" || token === "]") {
      level--;
      html += `\n${pad(level)}${token}`;
    } else if (token === ",") {
      html += `,\n${pad(level)}`;
    } else if (token === ":") {
      html += ": ";
    } else {
      html += `<span class="${tokenClass(token, next)}">${escapeHtml(token)}</span>`;
    }
  }
  return html;
}

function tokenClass(token, next) {
  if (token.startsWith('"')) return next === ":" ? "hl-key" : "hl-string";
  if (token === "true" || token === "false" || token === "null") return "hl-literal";
  return "hl-number";
}
