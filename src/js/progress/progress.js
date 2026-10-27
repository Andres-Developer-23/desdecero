/*
 * Progreso del alumno: lecciones completadas y días con actividad.
 * Se guarda en localStorage y avisa con el evento "change" cada vez que cambia.
 */

import { STORAGE_KEYS } from "../config.js";
import { todayKey } from "../lib/dates.js";
import { createEmitter } from "../lib/events.js";
import { storage } from "../lib/storage.js";
import { computeStreak, emptyState, migrateLegacyState, sanitizeState } from "./state.js";

export function createProgress(lessonIds) {
  const validIds = new Set(lessonIds);
  const emitter = createEmitter();
  let state = load();

  function load() {
    const saved = storage.getJSON(STORAGE_KEYS.progress);
    if (saved) return sanitizeState(saved, validIds);
    const legacy = migrateLegacyState(storage.getJSON(STORAGE_KEYS.legacyProgress));
    return legacy ? sanitizeState(legacy, validIds) : emptyState();
  }

  function commit() {
    state.updatedAt = Date.now();
    storage.setJSON(STORAGE_KEYS.progress, state);
    emitter.emit("change", snapshot());
  }

  function addToday() {
    const today = todayKey();
    if (state.days.includes(today)) return false;
    state.days = [...state.days, today].sort();
    return true;
  }

  function snapshot() {
    return structuredClone(state);
  }

  return {
    on: emitter.on,
    snapshot,

    isDone: (lessonId) => Boolean(state.completed[lessonId]),
    completedOn: (lessonId) => state.completed[lessonId] ?? null,
    completedCount: () => Object.keys(state.completed).length,
    activeDays: () => [...state.days],
    streak: () => computeStreak(state.days, todayKey()),

    /** Marca o desmarca una lección como completada. */
    setDone(lessonId, done) {
      if (!validIds.has(lessonId) || Boolean(state.completed[lessonId]) === done) return;
      if (done) {
        state.completed[lessonId] = todayKey();
        addToday();
      } else {
        delete state.completed[lessonId];
      }
      commit();
    },

    /** Registra que hoy hubo práctica (ejecutar o comprobar código). */
    recordActivity() {
      if (addToday()) commit();
    },

    /** Sustituye el estado completo, por ejemplo al traerlo de la cuenta. */
    replace(next) {
      state = sanitizeState(next, validIds);
      storage.setJSON(STORAGE_KEYS.progress, state);
      emitter.emit("change", snapshot());
    },

    validIds,
  };
}
