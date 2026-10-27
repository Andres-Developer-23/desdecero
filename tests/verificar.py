#!/usr/bin/env python3
"""Comprueba todos los ejercicios del curso en un navegador sin interfaz.

Para cada lección:
  - la solución (@@solucion) tiene que superar la comprobación;
  - el código de partida (@@inicio) tiene que fallarla.

Requisitos:
    pip install playwright && python3 -m playwright install chromium
    npm install          # descarga Skulpt y CodeMirror en node_modules/

Uso:
    python3 build.py && python3 tests/verificar.py

Si node_modules/ existe, las librerías se sirven desde ahí y la prueba funciona
sin conexión. Si no existe, se descargan de los CDN como en la página real.
"""
import asyncio
import pathlib
import sys

from playwright.async_api import async_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
INDEX = ROOT / "index.html"
NM = ROOT / "node_modules"
BASE = "https://python-desde-cero.test/"


def local_file(url: str):
    """Traduce una URL de CDN a su archivo dentro de node_modules, si existe."""
    if "cdn.jsdelivr.net/npm/skulpt@" in url:
        path = url.split("/dist/", 1)[1]
        f = NM / "skulpt" / "dist" / path
    elif "cdnjs.cloudflare.com/ajax/libs/codemirror/" in url:
        path = url.split("/codemirror/", 1)[1].split("/", 1)[1].replace(".min.js", ".js")
        f = NM / "codemirror" / ("lib/codemirror.js" if path == "codemirror.js" else path)
    else:
        return None
    return f if f.exists() else None


async def handler(route):
    url = route.request.url
    if url == BASE:
        return await route.fulfill(body=INDEX.read_bytes(), content_type="text/html; charset=utf-8")
    if "fonts.googleapis.com" in url or "fonts.gstatic.com" in url:
        return await route.abort()
    f = local_file(url)
    if f:
        return await route.fulfill(body=f.read_bytes(), content_type="application/javascript")
    return await route.continue_()


CHECK_ALL = """async () => {
  const out = [];
  for (const l of PDC.curso.lista) {
    const a = document.createElement('pre'), b = document.createElement('pre');
    const sol = await PDC.checkCode(l, l.solucion, PDC.makeConsole(a), null);
    const ini = await PDC.checkCode(l, l.inicio, PDC.makeConsole(b), null);
    out.push({ n: l.n, id: l.id, sol: sol.pass, ini: ini.pass, log: a.textContent });
  }
  return out;
}"""


async def main() -> int:
    if not INDEX.exists():
        print("Falta index.html: ejecuta primero python3 build.py")
        return 1
    errores = []
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()
        page.on("pageerror", lambda e: errores.append(str(e)))
        await page.route("**/*", handler)
        await page.goto(BASE)
        await page.wait_for_function(
            'document.querySelector("[data-engine]").textContent.includes("listo")', timeout=60000
        )
        resultados = await page.evaluate(CHECK_ALL)
        await browser.close()

    fallos = 0
    for r in resultados:
        ok = r["sol"] and not r["ini"]
        fallos += not ok
        estado = "ok " if ok else "XX "
        detalle = "" if ok else ("  la solución no pasa" if not r["sol"] else "  el código de partida ya pasa")
        print(f"{estado} {r['n']:02d} {r['id']}{detalle}")
        if not r["sol"]:
            print("    " + r["log"].strip().replace("\n", "\n    "))
    for e in errores:
        print("error de la página:", e)
    print(f"\n{len(resultados) - fallos}/{len(resultados)} lecciones correctas")
    return 1 if fallos or errores else 0


if __name__ == "__main__":
    sys.exit(asyncio.run(main()))
