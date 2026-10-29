/*
 * Analizador de JSON para el módulo json del curso (src/python/json/).
 *
 * Sigue las reglas del decodificador de CPython 3.13: acepta NaN e
 * Infinity, distingue enteros (1) de decimales (1.0) y, si el texto no es
 * válido, da el mismo mensaje y la misma posición que CPython ("Expecting
 * value", "Expecting ',' delimiter"...).
 *
 * No depende del navegador: se prueba en tests/unit.
 */

/** Un número tal como se escribió, para que Python decida si es int o float. */
export class JsonNumber {
  constructor(text, isFloat) {
    this.text = text;
    this.isFloat = isFloat;
  }
}

/** Un objeto JSON: lista de pares en orden (puede repetir claves, como en el texto). */
export class JsonObject {
  constructor(pairs) {
    this.pairs = pairs;
  }
}

/** Error de sintaxis con el mensaje de CPython y la posición (índice en el texto). */
export class JsonSyntaxError extends Error {
  constructor(msg, pos) {
    super(msg);
    this.msg = msg;
    this.pos = pos;
  }
}

const WHITESPACE = new Set([" ", "\t", "\n", "\r"]);
const NUMBER = /^-?(?:0|[1-9]\d*)(\.\d+)?([eE][-+]?\d+)?/;
const ESCAPES = { '"': '"', "\\": "\\", "/": "/", b: "\b", f: "\f", n: "\n", r: "\r", t: "\t" };
const CONSTANTS = [
  ["null", null],
  ["true", true],
  ["false", false],
  ["NaN", NaN],
  ["Infinity", Infinity],
  ["-Infinity", -Infinity],
];

/**
 * Analiza un texto JSON completo.
 * @param {string} text
 * @returns {null | boolean | number | string | JsonNumber | JsonObject | Array<unknown>}
 *   NaN e Infinity llegan como number; el resto de números, como JsonNumber.
 */
export function parseJson(text) {
  let pos = skip(text, 0);
  const [value, end] = parseValue(text, pos);
  pos = skip(text, end);
  if (pos !== text.length) throw new JsonSyntaxError("Extra data", pos);
  return value;
}

function skip(text, pos) {
  while (pos < text.length && WHITESPACE.has(text[pos])) pos++;
  return pos;
}

function parseValue(text, pos) {
  const char = text[pos];
  if (char === '"') return parseString(text, pos + 1);
  if (char === "{") return parseObject(text, pos + 1);
  if (char === "[") return parseArray(text, pos + 1);
  for (const [word, value] of CONSTANTS) {
    if (text.startsWith(word, pos)) return [value, pos + word.length];
  }
  const match = NUMBER.exec(text.slice(pos, pos + 400));
  if (match) {
    return [new JsonNumber(match[0], Boolean(match[1] || match[2])), pos + match[0].length];
  }
  throw new JsonSyntaxError("Expecting value", pos);
}

function parseString(text, start) {
  let result = "";
  let pos = start;
  while (true) {
    if (pos >= text.length) throw new JsonSyntaxError("Unterminated string starting at", start - 1);
    const char = text[pos];
    if (char === '"') return [result, pos + 1];
    if (char === "\\") {
      const next = text[pos + 1];
      if (next === undefined) {
        throw new JsonSyntaxError("Unterminated string starting at", start - 1);
      }
      if (next === "u") {
        const [code, end] = parseUnicodeEscape(text, pos);
        result += code;
        pos = end;
        continue;
      }
      if (!(next in ESCAPES)) throw new JsonSyntaxError("Invalid \\escape", pos);
      result += ESCAPES[next];
      pos += 2;
      continue;
    }
    if (char < " ") throw new JsonSyntaxError("Invalid control character at", pos);
    result += char;
    pos++;
  }
}

function readHex(text, pos) {
  const hex = text.slice(pos + 2, pos + 6);
  if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new JsonSyntaxError("Invalid \\uXXXX escape", pos + 1);
  return parseInt(hex, 16);
}

/** \uXXXX, uniendo los pares sustitutos (😀) como hace CPython. */
function parseUnicodeEscape(text, pos) {
  const first = readHex(text, pos);
  if (first >= 0xd800 && first <= 0xdbff && text.startsWith("\\u", pos + 6)) {
    const second = readHex(text, pos + 6);
    if (second >= 0xdc00 && second <= 0xdfff) {
      return [String.fromCharCode(first, second), pos + 12];
    }
  }
  return [String.fromCharCode(first), pos + 6];
}

function parseObject(text, start) {
  const pairs = [];
  let pos = skip(text, start);
  if (text[pos] === "}") return [new JsonObject(pairs), pos + 1];
  while (true) {
    if (text[pos] !== '"') {
      throw new JsonSyntaxError("Expecting property name enclosed in double quotes", pos);
    }
    const [key, afterKey] = parseString(text, pos + 1);
    pos = skip(text, afterKey);
    if (text[pos] !== ":") throw new JsonSyntaxError("Expecting ':' delimiter", pos);
    pos = skip(text, pos + 1);
    const [value, afterValue] = parseValue(text, pos);
    pairs.push([key, value]);
    pos = skip(text, afterValue);
    if (text[pos] === "}") return [new JsonObject(pairs), pos + 1];
    if (text[pos] !== ",") throw new JsonSyntaxError("Expecting ',' delimiter", pos);
    const comma = pos;
    pos = skip(text, pos + 1);
    if (text[pos] === "}") {
      throw new JsonSyntaxError("Illegal trailing comma before end of object", comma);
    }
  }
}

function parseArray(text, start) {
  const items = [];
  let pos = skip(text, start);
  if (text[pos] === "]") return [items, pos + 1];
  while (true) {
    const [value, afterValue] = parseValue(text, pos);
    items.push(value);
    pos = skip(text, afterValue);
    if (text[pos] === "]") return [items, pos + 1];
    if (text[pos] !== ",") throw new JsonSyntaxError("Expecting ',' delimiter", pos);
    const comma = pos;
    pos = skip(text, pos + 1);
    if (text[pos] === "]") {
      throw new JsonSyntaxError("Illegal trailing comma before end of array", comma);
    }
  }
}

/**
 * Codifica un texto como cadena JSON, como json.dumps: con ensure_ascii,
 * todo lo que no es ASCII se escribe como \uXXXX.
 */
export function encodeJsonString(value, ensureAscii) {
  let result = '"';
  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    const code = value.charCodeAt(i);
    if (char === '"') result += '\\"';
    else if (char === "\\") result += "\\\\";
    else if (char === "\n") result += "\\n";
    else if (char === "\r") result += "\\r";
    else if (char === "\t") result += "\\t";
    else if (char === "\b") result += "\\b";
    else if (char === "\f") result += "\\f";
    else if (code < 0x20 || (ensureAscii && code > 0x7e)) {
      result += "\\u" + code.toString(16).padStart(4, "0");
    } else result += char;
  }
  return result + '"';
}
