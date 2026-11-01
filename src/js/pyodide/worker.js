/*
 * El código del Web Worker donde corre Pyodide (Python completo compilado a
 * WebAssembly). Así un programa largo no bloquea la página y se puede
 * detener: basta con terminar el worker.
 *
 * pyodideWorker() se convierte en texto y se carga desde un Blob (la página
 * es un solo archivo), así que no puede usar nada de fuera de la función. Es
 * un worker de tipo módulo: Pyodide ya no funciona en los clásicos.
 *
 * Mensajes que recibe:
 *   {type: "init", indexURL, runnerSource, packages}
 *   {type: "run", code, files, databases, inputs, packages, modules}
 *   {type: "preload", packages, modules} (carga paquetes por adelantado, sin avisar)
 * Mensajes que envía:
 *   {type: "ready"} · {type: "init-error", message} · {type: "status", text}
 *   {type: "started"} · {type: "stdout" | "stderr", text} · {type: "echo", prompt, value}
 *   {type: "figure", image} (un gráfico en PNG, en base64, al llamar a plt.show())
 *   {type: "done", result}
 */

export function pyodideWorker() {
  let pyodide = null;
  let runner = null;

  const post = (message) => self.postMessage(message);

  /** La salida del programa se envía a la página a medida que se escribe. */
  function stream(type) {
    const decoder = new TextDecoder();
    return {
      write(buffer) {
        const text = decoder.decode(buffer, { stream: true });
        if (text) post({ type, text });
        return buffer.length;
      },
    };
  }

  async function init({ indexURL, runnerSource }) {
    try {
      const { loadPyodide } = await import(`${indexURL}pyodide.mjs`);
      pyodide = await loadPyodide({
        indexURL,
        env: { HOME: "/home/pyodide", MPLBACKEND: "Agg" },
      });
      pyodide.setStdout(stream("stdout"));
      pyodide.setStderr(stream("stderr"));
      const namespace = pyodide.globals.get("dict")();
      pyodide.runPython(runnerSource, { globals: namespace });
      runner = { prepare: namespace.get("prepare"), run: namespace.get("run") };
      post({ type: "ready" });
    } catch (error) {
      post({ type: "init-error", message: String(error?.message ?? error) });
    }
  }

  async function run({ code, files, databases, inputs, packages, modules }) {
    try {
      if (packages.length) {
        await pyodide.loadPackage(packages, {
          messageCallback: (text) => post({ type: "status", text }),
          errorCallback: (text) => post({ type: "status", text }),
        });
      }
      runner.prepare(pyodide.toPy(modules));
    } catch (error) {
      post({
        type: "done",
        result: { status: "unavailable", message: String(error?.message ?? error) },
      });
      return;
    }
    post({ type: "started" });
    const echo = (prompt, value) => post({ type: "echo", prompt, value });
    const onFigure = (image) => post({ type: "figure", image });
    // undefined llega a Python como None (null llegaría como JsNull).
    const args = [
      pyodide.toPy(files),
      pyodide.toPy(databases),
      inputs ? pyodide.toPy(inputs) : undefined,
    ];
    let result;
    try {
      const proxy = runner.run(code, ...args, echo, onFigure);
      result = proxy.toJs({ dict_converter: Object.fromEntries });
      proxy.destroy();
    } catch (error) {
      // Un fallo del propio Pyodide (por ejemplo, sin memoria), no del programa.
      result = {
        status: "error",
        error: { type: "Error", message: String(error?.message ?? error), line: null, frames: [] },
        figures: [],
        files: [],
        unshown: 0,
      };
    } finally {
      for (const arg of args) arg?.destroy();
    }
    post({ type: "done", result });
  }

  /** Adelanta la descarga y la importación de los paquetes mientras el alumno lee. */
  async function preload({ packages, modules }) {
    try {
      await pyodide.loadPackage(packages, { messageCallback: () => {}, errorCallback: () => {} });
      runner.prepare(pyodide.toPy(modules));
    } catch {
      // Si falla, se volverá a intentar al ejecutar, y ahí se explica.
    }
  }

  self.onmessage = (event) => {
    const message = event.data;
    if (message.type === "init") init(message);
    else if (message.type === "run") run(message);
    else if (message.type === "preload") preload(message);
  };
}
