/*
 * Terminal de salida: muestra lo que imprime el programa, pide datos para
 * input() y explica los errores.
 */

import { explainError } from "../python/errors.js";

/**
 * Tipos de línea y su clase CSS (ver styles/components/console.css).
 * "output" es la salida normal del programa y no lleva clase.
 */
const KIND_CLASS = {
  output: "",
  system: "out--system",
  input: "out--input",
  error: "out--error",
  explanation: "out--explanation",
  ok: "out--ok",
  pass: "out--pass",
  fail: "out--fail",
};

/**
 * @param {HTMLElement} element
 * @param {{onWrite?: () => void}} [options] onWrite avisa cada vez que se añade algo.
 */
export function createTerminal(element, { onWrite } = {}) {
  const scrollToEnd = () => {
    element.scrollTop = element.scrollHeight;
    onWrite?.();
  };

  /** Añade texto; si el último fragmento es del mismo tipo, lo continúa. */
  function write(text, kind = "output") {
    if (!text) return;
    const className = KIND_CLASS[kind] ?? "";
    const last = element.lastChild;
    const canAppend =
      last?.nodeType === Node.ELEMENT_NODE &&
      last.tagName === "SPAN" &&
      last.className === className &&
      !last.dataset.closed;
    if (canAppend) {
      last.textContent += text;
    } else {
      const span = document.createElement("span");
      span.className = className;
      span.textContent = text;
      element.appendChild(span);
    }
    scrollToEnd();
  }

  function ensureNewline() {
    const text = element.textContent;
    if (text && !text.endsWith("\n")) write("\n");
  }

  function line(text, kind) {
    ensureNewline();
    write(`${text}\n`, kind);
  }

  /** Escribe una respuesta de input() en su propio fragmento, para que no se mezcle. */
  function writeAnswer(value) {
    const span = document.createElement("span");
    span.className = KIND_CLASS.input;
    span.dataset.closed = "true";
    span.textContent = `${value}\n`;
    element.appendChild(span);
    scrollToEnd();
  }

  return {
    element,
    write,
    line,
    ensureNewline,

    clear() {
      element.textContent = "";
    },

    /** Muestra el mensaje de input() y la respuesta fija que usa una prueba. */
    echoInput(prompt, value) {
      write(prompt);
      writeAnswer(value);
    },

    /** Muestra un campo para que el usuario responda a input(). */
    prompt(promptText) {
      return new Promise((resolve) => {
        write(promptText);
        const form = document.createElement("form");
        form.className = "console__stdin";
        const input = document.createElement("input");
        input.type = "text";
        input.id = `stdin-${Math.random().toString(36).slice(2, 8)}`;
        input.autocomplete = "off";
        input.spellcheck = false;
        input.setAttribute(
          "aria-label",
          promptText ? `Respuesta para: ${promptText.trim()}` : "Entrada para input()",
        );
        form.appendChild(input);
        element.appendChild(form);
        scrollToEnd();
        setTimeout(() => input.focus({ preventScroll: true }), 30);

        form.addEventListener("submit", (event) => {
          event.preventDefault();
          form.remove();
          writeAnswer(input.value);
          resolve(input.value);
        });
      });
    },

    /** Quita los campos de entrada que hayan quedado sin responder. */
    dropPrompts() {
      element.querySelectorAll(".console__stdin").forEach((form) => form.remove());
    },

    /** Explica un error de Python: tipo, línea, mensaje y una ayuda en español. */
    showError(error) {
      ensureNewline();
      const where = error.line ? ` en la línea ${error.line}` : "";
      line(`✗ ${error.type}${where}`, "error");
      if (error.message && error.type !== "TimeLimitError") line(`  ${error.message}`, "error");
      const explanation = explainError(error);
      if (explanation) line(`  → ${explanation}`, "explanation");
    },
  };
}
