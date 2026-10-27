/*
 * Refleja en la interfaz el estado del motor de Python:
 * "cargando", "listo" o "no disponible", y si hay un programa en marcha.
 */

import { $$ } from "../lib/dom.js";
import { loadPythonEngine } from "../python/libraries.js";
import { onRunningChange } from "../python/engine.js";

let engineFailed = false;

export function bindEngineStatus() {
  loadPythonEngine().then((ready) => {
    engineFailed = !ready;
    $$("[data-engine-status]").forEach((element) => {
      element.textContent = ready ? "python 3 · listo" : "python · no disponible";
      element.classList.toggle("engine-status--ready", ready);
      element.classList.toggle("engine-status--failed", !ready);
    });
    updateButtons(false);
  });

  onRunningChange(updateButtons);
}

/** Mientras un programa corre, se desactivan los botones de ejecutar y aparece "detener". */
function updateButtons(running) {
  $$("[data-requires-python]").forEach((button) => {
    button.disabled = running || engineFailed;
    if (engineFailed) button.title = "El motor de Python no se pudo cargar";
  });
  $$("[data-action='stop']").forEach((button) => {
    button.hidden = !running;
  });
}
