/*
 * Markdown reducido para el texto de las lecciones:
 *   párrafos, listas con "- " o "1. ", **negrita**, *cursiva*, `código`
 *   y bloques ``` (```py se muestra como ejemplo ejecutable).
 */

import { usesFlet } from "../flet/detect.js";
import { escapeHtml } from "../lib/dom.js";

const FENCE = /^```/;
const BULLET = /^- /;
const NUMBERED = /^\d+\. /;

/**
 * @param {string} source
 * @param {{runnableCode?: boolean}} [options] Si es false, los bloques ```py se muestran como texto fijo.
 * @returns {string} HTML
 */
export function renderMarkdown(source, { runnableCode = true } = {}) {
  const lines = source.split("\n");
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (FENCE.test(line)) {
      const language = line.slice(3).trim() || "txt";
      const code = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) code.push(lines[i++]);
      i++; // cierre del bloque
      const text = code.join("\n");
      html.push(language === "py" && runnableCode ? exampleHtml(text) : outputBlockHtml(text));
    } else if (!line.trim()) {
      i++;
    } else if (BULLET.test(line) || NUMBERED.test(line)) {
      const pattern = BULLET.test(line) ? BULLET : NUMBERED;
      const tag = pattern === BULLET ? "ul" : "ol";
      const items = [];
      while (i < lines.length && pattern.test(lines[i]))
        items.push(lines[i++].replace(pattern, ""));
      html.push(
        `<${tag}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</${tag}>`,
      );
    } else {
      const paragraph = [];
      while (i < lines.length && lines[i].trim() && !/^(```|- |\d+\. )/.test(lines[i])) {
        paragraph.push(lines[i++]);
      }
      html.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
    }
  }
  return html.join("\n");
}

/** Formato dentro de una línea: `código`, **negrita** y *cursiva*. */
export function renderInline(text) {
  return text
    .split("`")
    .map((part, index) =>
      index % 2
        ? `<code>${escapeHtml(part)}</code>`
        : escapeHtml(part)
            .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
            .replace(/\*(?=\S)(.+?)(?<=\S)\*/g, "<em>$1</em>"),
    )
    .join("");
}

function outputBlockHtml(text) {
  return `<pre class="output-block">${escapeHtml(text)}</pre>`;
}

/** Ejemplo ejecutable. El código va en data-code para no depender del resaltado. */
function exampleHtml(code) {
  return `<figure class="example" data-code="${escapeHtml(code)}">
  <div class="bar bar--compact">
    <span>ejemplo.py</span>
    <span class="bar__spacer"></span>
    <button type="button" class="example__action example__action--run" data-action="run-example" data-requires-python>▶ ejecutar</button>
    <button type="button" class="example__action" data-action="edit-example" aria-label="Editar en el playground">editar<span class="example__action-long"> en playground</span></button>
  </div>
  <pre class="example__code">${escapeHtml(code)}</pre>${usesFlet(code) ? '\n  <div class="example__preview flet-preview" hidden></div>' : ""}
  <pre class="example__output" role="log" aria-live="polite" hidden></pre>
</figure>`;
}
