/*
 * Lo propio de los proyectos en la vista de lección: los pasos (empezar,
 * escribir, comprobar), las pestañas «detalle del proyecto» y «soluciones»
 * y la línea de argumentos de los programas de línea de comandos.
 *
 * En lugar de soluciones de la comunidad (que necesitarían un servidor), la
 * pestaña de soluciones tiene la solución de referencia, con su explicación,
 * y la del alumno, para copiarla o descargarla y publicarla en su GitHub.
 */

import { $, escapeHtml } from "../lib/dom.js";
import { splitArgs } from "../ui/format.js";
import { renderMarkdown } from "../ui/markdown.js";

const REVEAL_CONFIRM_MS = 3500;

/**
 * Si los archivos que guarda el programa se conservan entre ejecuciones, como en un
 * ordenador: en los programas de línea de comandos y en los que se comprueban con persist.
 */
export const keepsFiles = (item) =>
  item?.kind === "project" && Boolean(item.cli || item.checks?.persist);

/**
 * @param {object} deps
 * @param {() => string} deps.getCode El código del editor.
 * @param {(id: string) => boolean} deps.isDone
 */
export function createProjectPanel({ getCode, isDone }) {
  const elements = {
    steps: $("#project-steps"),
    tabs: $("#project-tabs"),
    detail: $("#lesson-body"),
    solutions: $("#project-solutions"),
    args: $("#exercise-args"),
    argsLabel: $("#exercise-args-label"),
    argsFile: $("#exercise-args-file"),
    argsInput: $("#exercise-args-input"),
  };
  let project = null;
  let revealTimer = null;

  function select(tab) {
    for (const button of elements.tabs.querySelectorAll("[data-tab]")) {
      button.setAttribute("aria-selected", String(button.dataset.tab === tab));
    }
    elements.detail.hidden = tab !== "detail";
    elements.solutions.hidden = tab !== "solutions";
  }

  elements.tabs.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tab]");
    if (button) select(button.dataset.tab);
  });

  function renderSolutions() {
    elements.solutions.innerHTML = `
      <h3>Solución de referencia</h3>
      <p>Es una forma de resolverlo, no la única: si tu programa pasa las comprobaciones, también es una solución. Compáralas cuando termines; ver otra manera de hacer lo mismo enseña mucho.</p>
      <p class="project-solutions__reveal">
        <button class="button" type="button" data-solution-action="reveal">ver la solución de referencia</button>
      </p>
      <div class="project-solutions__reference" hidden>
        ${renderMarkdown(project.explanation, { runnableCode: false })}
        <pre class="project-solutions__code cm-s-pdc"></pre>
      </div>
      <h3>Tu solución</h3>
      <p>Tu código se guarda en este navegador. Para enseñarlo, cópialo o descárgalo y súbelo a un repositorio de GitHub con un README que explique qué hace y cómo se usa: es la mejor forma de empezar un portafolio.</p>
      <p class="project-solutions__actions">
        <button class="button" type="button" data-solution-action="copy">copiar tu código</button>
        <button class="button" type="button" data-solution-action="download">descargar ${escapeHtml(project.file)}</button>
        <span class="eyebrow project-solutions__status" aria-live="polite"></span>
      </p>`;
  }

  function status(text) {
    const element = elements.solutions.querySelector(".project-solutions__status");
    if (element) element.textContent = text;
  }

  /** La solución se enseña con dos pulsaciones si el proyecto todavía no está superado. */
  function reveal(button) {
    if (!isDone(project.id) && !button.dataset.armed) {
      button.dataset.armed = "true";
      button.textContent = "¿seguro? inténtalo antes · pulsa otra vez";
      button.classList.add("button--armed");
      revealTimer = setTimeout(() => {
        delete button.dataset.armed;
        button.textContent = "ver la solución de referencia";
        button.classList.remove("button--armed");
      }, REVEAL_CONFIRM_MS);
      return;
    }
    clearTimeout(revealTimer);
    button.closest(".project-solutions__reveal").hidden = true;
    const reference = elements.solutions.querySelector(".project-solutions__reference");
    reference.hidden = false;
    const code = reference.querySelector(".project-solutions__code");
    code.textContent = "";
    const runMode = window.CodeMirror?.runMode;
    if (runMode) runMode(project.solution, { name: "python", version: 3 }, code);
    else code.textContent = project.solution;
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(getCode());
      status("copiado");
    } catch {
      status("no se pudo copiar: selecciona el código del editor y cópialo a mano");
    }
  }

  function download() {
    const url = URL.createObjectURL(new Blob([getCode()], { type: "text/x-python" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = project.file;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    status(`descargado: ${project.file}`);
  }

  elements.solutions.addEventListener("click", (event) => {
    const button = event.target.closest("[data-solution-action]");
    if (!button || !project) return;
    const action = button.dataset.solutionAction;
    if (action === "reveal") reveal(button);
    else if (action === "copy") copy();
    else if (action === "download") download();
  });

  return {
    /** Prepara la vista para un proyecto, o la deja como para una lección (item sin proyecto). */
    show(item) {
      project = item?.kind === "project" ? item : null;
      clearTimeout(revealTimer);
      elements.steps.hidden = !project;
      elements.tabs.hidden = !project;
      // La fila tiene los argumentos (programas de línea de comandos) y el botón de vaciar el
      // disco (programas que guardan datos entre usos).
      elements.args.hidden = !keepsFiles(project);
      elements.argsLabel.hidden = !project?.cli;
      elements.argsInput.hidden = !project?.cli;
      if (!project) {
        elements.detail.hidden = false;
        elements.solutions.hidden = true;
        elements.solutions.innerHTML = "";
        return;
      }
      renderSolutions();
      select("detail");
      elements.argsFile.textContent = project.file;
      elements.argsInput.value = "";
    },

    /** Los pasos: lee el detalle, escribe tu programa y pasa las comprobaciones. */
    renderSteps({ started, done }) {
      if (!project) return;
      const current = done ? 3 : started ? 2 : 1;
      const steps = ["lee el detalle", "escribe tu programa", "pasa las comprobaciones"];
      elements.steps.innerHTML = steps
        .map((text, index) => {
          const number = index + 1;
          const state =
            done || number < current ? "done" : number === current ? "current" : "pending";
          return `<li class="project-steps__step project-steps__step--${state}"${state === "current" ? ' aria-current="step"' : ""}><span class="project-steps__number">${state === "done" ? "✓" : number}</span>${text}</li>`;
        })
        .join("");
    },

    /** sys.argv para ejecutar el programa: su nombre y lo que se escribió en la línea de argumentos. */
    argv: () => (project?.cli ? [project.file, ...splitArgs(elements.argsInput.value)] : undefined),

    /** Para que Ctrl + Enter en la línea de argumentos también ejecute. */
    onArgsEnter(callback) {
      elements.argsInput.addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
          event.preventDefault();
          callback();
        }
      });
    },
  };
}
