import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { resolveColor, THEMES } from "../../src/js/flet/colors.js";
import { usesFlet } from "../../src/js/flet/detect.js";

const theme = THEMES.light;

describe("colores de Flet", () => {
  test("paleta de Material: base, tonos y acentos", () => {
    assert.equal(resolveColor("blue", theme), "#2196F3");
    assert.equal(resolveColor("blue100", theme), "#BBDEFB");
    assert.equal(resolveColor("deeporange900", theme), "#BF360C");
    assert.equal(resolveColor("redaccent700", theme), "#D50000");
  });

  test("colores del tema y transparencias", () => {
    assert.equal(resolveColor("primary", theme), theme.primary);
    assert.equal(resolveColor("onsurfacevariant", theme), theme.onsurfacevariant);
    assert.equal(resolveColor("black12", theme), "rgba(0, 0, 0, 0.12)");
  });

  test("hexadecimal con alfa primero (#AARRGGBB) y with_opacity", () => {
    assert.equal(resolveColor("#ff0000", theme), "#ff0000");
    assert.equal(resolveColor("#80ff0000", theme), "rgba(255, 0, 0, 0.502)");
    assert.equal(resolveColor("blue,0.5", theme), "rgba(33, 150, 243, 0.5)");
  });

  test("sin color devuelve undefined", () => {
    assert.equal(resolveColor(null, theme), undefined);
    assert.equal(resolveColor("", theme), undefined);
  });
});

describe("detección de Flet", () => {
  test("solo cuenta los import de verdad", () => {
    assert.equal(usesFlet("import flet as ft\nft.run(main)"), true);
    assert.equal(usesFlet("from flet import Text"), true);
    assert.equal(usesFlet("# import flet\nprint(1)"), false);
    assert.equal(usesFlet("import fleteo"), false);
  });
});
