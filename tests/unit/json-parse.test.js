import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  JsonNumber,
  JsonObject,
  JsonSyntaxError,
  encodeJsonString,
  parseJson,
} from "../../src/js/python/json-parse.js";

/** Convierte el resultado en datos simples para compararlo fácilmente. */
function plain(value) {
  if (value instanceof JsonNumber) return `${value.isFloat ? "float" : "int"}:${value.text}`;
  if (value instanceof JsonObject) return { pares: value.pairs.map(([k, v]) => [k, plain(v)]) };
  if (Array.isArray(value)) return value.map(plain);
  return value;
}

/** Mensaje y posición del error, como los da CPython. */
function failure(text) {
  try {
    parseJson(text);
  } catch (error) {
    assert.ok(error instanceof JsonSyntaxError);
    return [error.msg, error.pos];
  }
  assert.fail(`${JSON.stringify(text)} debería ser inválido`);
}

describe("analizador de JSON", () => {
  test("lee objetos, listas, textos y constantes", () => {
    assert.deepEqual(plain(parseJson('{"a": [1, "dos", null, true, false]}')), {
      pares: [["a", ["int:1", "dos", null, true, false]]],
    });
    assert.deepEqual(plain(parseJson(" [ ] ")), []);
    assert.deepEqual(plain(parseJson("{}")), { pares: [] });
  });

  test("distingue enteros de decimales y conserva el texto del número", () => {
    assert.deepEqual(plain(parseJson("[1, 1.0, -0, -1.5e3, 1E2, 12345678901234567890]")), [
      "int:1",
      "float:1.0",
      "int:-0",
      "float:-1.5e3",
      "float:1E2",
      "int:12345678901234567890",
    ]);
  });

  test("acepta NaN, Infinity y -Infinity como CPython", () => {
    assert.ok(Number.isNaN(parseJson("NaN")));
    assert.deepEqual(parseJson("[Infinity, -Infinity]"), [Infinity, -Infinity]);
  });

  test("conserva las claves repetidas en orden (Python se queda con la última)", () => {
    assert.deepEqual(plain(parseJson('{"a": 1, "a": 2}')).pares, [
      ["a", "int:1"],
      ["a", "int:2"],
    ]);
  });

  test("interpreta los escapes, incluidos los pares sustitutos", () => {
    assert.equal(parseJson('"a\\u00f1o \\n \\" \\/ \\\\"'), 'año \n " / \\');
    assert.equal(parseJson('"\\ud83d\\ude00"'), "😀");
  });

  test("da el mensaje y la posición de CPython cuando el texto no es válido", () => {
    assert.deepEqual(failure(""), ["Expecting value", 0]);
    assert.deepEqual(failure("   "), ["Expecting value", 3]);
    assert.deepEqual(failure("{"), ["Expecting property name enclosed in double quotes", 1]);
    assert.deepEqual(failure("{'a': 1}"), ["Expecting property name enclosed in double quotes", 1]);
    assert.deepEqual(failure('{"a" 1}'), ["Expecting ':' delimiter", 5]);
    assert.deepEqual(failure("[1 2]"), ["Expecting ',' delimiter", 3]);
    assert.deepEqual(failure('{"a": [1, 2}'), ["Expecting ',' delimiter", 11]);
    assert.deepEqual(failure('{"a": 1,}'), ["Illegal trailing comma before end of object", 7]);
    assert.deepEqual(failure("[1, 2,]"), ["Illegal trailing comma before end of array", 5]);
    assert.deepEqual(failure("[1, 2] x"), ["Extra data", 7]);
    assert.deepEqual(failure("01"), ["Extra data", 1]);
    assert.deepEqual(failure('"abc'), ["Unterminated string starting at", 0]);
    assert.deepEqual(failure('"a\tb"'), ["Invalid control character at", 2]);
    assert.deepEqual(failure('"\\x"'), ["Invalid \\escape", 1]);
    assert.deepEqual(failure('"\\u12"'), ["Invalid \\uXXXX escape", 2]);
    assert.deepEqual(failure("tru"), ["Expecting value", 0]);
  });
});

describe("codificación de textos", () => {
  test("escapa comillas, barras y caracteres de control", () => {
    assert.equal(
      encodeJsonString('di "hola"\\\n\t\u0001', true),
      '"di \\"hola\\"\\\\\\n\\t\\u0001"',
    );
  });

  test("con ensure_ascii escribe lo que no es ASCII como \\uXXXX", () => {
    assert.equal(encodeJsonString("año 😀", true), '"a\\u00f1o \\ud83d\\ude00"');
    assert.equal(encodeJsonString("año 😀", false), '"año 😀"');
  });
});
