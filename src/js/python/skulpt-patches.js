/*
 * Correcciones sobre Skulpt 1.2 para que se comporte como CPython en
 * casos que aparecen en el curso.
 */

export function applySkulptPatches(Sk) {
  fixStrTitle(Sk);
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
