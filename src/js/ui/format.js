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
