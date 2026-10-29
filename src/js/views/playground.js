/* Vista del playground: un editor libre con consola. */

import { STORAGE_KEYS, TIME_LIMIT_MS } from "../config.js";
import { createFletRenderer } from "../flet/renderer.js";
import { sendFletEvent, usesFlet } from "../flet/runtime.js";
import { $ } from "../lib/dom.js";
import { storage } from "../lib/storage.js";
import { stopPython } from "../python/engine.js";
import { usesScraping } from "../scraping/detect.js";
import { onScrapingRun, virtualWeb } from "../scraping/runtime.js";
import { createWebViewer } from "../scraping/web-viewer.js";
import { createEditor, needsNewEditor, waitForEditorLibrary } from "../ui/editor.js";
import { runInTerminal } from "../ui/run-in-terminal.js";
import { createTerminal } from "../ui/terminal.js";

const SAVE_DELAY_MS = 400;

export const SAMPLE_PROGRAM = `# Playground: escribe lo que quieras y pulsa ejecutar (Ctrl + Enter)
nombre = input("¿Cómo te llamas? ")
print(f"¡Hola, {nombre}! Esto es Python corriendo en tu navegador.")

# Una pirámide con bucles
for i in range(1, 6):
    print(" " * (5 - i) + "*" * (2 * i - 1))

# Un diccionario que cuenta letras
conteo = {}
for letra in nombre.lower():
    if letra.isalpha():
        conteo[letra] = conteo.get(letra, 0) + 1
print(conteo)
`;

/**
 * @param {object} deps
 * @param {ReturnType<import("../progress/progress.js").createProgress>} deps.progress
 */
export function createPlaygroundView({ progress }) {
  const root = $("#view-playground");
  const host = $("#playground-editor");
  const terminal = createTerminal($("#playground-output"));
  const results = $("#playground-results");
  const preview = createFletRenderer($("#playground-preview"), { onEvent: sendFletEvent });
  const webHost = $("#playground-web");
  const webViewer = createWebViewer(webHost, { web: virtualWeb });
  let showsWeb = false;
  let editor = null;
  let saveTimer = null;
  let showing = false;

  const save = (code) => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => storage.set(STORAGE_KEYS.playground, code), SAVE_DELAY_MS);
  };

  const setCode = (code) => {
    editor?.setValue(code);
    storage.set(STORAGE_KEYS.playground, code);
  };

  /** @param {{code?: string}} [params] Código que llega desde "editar en playground". */
  async function show(params = {}) {
    showing = true;
    window.scrollTo(0, 0);
    const fromExample = typeof params.code === "string";
    const code = fromExample
      ? params.code
      : (storage.get(STORAGE_KEYS.playground) ?? SAMPLE_PROGRAM);
    if (fromExample) storage.set(STORAGE_KEYS.playground, code);

    await waitForEditorLibrary();
    if (!showing) return;

    if (needsNewEditor(editor)) {
      editor = createEditor(host, {
        value: code,
        label: "Editor del playground",
        onRun: run,
        onChange: save,
      });
      terminal.clear();
      terminal.line("# la salida de tu programa aparecerá aquí", "system");
    } else if (fromExample) {
      editor.setValue(code);
    }
    if (fromExample) {
      terminal.clear();
      terminal.line("# ejemplo copiado desde la lección. Cámbialo y ejecútalo.", "system");
    }
    requestAnimationFrame(() => editor.refresh());
  }

  function run() {
    if (!editor) return;
    const code = editor.getValue();
    // La vista previa aparece cuando el programa usa Flet, y el navegador cuando pide páginas.
    const flet = usesFlet(code);
    showsWeb = !flet && usesScraping(code);
    results.classList.toggle("pane--with-preview", flet || showsWeb);
    if (!flet) preview.clear();
    if (showsWeb) webViewer.reset(null);
    webHost.hidden = !showsWeb;
    runInTerminal(code, terminal, {
      fileName: "playground.py",
      timeLimitMs: TIME_LIMIT_MS.playground,
      showDuration: true,
      editor,
      preview: flet ? preview : undefined,
      onStart: () => progress.recordActivity(),
    });
  }

  onScrapingRun((lastRun) => {
    if (showing && showsWeb) webViewer.showRun(lastRun);
  });

  const actions = {
    run,
    stop: stopPython,
    "clear-output": () => terminal.clear(),
    "load-sample": () => setCode(SAMPLE_PROGRAM),
    empty: () => {
      setCode("");
      editor?.focus();
    },
  };

  root.addEventListener("click", (event) => {
    const button = event.target.closest("[data-action]");
    actions[button?.dataset.action]?.();
  });

  return {
    root,
    title: "Playground · Python desde Cero",
    show,
    hide: () => {
      showing = false;
    },
  };
}
