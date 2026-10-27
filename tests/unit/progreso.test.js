import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  computeStreak,
  mergeStates,
  migrateLegacyState,
  sameProgress,
  sanitizeState,
} from "../../src/js/progress/state.js";

const ids = new Set(["hola-mundo", "calculadora", "errores"]);

describe("racha", () => {
  test("cuenta los días seguidos hasta hoy", () => {
    assert.equal(computeStreak(["2026-10-25", "2026-10-26", "2026-10-27"], "2026-10-27"), 3);
  });

  test("si hoy aún no hay actividad, la racha cuenta hasta ayer", () => {
    assert.equal(computeStreak(["2026-10-25", "2026-10-26"], "2026-10-27"), 2);
  });

  test("un día sin práctica corta la racha", () => {
    assert.equal(computeStreak(["2026-10-23", "2026-10-26", "2026-10-27"], "2026-10-27"), 2);
    assert.equal(computeStreak(["2026-10-20"], "2026-10-27"), 0);
  });
});

describe("estado del progreso", () => {
  test("sanitizeState descarta lecciones y fechas que no son válidas", () => {
    const state = sanitizeState(
      {
        completed: { "hola-mundo": "2026-10-27", inventada: "2026-10-27", errores: "ayer" },
        days: ["2026-10-27", "2026-10-26", "2026-10-27", "mal"],
        updatedAt: 5,
      },
      ids,
    );
    assert.deepEqual(state, {
      completed: { "hola-mundo": "2026-10-27" },
      days: ["2026-10-26", "2026-10-27"],
      updatedAt: 5,
    });
  });

  test("sanitizeState devuelve un estado vacío si recibe basura", () => {
    assert.deepEqual(sanitizeState("hola", ids), { completed: {}, days: [], updatedAt: 0 });
  });

  test("mergeStates no pierde nada y conserva la fecha más antigua", () => {
    const merged = mergeStates(
      { completed: { "hola-mundo": "2026-10-27" }, days: ["2026-10-27"], updatedAt: 1 },
      {
        completed: { "hola-mundo": "2026-10-20", calculadora: "2026-10-21" },
        days: ["2026-10-20"],
        updatedAt: 2,
      },
      ids,
    );
    assert.deepEqual(merged, {
      completed: { "hola-mundo": "2026-10-20", calculadora: "2026-10-21" },
      days: ["2026-10-20", "2026-10-27"],
      updatedAt: 2,
    });
  });

  test("sameProgress ignora updatedAt", () => {
    const a = { completed: { errores: "2026-10-27" }, days: ["2026-10-27"], updatedAt: 1 };
    assert.equal(sameProgress(a, { ...a, updatedAt: 99 }), true);
    assert.equal(sameProgress(a, { ...a, days: [] }), false);
  });

  test("migrateLegacyState convierte el formato de la versión 1.0", () => {
    const legacy = { completadas: { errores: "2026-10-26" }, dias: ["2026-10-26"], t: 7 };
    assert.deepEqual(migrateLegacyState(legacy), {
      completed: { errores: "2026-10-26" },
      days: ["2026-10-26"],
      updatedAt: 7,
    });
    assert.equal(migrateLegacyState(null), null);
  });
});
