import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { addDays, formatDayKey, isDayKey, splitMinutes, toDayKey } from "../../src/js/lib/dates.js";

describe("fechas", () => {
  test("toDayKey usa la fecha local con ceros a la izquierda", () => {
    assert.equal(toDayKey(new Date(2026, 0, 5)), "2026-01-05");
  });

  test("addDays cruza meses y años", () => {
    assert.equal(addDays("2026-03-01", -1), "2026-02-28");
    assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  });

  test("isDayKey solo acepta el formato AAAA-MM-DD", () => {
    assert.equal(isDayKey("2026-10-27"), true);
    assert.equal(isDayKey("27/10/2026"), false);
    assert.equal(isDayKey(20261027), false);
  });

  test("formatDayKey muestra día/mes/año", () => {
    assert.equal(formatDayKey("2026-10-27"), "27/10/2026");
  });

  test("splitMinutes separa horas y minutos", () => {
    assert.deepEqual(splitMinutes(345), { hours: 5, minutes: 45 });
    assert.deepEqual(splitMinutes(20), { hours: 0, minutes: 20 });
  });
});
