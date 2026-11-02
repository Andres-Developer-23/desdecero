/* Piezas de texto que comparten varias vistas: barras de progreso y duraciones. */

import { pad2, splitMinutes } from "../lib/dates.js";

/** Barra de progreso dibujada con caracteres: ████░░░░ */
export function asciiBar(fraction, width) {
  const filled = Math.round(fraction * width);
  return `<span class="ascii-bar">${"█".repeat(filled)}<span class="ascii-bar__empty">${"░".repeat(width - filled)}</span></span>`;
}

/** 345 → "5 h 45 min", 20 → "20 min" */
export function formatDuration(totalMinutes) {
  const { hours, minutes } = splitMinutes(totalMinutes);
  if (!hours) return `${minutes} min`;
  return minutes ? `${hours} h ${pad2(minutes)} min` : `${hours} h`;
}

/** "1 día", "3 días" */
export const plural = (count, singular, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;

/** Cómo se escribiría la orden en una terminal: python tareas.py agregar "Comprar pan". */
export function commandLine(argv) {
  const quote = (arg) => (arg === "" || /[\s"']/.test(arg) ? `"${arg.replace(/"/g, '\\"')}"` : arg);
  return `python ${argv.map(quote).join(" ")}`;
}

/**
 * Separa los argumentos escritos como en una terminal: agregar "Comprar pan" 3
 * → ["agregar", "Comprar pan", "3"]. Las comillas (dobles o simples) agrupan.
 */
export function splitArgs(text) {
  const args = [];
  let current = "";
  let started = false;
  let quote = null;
  for (const char of text) {
    if (quote) {
      if (char === quote) quote = null;
      else current += char;
    } else if (char === '"' || char === "'") {
      quote = char;
      started = true;
    } else if (/\s/.test(char)) {
      if (started) args.push(current);
      current = "";
      started = false;
    } else {
      current += char;
      started = true;
    }
  }
  if (started) args.push(current);
  return args;
}
