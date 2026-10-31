/* Vista de lección: teoría, ejemplos y el ejercicio con su editor y consola. */

import { STORAGE_KEYS, TIME_LIMIT_MS } from "../config.js";
import { lessonPath } from "../course/course.js";
import { checkExercise } from "../exercises/checker.js";
import { createFletRenderer } from "../flet/renderer.js";
import { sendFletEvent } from "../flet/runtime.js";
import { $, escapeHtml } from "../lib/dom.js";
import { formatDayKey, pad2 } from "../lib/dates.js";
import { storage } from "../lib/storage.js";
import { isRunning, stopPython } from "../python/engine.js";
import { onWebRun, viewerRequest, virtualInternet } from "../web/runtime.js";
import { createWebViewer } from "../web/web-viewer.js";
import { createEditor, needsNewEditor, waitForEditorLibrary } from "../ui/editor.js";
import { highlightExamples } from "../ui/examples.js";
import { renderInline, renderMarkdown } from "../ui/markdown.js";
import { runInTerminal } from "../ui/run-in-terminal.js";
import { createTabs } from "../ui/tabs.js";
import { createTerminal } from "../ui/terminal.js";

const DRAFT_SAVE_DELAY_MS = 400;
const SOLUTION_CONFIRM_MS = 3500;

/**
 * @param {object} deps
 * @param {ReturnType<import("../course/course.js").createCourse>} deps.course
 * @param {ReturnType<import("../progress/progress.js").createProgress>} deps.progress
 */
export function createLessonView({ course, progress }) {
  const root = $("#view-lesson");
  const elements = {
    path: $("#lesson-path"),
    meta: $("#lesson-meta"),
    title: $("#lesson-title"),
    summary: $("#lesson-summary"),
    body: $("#lesson-body"),
    toggleDone: $("#lesson-toggle-done"),
    note: $("#lesson-note"),
    back: $("#lesson-back"),
    previous: $("#lesson-previous"),
    next: $("#lesson-next"),
    badge: $("#exercise-badge"),
    task: $("#exercise-task"),
    hint: $("#exercise-hint"),
    editor: $("#exercise-editor"),
    output: $("#exercise-output"),
    outputTitle: $("#exercise-output-title"),
    tabs: $("#exercise-tabs"),
    preview: $("#exercise-preview"),
    web: $("#exercise-web"),
    workbench: $(".workbench"),
    success: $("#exercise-success"),
    successLink: $("#exercise-success-link"),
    solutionButton: $("#exercise-solution"),
  };

  const terminal = createTerminal(elements.output, {
    onWrite: () => tabs.markUnread("output"),
  });
  const preview = createFletRenderer(elements.preview, { onEvent: sendFletEvent });
  const webViewer = createWebViewer(elements.web, {
    internet: virtualInternet,
    send: viewerRequest,
  });
  const tabs = createTabs(
    elements.tabs,
    { preview: elements.preview, web: elements.web, output: elements.output },
    { initial: "output" },
  );
  const drafts = createDraftStore();
  let lesson = null;
  let editor = null;
  let solutionTimer = null;

  /* ---- Mostrar una lección ---- */

  async function show({ lesson: next }) {
    drafts.flush();
    lesson = next;
    window.scrollTo(0, 0);

    renderContent();
    renderStatus();
    resetExercisePanel();

    const code = drafts.load(lesson) ?? lesson.starter;
    await waitForEditorLibrary();
    if (lesson !== next) return; // el usuario cambió de lección mientras cargaba

    // Se crea el editor la primera vez, o se recrea si CodeMirror llegó tarde.
    if (needsNewEditor(editor)) {
      editor = createEditor(elements.editor, {
        value: code,
        label: "Editor del ejercicio",
        onRun: run,
        onChange: (value) => drafts.schedule(lesson, value),
      });
    } else {
      editor.setValue(code);
    }
    requestAnimationFrame(() => editor.refresh());
  }

  function renderContent() {
    const previous = course.previous(lesson);
    const next = course.next(lesson);

    elements.back.href = `#ruta-${lesson.route.id}`;
    elements.back.textContent = `← ${lesson.route.title}`;
    elements.path.innerHTML = `~/rutas/<b>${escapeHtml(lessonPath(lesson))}</b>`;
    elements.title.textContent = lesson.title;
    elements.summary.textContent = lesson.summary;
    elements.body.innerHTML = renderMarkdown(lesson.theory);
    elements.task.innerHTML =
      '<h2 class="workbench__heading">// ejercicio</h2>' +
      renderMarkdown(lesson.exercise, { runnableCode: false });
    highlightExamples(elements.body);

    setPagerLink(elements.previous, previous);
    setPagerLink(elements.next, next);
  }

  function renderStatus() {
    if (!lesson) return;
    const done = progress.isDone(lesson.id);

    elements.meta.innerHTML = [
      `<span>lección ${lesson.number} de ${lesson.route.total}</span>`,
      `<span>módulo ${pad2(lesson.module.index)} · ${escapeHtml(lesson.module.title)}</span>`,
      `<span>~${lesson.minutes} min</span>`,
      done ? '<span class="lesson__done">[x] completada</span>' : "",
    ].join("");
    elements.badge.textContent = done ? "superado" : "pendiente";
    elements.badge.classList.toggle("badge--ok", done);
    elements.toggleDone.textContent = done ? "marcar como pendiente" : "marcar como completada";
    elements.note.textContent = done
      ? `completada el ${formatDayKey(progress.completedOn(lesson.id))}`
      : "o supera el ejercicio y se marcará sola";
  }

  /**
   * Las lecciones de Flet tienen la vista previa de la app; las del simulador web,
   * el navegador de la web de prácticas; las de Python, solo la salida.
   */
  const isFletLesson = () => lesson.route.runtime === "flet";
  const isWebLesson = () => lesson?.route.runtime === "web";

  function resetExercisePanel() {
    const flet = isFletLesson();
    const web = isWebLesson();
    elements.hint.hidden = true;
    elements.success.hidden = true;
    disarmSolutionButton();
    terminal.clear();
    terminal.line(
      flet
        ? "# aquí verás los print() y los errores de tu app."
        : "# pulsa ▶ ejecutar (Ctrl + Enter) para ver aquí la salida,",
      "system",
    );
    if (web) terminal.line("# en «web», las páginas que pida tu programa o tu servidor,", "system");
    terminal.line("# y ✓ comprobar cuando creas que el ejercicio está resuelto.", "system");

    // Se elige la pestaña después de escribir, para no marcar "salida" como pendiente.
    elements.workbench.classList.toggle("workbench--flet", flet);
    elements.workbench.classList.toggle("workbench--web", web);
    elements.tabs.hidden = !flet && !web;
    elements.outputTitle.hidden = flet || web;
    tabs.show(flet ? ["preview", "output"] : web ? ["web", "output"] : ["output"]);
    if (flet) {
      preview.showMessage("▶ ejecuta el código para ver tu app aquí");
      tabs.select("preview");
    } else {
      preview.clear();
      if (web) webViewer.reset(lesson.web);
      tabs.select(web && lesson.web ? "web" : "output");
    }
  }

  /**
   * Al terminar un programa, el navegador enseña las páginas que pidió o, si
   * dejó un servidor de Flask en marcha, la página de la lección en él.
   */
  onWebRun((lastRun) => {
    if (!isWebLesson() || root.hidden) return;
    webViewer.showRun(lastRun, { serverUrl: lesson.web });
    if (lastRun.requests.length || lastRun.server) tabs.markUnread("web");
  });

  /** Los enlaces de la teoría a los sitios de práctica se abren en la pestaña «web». */
  elements.body.addEventListener("click", (event) => {
    const link = event.target.closest("a[data-web-link]");
    if (!link || !isWebLesson()) return;
    event.preventDefault();
    tabs.select("web");
    webViewer.open(link.href);
    elements.web.scrollIntoView({ block: "nearest", behavior: "smooth" });
  });

  /* ---- Acciones ---- */

  function run() {
    if (!editor) return;
    const flet = isFletLesson();
    if (flet) tabs.select("preview");
    if (isWebLesson()) tabs.select("output");
    runInTerminal(editor.getValue(), terminal, {
      fileName: "ejercicio.py",
      timeLimitMs: TIME_LIMIT_MS.lesson,
      showDuration: true,
      editor,
      preview: flet ? preview : undefined,
      onError: () => tabs.select("output"),
      onStart: () => progress.recordActivity(),
    });
  }

  async function check() {
    if (!editor || isRunning()) return;
    const current = lesson;
    editor.markErrorLine(null);
    tabs.select("output");
    terminal.clear();
    progress.recordActivity();

    const result = await checkExercise(current, editor.getValue(), terminal);
    if (result.reason === "busy" || lesson !== current) return;
    if (result.errorLine) editor.markErrorLine(result.errorLine);

    terminal.line("");
    if (!result.passed) {
      terminal.line("Corrige y vuelve a comprobar. Si te atascas, pulsa «pista».", "system");
      return;
    }

    terminal.line("✓ ¡Ejercicio superado!", "pass");
    progress.setDone(current.id, true);
    showSuccess(current);
    if (!course.firstPending(current.route, progress.isDone)) {
      terminal.line(`Has completado la ruta «${current.route.title}». ¡Enhorabuena!`, "ok");
    }
  }

  /** Enlaza con la siguiente lección de la ruta o, al terminarla, con la página de la ruta. */
  function showSuccess(current) {
    const next = course.next(current);
    elements.successLink.href = next ? `#l-${next.id}` : `#ruta-${current.route.id}`;
    elements.successLink.querySelector(".cta__label").textContent = next
      ? `siguiente: ${next.title} →`
      : "ver la ruta completa →";
    elements.success.hidden = false;
  }

  function toggleHint() {
    elements.hint.innerHTML = `<span class="workbench__hint-label">pista</span>${renderInline(lesson.hint)}`;
    elements.hint.hidden = !elements.hint.hidden;
  }

  function resetCode() {
    editor?.setValue(lesson.starter);
    drafts.remove(lesson);
    terminal.clear();
    terminal.line("# código de partida restaurado", "system");
  }

  /** La solución se muestra con dos pulsaciones, para no verla por accidente. */
  function showSolution() {
    if (!elements.solutionButton.dataset.armed) {
      elements.solutionButton.dataset.armed = "true";
      elements.solutionButton.textContent = "¿seguro? pulsa otra vez";
      elements.solutionButton.classList.add("button--armed");
      solutionTimer = setTimeout(disarmSolutionButton, SOLUTION_CONFIRM_MS);
      return;
    }
    disarmSolutionButton();
    editor?.setValue(lesson.solution);
    drafts.save(lesson, lesson.solution);
    terminal.clear();
    terminal.line(
      "# solución cargada. Léela línea a línea y ejecútala para ver qué hace.",
      "system",
    );
  }

  function disarmSolutionButton() {
    clearTimeout(solutionTimer);
    delete elements.solutionButton.dataset.armed;
    elements.solutionButton.textContent = "solución";
    elements.solutionButton.classList.remove("button--armed");
  }

  function toggleDone() {
    progress.setDone(lesson.id, !progress.isDone(lesson.id));
  }

  const actions = {
    run,
    check,
    stop: stopPython,
    hint: toggleHint,
    solution: showSolution,
    reset: resetCode,
    "clear-output": () => terminal.clear(),
    "toggle-done": toggleDone,
  };

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    const action = button && actions[button.dataset.action];
    if (action && lesson) action();
  });

  return {
    root,
    get title() {
      return lesson ? `${lesson.title} · Python desde Cero` : "Python desde Cero";
    },
    show,
    hide: () => drafts.flush(),
    refresh: renderStatus,
  };
}

/* ---- Auxiliares ---- */

function setPagerLink(link, lesson) {
  link.hidden = !lesson;
  if (!lesson) return;
  link.href = `#l-${lesson.id}`;
  link.querySelector(".pager__title").textContent = `${pad2(lesson.number)} · ${lesson.title}`;
}

/**
 * Borradores del código de cada lección en localStorage. Se guardan con un
 * pequeño retraso mientras se escribe; si el código vuelve a ser el de
 * partida, se borra el borrador.
 */
function createDraftStore() {
  let pending = null;

  const save = (lesson, code) => {
    if (code === lesson.starter) storage.remove(STORAGE_KEYS.draft(lesson.id));
    else storage.set(STORAGE_KEYS.draft(lesson.id), code);
  };

  return {
    load: (lesson) => storage.get(STORAGE_KEYS.draft(lesson.id)),
    save,
    remove: (lesson) => storage.remove(STORAGE_KEYS.draft(lesson.id)),

    schedule(lesson, code) {
      clearTimeout(pending?.timer);
      pending = { lesson, code, timer: setTimeout(() => this.flush(), DRAFT_SAVE_DELAY_MS) };
    },

    /** Guarda ya el borrador pendiente, por ejemplo antes de cambiar de lección. */
    flush() {
      if (!pending) return;
      clearTimeout(pending.timer);
      save(pending.lesson, pending.code);
      pending = null;
    },
  };
}
