/*
 * Fechas como claves de día "AAAA-MM-DD" en la zona horaria local.
 * Funciones puras: no dependen del navegador y se prueban en tests/unit.
 */

export const pad2 = (number) => String(number).padStart(2, "0");

export const toDayKey = (date) =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const todayKey = () => toDayKey(new Date());

export const isDayKey = (value) => typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);

/** Suma (o resta) días a una clave de día. */
export function addDays(dayKey, amount) {
  const [year, month, day] = dayKey.split("-").map(Number);
  return toDayKey(new Date(year, month - 1, day + amount));
}

/** "2026-10-27" → "27/10/2026" */
export const formatDayKey = (dayKey) => dayKey.split("-").reverse().join("/");

/** 345 → { hours: 5, minutes: 45 } */
export const splitMinutes = (total) => ({ hours: Math.floor(total / 60), minutes: total % 60 });
