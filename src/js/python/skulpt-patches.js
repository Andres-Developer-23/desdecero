/*
 * Correcciones sobre Skulpt 1.2 para que se comporte como CPython en
 * casos que aparecen en el curso.
 */

export function applySkulptPatches(Sk) {
  fixStrTitle(Sk);
  avoidPausingImports(Sk);
  fixExceptionInit(Sk);
  allowBareAnnotations(Sk);
  allowGenericAliases(Sk);
}

/**
 * str.title() de Skulpt solo reconoce letras ASCII: "mARÍA" quedaba como
 * "MarÍA". Se sustituye por una versión que entiende cualquier letra Unicode.
 */
function fixStrTitle(Sk) {
  const descriptor = Sk?.builtin?.str?.prototype?.title;
  if (!descriptor) return;

  const title = function title() {
    const titled = this.v.replace(
      /\p{L}+/gu,
      (word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase(),
    );
    return new Sk.builtin.str(titled);
  };

  descriptor.$meth = title;
  if (descriptor.d$def) descriptor.d$def.$meth = title;
}

/**
 * Skulpt hace pausas para que la página no se congele: cada poco tiempo
 * (yieldLimit) y en cada vuelta de los bucles (para poder detenerlos). Si
 * una pausa caía en mitad de un import que a su vez importa otro módulo, al
 * reanudar se perdía el resultado: "import flet as ft" terminaba sin
 * definir ft y el programa fallaba con NameError, de vez en cuando.
 * Durante los imports ya no se hacen pausas: los módulos del curso son
 * cortos y no tienen bucles infinitos.
 */
function avoidPausingImports(Sk) {
  const original = Sk?.builtin?.__import__;
  if (!original || original.$patched) return;

  const neverPause = () => false;
  const patched = function __import__(...args) {
    const limit = Sk.yieldLimit;
    const breakpoints = Sk.breakpoints;
    Sk.yieldLimit = Number.POSITIVE_INFINITY;
    Sk.breakpoints = neverPause;
    try {
      return original.apply(this, args);
    } finally {
      Sk.yieldLimit = limit;
      Sk.breakpoints = breakpoints;
    }
  };
  patched.$patched = true;
  Sk.builtin.__import__ = patched;
}

/**
 * En CPython, BaseException.__init__ guarda sus argumentos en args. En
 * Skulpt no hacía nada, así que en una excepción propia
 * super().__init__("mensaje") no cambiaba el mensaje: str(error) enseñaba
 * los argumentos con los que se creó.
 */
function fixExceptionInit(Sk) {
  const base = Sk?.builtin?.BaseException;
  if (!base) return;

  const init = function tp$init(args, kwargs) {
    Sk.abstr.checkNoKwargs(Sk.abstr.typeName(this), kwargs);
    if (Array.isArray(args)) this.args = new Sk.builtin.tuple(args.slice());
  };
  base.prototype.tp$init = init;
  // super().__init__(...) llega por el descriptor __init__, que guarda la función original.
  const descriptor = Object.getOwnPropertyDescriptor(base.prototype, "__init__")?.value;
  if (descriptor && "d$wrapped" in descriptor) descriptor.d$wrapped = init;
}

/**
 * Una anotación sin valor ("nombre: str", típica en las clases de datos)
 * hacía fallar al compilador de Skulpt con un error interno. Ahora se
 * compila como "nombre = __sin_valor__(str)": el nombre queda definido con
 * un marcador, que dataclasses y flet entienden como «campo sin valor por
 * defecto». Las anotaciones de atributos ("self.x: int") no hacen nada,
 * como en CPython.
 */
function allowBareAnnotations(Sk) {
  const nodes = Sk?.astnodes;
  const Original = nodes?.AnnAssign;
  if (!Original || Original.$patched) return;

  const marker = new Sk.builtin.str("__sin_valor__");
  function AnnAssign(target, annotation, value, simple, lineno, colOffset) {
    if (value !== null && value !== undefined) {
      return new Original(target, annotation, value, simple, lineno, colOffset);
    }
    if (target.constructor !== nodes.Name) return new nodes.Pass(lineno, colOffset);
    const call = new nodes.Call(
      new nodes.Name(marker, nodes.Load, lineno, colOffset),
      [annotation],
      [],
      lineno,
      colOffset,
    );
    return new nodes.Assign([target], call, lineno, colOffset);
  }
  // El compilador distingue los nodos por su constructor: los dos tienen que coincidir.
  AnnAssign.prototype = Original.prototype;
  Original.prototype.constructor = AnnAssign;
  AnnAssign.$patched = true;
  nodes.AnnAssign = AnnAssign;

  const SinValor = Sk.abstr.buildNativeClass("AnotacionSinValor", {
    constructor: function AnotacionSinValor(annotation) {
      this.annotation = annotation;
    },
    slots: {
      $r() {
        return new Sk.builtin.str("<anotación sin valor>");
      },
    },
    getsets: {
      tipo: {
        $get() {
          return this.annotation;
        },
      },
    },
  });
  Sk.builtins.__sin_valor__ = new Sk.builtin.func((annotation) => new SinValor(annotation));
}

/**
 * list[str], dict[str, int] y parecidos se usan en las anotaciones de
 * tipo. Skulpt no deja poner corchetes a un tipo; ahora devuelven el propio
 * tipo, que es lo que importa para ejecutar el programa.
 */
function allowGenericAliases(Sk) {
  const builtin = Sk?.builtin;
  if (!builtin) return;
  for (const type of [
    builtin.list,
    builtin.dict,
    builtin.tuple,
    builtin.set,
    builtin.frozenset,
    builtin.type,
  ]) {
    if (type && !Object.prototype.hasOwnProperty.call(type, "mp$subscript")) {
      type.mp$subscript = function () {
        return type;
      };
    }
  }
}
