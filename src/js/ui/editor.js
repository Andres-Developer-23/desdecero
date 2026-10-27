/*
 * Editor de código. Usa CodeMirror si está cargado y, si no, un textarea
 * con las mismas operaciones, para que la lección funcione igual.
 */

import { EDITOR_LOAD_TIMEOUT_MS } from "../config.js";
import { wait } from "../lib/async.js";
import { loadEditorLibrary } from "../python/libraries.js";

/**
 * @typedef {object} Editor
 * @property {"codemirror" | "textarea"} kind
 * @property {() => string} getValue
 * @property {(value: string) => void} setValue Cambia el contenido sin avisar a onChange.
 * @property {(line: number | null) => void} markErrorLine Resalta una línea (1 = primera) o quita el resaltado.
 * @property {() => void} refresh
 * @property {() => void} focus
 */

/**
 * @param {HTMLElement} host
 * @param {{value: string, label: string, onRun: () => void, onChange?: (value: string) => void}} options
 * @returns {Editor}
 */
export function createEditor(host, options) {
  host.textContent = "";
  return hasCodeMirror()
    ? createCodeMirrorEditor(host, options)
    : createTextareaEditor(host, options);
}

export const hasCodeMirror = () => Boolean(window.CodeMirror?.modes?.python);

/** Espera a CodeMirror, pero no más de unos segundos: después se usa el textarea. */
export const waitForEditorLibrary = () =>
  Promise.race([loadEditorLibrary(), wait(EDITOR_LOAD_TIMEOUT_MS)]);

/** Hay que crear el editor si aún no existe o si es el textarea y CodeMirror ya cargó. */
export const needsNewEditor = (editor) =>
  !editor || (editor.kind === "textarea" && hasCodeMirror());

function createCodeMirrorEditor(host, { value, label, onRun, onChange }) {
  const cm = window.CodeMirror(host, {
    value,
    theme: "pdc",
    mode: { name: "python", version: 3, singleLineStringErrors: false },
    lineNumbers: true,
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    smartIndent: true,
    matchBrackets: true,
    autoCloseBrackets: true,
    inputStyle: "contenteditable",
    screenReaderLabel: label,
    extraKeys: {
      "Ctrl-Enter": () => onRun(),
      "Cmd-Enter": () => onRun(),
      Tab: (editor) => {
        if (editor.somethingSelected()) editor.indentSelection("add");
        else editor.replaceSelection("    ", "end");
      },
      "Shift-Tab": (editor) => editor.indentSelection("subtract"),
      Esc: (editor) => editor.getInputField().blur(),
    },
  });

  let errorLine = null;
  let silent = false;

  const clearErrorLine = () => {
    if (errorLine === null) return;
    cm.removeLineClass(errorLine, "background", "editor__error-line");
    errorLine = null;
  };

  cm.on("change", () => {
    clearErrorLine();
    if (!silent) onChange?.(cm.getValue());
  });

  return {
    kind: "codemirror",
    getValue: () => cm.getValue(),
    setValue(next) {
      silent = true;
      cm.setValue(next);
      cm.clearHistory();
      silent = false;
    },
    markErrorLine(line) {
      clearErrorLine();
      if (!line || line > cm.lineCount()) return;
      errorLine = cm.addLineClass(line - 1, "background", "editor__error-line");
      cm.scrollIntoView({ line: line - 1, ch: 0 }, 60);
    },
    refresh: () => cm.refresh(),
    focus: () => cm.focus(),
  };
}

function createTextareaEditor(host, { value, label, onRun, onChange }) {
  const textarea = document.createElement("textarea");
  textarea.className = "editor__textarea";
  textarea.id = `${host.id}-textarea`;
  textarea.spellcheck = false;
  textarea.value = value;
  textarea.setAttribute("aria-label", label);

  textarea.addEventListener("keydown", (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      onRun();
    } else if (event.key === "Tab" && !event.shiftKey) {
      event.preventDefault();
      textarea.setRangeText("    ", textarea.selectionStart, textarea.selectionEnd, "end");
      onChange?.(textarea.value);
    } else if (event.key === "Escape") {
      textarea.blur();
    }
  });
  textarea.addEventListener("input", () => onChange?.(textarea.value));
  host.appendChild(textarea);

  return {
    kind: "textarea",
    getValue: () => textarea.value,
    setValue(next) {
      textarea.value = next;
    },
    markErrorLine() {},
    refresh() {},
    focus: () => textarea.focus(),
  };
}
