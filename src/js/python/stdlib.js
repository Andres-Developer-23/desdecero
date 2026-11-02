/*
 * Módulos de la biblioteca estándar que Skulpt no trae, escritos en Python
 * (src/python/): abc, dataclasses, functools, json y typing. Están disponibles en
 * todas las rutas, en el playground y en los ejemplos.
 *
 * json analiza el texto en JavaScript (json-parse.js) a través del módulo
 * puente _json: hacerlo letra a letra en Skulpt sería muy lento.
 *
 * Además, el módulo sys de Skulpt se completa con sys.exit() y sys.stderr,
 * que usan los programas de línea de comandos.
 */

import abcSource from "../../python/abc.py";
import dataclassesSource from "../../python/dataclasses.py";
import functoolsSource from "../../python/functools.py";
import jsonSource from "../../python/json/__init__.py";
import typingSource from "../../python/typing.py";
import { registerPythonFiles } from "./engine.js";
import {
  JsonNumber,
  JsonObject,
  JsonSyntaxError,
  encodeJsonString,
  parseJson,
} from "./json-parse.js";

/** Módulo nativo de Skulpt ("import _json") que usa json/__init__.py. */
const JSON_BRIDGE_SOURCE = `
var $builtinmodule = function (name) {
  var host = window.__desdeceroJson;
  var mod = { __name__: new Sk.builtin.str("_json") };
  mod.parse = new Sk.builtin.func(function (text) {
    return host.parse(text.v);
  });
  mod.encode_string = new Sk.builtin.func(function (text, ensureAscii) {
    return new Sk.builtin.str(host.encodeString(text.v, Sk.misceval.isTrue(ensureAscii)));
  });
  return mod;
};
`;

/**
 * El sys de Skulpt (src/builtin/sys.js) con sys.exit() y sys.stderr. sys.exit() lanza
 * SystemExit, que engine.js trata como el final normal del programa; sys.stderr escribe en
 * la salida de errores de la ejecución (Sk.desdeceroStderr, lo prepara engine.js).
 */
const SYS_SOURCE = `
var $builtinmodule = function (name) {
  var original = Sk.builtinFiles.files["src/builtin/sys.js"];
  var mod = new Function(original + "\\nreturn $builtinmodule;")()(name);
  mod.exit = new Sk.builtin.func(function (code) {
    if (code === undefined || code === Sk.builtin.none.none$) throw new Sk.builtin.SystemExit();
    throw new Sk.builtin.SystemExit(code);
  });
  var StandardError = Sk.misceval.buildClass(mod, function ($gbl, $loc) {
    $loc.write = new Sk.builtin.func(function (self, text) {
      var value = new Sk.builtin.str(text).v;
      if (Sk.desdeceroStderr) Sk.desdeceroStderr(value);
      return new Sk.builtin.int_(value.length);
    });
    $loc.flush = new Sk.builtin.func(function (self) {
      return Sk.builtin.none.none$;
    });
  }, "StandardError", []);
  mod.stderr = Sk.misceval.callsimArray(StandardError, []);
  mod.__stderr__ = mod.stderr;
  return mod;
};
`;

/** Registra los módulos. Se llama una vez al arrancar. */
export function installStandardLibraryExtras() {
  registerPythonFiles({
    "src/lib/abc.py": abcSource,
    "src/lib/dataclasses.py": dataclassesSource,
    "src/lib/functools.py": functoolsSource,
    "src/lib/json/__init__.py": jsonSource,
    "src/lib/_json.js": JSON_BRIDGE_SOURCE,
    "src/lib/typing.py": typingSource,
    "src/builtin/sys.js": SYS_SOURCE,
  });

  window.__desdeceroJson = {
    /** (True, valor) si el texto es JSON válido; (False, mensaje, posición) si no. */
    parse(text) {
      const Sk = window.Sk;
      try {
        const value = toPython(Sk, parseJson(text));
        return new Sk.builtin.tuple([Sk.builtin.bool.true$, value]);
      } catch (error) {
        if (!(error instanceof JsonSyntaxError)) throw error;
        return new Sk.builtin.tuple([
          Sk.builtin.bool.false$,
          new Sk.builtin.str(error.msg),
          new Sk.builtin.int_(error.pos),
        ]);
      }
    },
    encodeString: encodeJsonString,
  };
}

/** Convierte el resultado de parseJson en objetos de Python. */
function toPython(Sk, value) {
  if (value === null) return Sk.builtin.none.none$;
  if (value === true) return Sk.builtin.bool.true$;
  if (value === false) return Sk.builtin.bool.false$;
  if (typeof value === "string") return new Sk.builtin.str(value);
  if (typeof value === "number") return new Sk.builtin.float_(value); // NaN e Infinity
  if (value instanceof JsonNumber) {
    if (value.isFloat) return new Sk.builtin.float_(parseFloat(value.text));
    const number = Number(value.text);
    return Number.isSafeInteger(number)
      ? new Sk.builtin.int_(number)
      : Sk.misceval.callsimArray(Sk.builtin.int_, [new Sk.builtin.str(value.text)]);
  }
  if (Array.isArray(value)) return new Sk.builtin.list(value.map((item) => toPython(Sk, item)));
  if (value instanceof JsonObject) {
    const dict = new Sk.builtin.dict([]);
    for (const [key, item] of value.pairs) {
      dict.mp$ass_subscript(new Sk.builtin.str(key), toPython(Sk, item));
    }
    return dict;
  }
  throw new Error("Valor JSON inesperado");
}
