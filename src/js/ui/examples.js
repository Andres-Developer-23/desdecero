/*
 * Ejemplos ejecutables dentro de las lecciones: resaltado de sintaxis,
 * botón de ejecutar y botón de abrirlos en el playground. Los ejemplos de
 * Flet muestran la app en su propia vista previa.
 */

import { createFletRenderer } from "../flet/renderer.js";
import { sendFletEvent } from "../flet/runtime.js";
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

const previews = new WeakMap();

/** La vista previa de un ejemplo de Flet, creada la primera vez que se ejecuta. */
function previewFor(example) {
  const host = $(".example__preview", example);
  if (!host) return null;
  if (!previews.has(example)) {
    previews.set(example, createFletRenderer(host, { onEvent: sendFletEvent }));
  }
  return previews.get(example);
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
    const preview = previewFor(example);
    // En los ejemplos de Flet la salida solo aparece si el programa escribe algo.
    output.hidden = Boolean(preview);
    const terminal = createTerminal(output, {
      onWrite: () => {
        if (preview && output.textContent.trim()) output.hidden = false;
      },
    });
    runInTerminal(code, terminal, { onStart: onRun, preview });
  });
}
