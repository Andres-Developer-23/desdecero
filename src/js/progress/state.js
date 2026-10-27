/*
 * Estado del progreso y operaciones puras sobre él.
 *
 * Forma del estado:
 *   {
 *     completed: { [lessonId]: "AAAA-MM-DD" },  // día en que se completó
 *     days: ["AAAA-MM-DD", ...],                  // días con actividad, ordenados
 *     updatedAt: number                           // marca de tiempo del último cambio
 *   }
 */

import { addDays, isDayKey } from "../lib/dates.js";

const MAX_DAYS = 400;

export const emptyState = () => ({ completed: {}, days: [], updatedAt: 0 });

/** Limpia un estado que viene de fuera (almacenamiento, red) y descarta lo que no es válido. */
export function sanitizeState(raw, validLessonIds) {
  const state = emptyState();
  if (!raw || typeof raw !== "object") return state;

  if (raw.completed && typeof raw.completed === "object") {
    for (const [id, day] of Object.entries(raw.completed)) {
      if (validLessonIds.has(id) && isDayKey(day)) state.completed[id] = day;
    }
  }
  if (Array.isArray(raw.days)) state.days = uniqueSortedDays(raw.days.filter(isDayKey));
  if (typeof raw.updatedAt === "number") state.updatedAt = raw.updatedAt;
  return state;
}

/**
 * Une dos estados sin perder nada: una lección completada en cualquiera de
 * los dos queda completada (con la fecha más antigua) y se juntan los días.
 */
export function mergeStates(a, b, validLessonIds) {
  const left = sanitizeState(a, validLessonIds);
  const right = sanitizeState(b, validLessonIds);
  const completed = { ...left.completed };
  for (const [id, day] of Object.entries(right.completed)) {
    if (!completed[id] || day < completed[id]) completed[id] = day;
  }
  return {
    completed,
    days: uniqueSortedDays([...left.days, ...right.days]),
    updatedAt: Math.max(left.updatedAt, right.updatedAt),
  };
}

/** Compara dos estados ignorando updatedAt. */
export function sameProgress(a, b) {
  const key = (state) =>
    JSON.stringify([
      Object.keys(state.completed)
        .sort()
        .map((id) => `${id}=${state.completed[id]}`),
      state.days,
    ]);
  return key(a) === key(b);
}

/**
 * Días seguidos con actividad hasta hoy. Si hoy todavía no hay actividad,
 * la racha cuenta hasta ayer: no se pierde hasta que acaba el día.
 */
export function computeStreak(days, today) {
  const active = new Set(days);
  let day = active.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (active.has(day)) {
    streak += 1;
    day = addDays(day, -1);
  }
  return streak;
}

/** Convierte el formato de la versión 1.0 ({completadas, dias, t}) al actual. */
export function migrateLegacyState(legacy) {
  if (!legacy || typeof legacy !== "object") return null;
  return { completed: legacy.completadas, days: legacy.dias, updatedAt: legacy.t };
}

function uniqueSortedDays(days) {
  return [...new Set(days)].sort().slice(-MAX_DAYS);
}
