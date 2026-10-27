#!/usr/bin/env python3
"""Genera index.html a partir de src/template.html, src/curso.txt y vendor/codemirror.css.

Uso:
    python3 build.py
"""
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent
SRC = ROOT / "src"
OUT = ROOT / "index.html"

# Reset mínimo que el resto de estilos da por hecho.
RESET = (
    ":root{padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}"
    "body{margin:0}img{max-width:100%}[hidden]{display:none!important}"
)


def codemirror_css() -> str:
    css = (ROOT / "vendor" / "codemirror.css").read_text(encoding="utf-8")
    css = re.sub(r"/\*.*?\*/", "", css, flags=re.S)
    css = re.sub(r"\s*\n\s*", "\n", css).strip()
    # Solo nos interesa la parte estructural: el tema propio está en la plantilla.
    return re.sub(r"\.cm-s-default[^{]*\{[^}]*\}\n?", "", css)


def main() -> int:
    template = (SRC / "template.html").read_text(encoding="utf-8")
    curso = (SRC / "curso.txt").read_text(encoding="utf-8")
    if "</script" in curso.lower():
        print("error: src/curso.txt no puede contener '</script'", file=sys.stderr)
        return 1

    page = template.replace("/*__CM_CSS__*/", codemirror_css()).replace("__CURSO__", curso)
    page = page.replace('<meta name="claude:viewport-fit-sides" content="cover">\n', "")

    # La plantilla empieza con el contenido de <head> (título, metas, fuentes y estilos)
    # y sigue con el cuerpo. Se separa por el primer </style>.
    cut = page.index("</style>") + len("</style>")
    head, body = page[:cut].strip(), page[cut:].strip()

    html = (
        "<!doctype html>\n"
        '<html lang="es">\n<head>\n'
        '<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
        '<meta name="theme-color" content="#0b0f0c">\n'
        f"<style>{RESET}</style>\n"
        f"{head}\n</head>\n<body>\n{body}\n</body>\n</html>\n"
    )
    OUT.write_text(html, encoding="utf-8")
    print(f"index.html generado ({len(html.encode('utf-8')) / 1024:.0f} KB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
