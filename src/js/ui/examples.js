/*
 * Ejemplos ejecutables dentro de las lecciones: resaltado de sintaxis,
 * botón de ejecutar y botón de abrirlos en el playground.
 */

import { $ } from "../lib/dom.js";
import { createTerminal } from "./terminal.js";
import { runInTerminal } from "./run-in-terminal.js";

/** Resalta la sintaxis de los ejemplos que aún no lo están (requiere CodeMirror). */
export function highlightExamples(root = document) {
  const runMode = window.CodeMirror?.runMode;
  if (!runMode) return;
  root.querySelectorAll(".example__code:not([data-highlighted])").forEach((pre) => {
    const code = pre.closest(".example").dataset.code;
    pre.textContent = "";
    try {
      runMode(code, { name: "python", version: 3 }, pre);
    } catch {
      pre.textContent = code;
    }
    pre.dataset.highlighted = "true";
  });
}

/**
 * Atiende los clics en los botones de todos los ejemplos de la página.
 * @param {{onRun: () => void, onEditInPlayground: (code: string) => void}} handlers
 */
export function setupExamples({ onRun, onEditInPlayground }) {
  document.addEventListener("click", (event) => {
    const button = event.target.closest(
      "[data-action='run-example'], [data-action='edit-example']",
    );
    if (!button) return;
    const example = button.closest(".example");
    const code = example.dataset.code;

    if (button.dataset.action === "edit-example") {
      onEditInPlayground(code);
      return;
    }

    const output = $(".example__output", example);
    output.hidden = false;
    runInTerminal(code, createTerminal(output), { onStart: onRun });
  });
}
