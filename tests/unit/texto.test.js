import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizeOutput, stripComments } from "../../src/js/exercises/text.js";
import { renderInline, renderMarkdown } from "../../src/js/ui/markdown.js";

describe("stripComments", () => {
  test("quita los comentarios de línea y al final de línea", () => {
    assert.equal(stripComments("# nota\nx = 1  # uno"), "\nx = 1  ");
  });

  test("respeta el # dentro de los textos", () => {
    assert.equal(stripComments('print("#1")  # fin'), 'print("#1")  ');
    assert.equal(stripComments("s = 'a\\'#b'"), "s = 'a\\'#b'");
  });
});

describe("normalizeOutput", () => {
  test("ignora espacios al final de línea y líneas vacías en los extremos", () => {
    assert.equal(normalizeOutput("\nHola  \r\nmundo\n\n"), "Hola\nmundo");
  });
});

describe("markdown de las lecciones", () => {
  test("formato en línea: código, negrita y cursiva, con el HTML escapado", () => {
    assert.equal(
      renderInline("usa `print(<x>)` y **no** *olvides*"),
      "usa <code>print(&lt;x&gt;)</code> y <strong>no</strong> <em>olvides</em>",
    );
  });

  test("enlaces: los de los sitios de práctica se quedan en la lección y los demás abren otra pestaña", () => {
    assert.equal(
      renderInline(
        "Mira [la librería](https://libreria.example/catalogo/) y [Flet](https://flet.dev/).",
      ),
      'Mira <a href="https://libreria.example/catalogo/" data-web-link>la librería</a> y ' +
        '<a href="https://flet.dev/" target="_blank" rel="noopener noreferrer">Flet</a>.',
    );
    assert.equal(renderInline("[x](javascript:alert(1))"), "[x](javascript:alert(1))");
    assert.equal(
      renderInline("`[no](https://a.example/)`"),
      "<code>[no](https://a.example/)</code>",
    );
  });

  test("subtítulos con ###", () => {
    assert.equal(
      renderMarkdown("Texto.\n### Robots y `robots.txt`\nMás texto."),
      "<p>Texto.</p>\n<h3>Robots y <code>robots.txt</code></h3>\n<p>Más texto.</p>",
    );
  });

  test("párrafos y listas", () => {
    assert.equal(
      renderMarkdown("Uno\ndos\n\n- a\n- b\n\n1. c"),
      "<p>Uno dos</p>\n<ul><li>a</li><li>b</li></ul>\n<ol><li>c</li></ol>",
    );
  });

  test("```py es un ejemplo ejecutable y ```txt un bloque fijo", () => {
    const html = renderMarkdown('```py\nprint("hola")\n```\n\n```txt\nhola\n```');
    assert.match(html, /<figure class="example" data-code="print\(&quot;hola&quot;\)">/);
    assert.match(html, /<pre class="output-block">hola<\/pre>/);
  });

  test("con runnableCode: false, ```py también es un bloque fijo", () => {
    const html = renderMarkdown("```py\nx = 1\n```", { runnableCode: false });
    assert.equal(html, '<pre class="output-block">x = 1</pre>');
  });
});
