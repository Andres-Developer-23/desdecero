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
