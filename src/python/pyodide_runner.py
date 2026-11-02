"""
Ejecuta los programas del curso con Pyodide (Python completo en el navegador).

Lo usa src/js/pyodide/worker.js:

- prepare(modules) importa los módulos pesados (pandas, matplotlib...) antes
  de que empiece a contar el tiempo del programa;
- run(code, files, databases, inputs) ejecuta el programa como si fuera un
  script: en un módulo __main__ nuevo, con el disco limpio y los datos de
  práctica, y devuelve qué pasó (error, gráficos y archivos guardados).

Cada ejecución empieza como un proceso nuevo de Python: sin las variables, los
archivos, las opciones de pandas ni las figuras de la anterior.
"""

import base64
import builtins
import io
import linecache
import os
import shutil
import sqlite3
import sys
import traceback
import types
import warnings

WORKDIR = "/home/pyodide"
FILENAME = "<stdin>"
# Resolución de los gráficos: con 144 puntos por pulgada se ven nítidos en pantallas de alta densidad.
FIGURE_DPI = 144
MAX_TEXT_BYTES = 256 * 1024
MAX_IMAGE_BYTES = 2 * 1024 * 1024

_INITIAL_FILTERS = list(warnings.filters)
_state = {"figures": [], "inputs": None, "practice": {}, "echo": None, "on_figure": None}


class _InputsExhausted(Exception):
    """El programa pidió más datos con input() de los que tenía la prueba."""


def prepare(modules):
    """Importa los módulos pesados y prepara matplotlib para guardar los gráficos."""
    for name in modules:
        __import__(name)
    if "matplotlib.pyplot" in sys.modules:
        _patch_pyplot()


def _patch_pyplot():
    import matplotlib.figure
    import matplotlib.pyplot as plt

    if getattr(plt.show, "_desdecero", False):
        return

    def show(*args, **kwargs):
        """Como plt.show() en un ordenador: enseña las figuras abiertas y las cierra."""
        for number in plt.get_fignums():
            _capture(plt.figure(number))
        plt.close("all")

    def figure_show(self, warn=True):
        _capture(self)

    show._desdecero = True
    plt.show = show
    matplotlib.figure.Figure.show = figure_show


def _capture(figure):
    buffer = io.BytesIO()
    figure.savefig(buffer, format="png", dpi=FIGURE_DPI)
    image = base64.b64encode(buffer.getvalue()).decode("ascii")
    _state["figures"].append(image)
    # Se envía en cuanto se enseña, para que aparezca en su sitio entre lo que imprime el programa.
    if _state["on_figure"] is not None:
        _state["on_figure"](image)


def _reset_disk(files, databases, code):
    """Vacía la carpeta de trabajo y deja solo los datos de práctica."""
    os.makedirs(WORKDIR, exist_ok=True)
    os.chdir(WORKDIR)
    for name in os.listdir(WORKDIR):
        path = os.path.join(WORKDIR, name)
        if os.path.isdir(path) and not os.path.islink(path):
            shutil.rmtree(path)
        else:
            os.remove(path)
    practice = {}
    for name, text in files.items():
        with open(name, "w", encoding="utf-8", newline="") as file:
            file.write(text)
        practice[name] = text.encode("utf-8")
    # Las bases de datos de práctica solo se crean si el programa las nombra.
    for name, script in databases.items():
        if name in code:
            connection = sqlite3.connect(name)
            connection.executescript(script)
            connection.close()
            with open(name, "rb") as file:
                practice[name] = file.read()
    _state["practice"] = practice


def _reset_libraries():
    """Las opciones de pandas, el estilo de matplotlib y los avisos vuelven a su estado inicial."""
    warnings.filters[:] = _INITIAL_FILTERS
    # Un aviso interno de matplotlib que solo aparece en Pyodide.
    warnings.filterwarnings("ignore", message=r"The [xy] parameter as float was deprecated")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore")
        if "pandas" in sys.modules:
            _reset_pandas_options(sys.modules["pandas"])
        if "matplotlib" in sys.modules:
            sys.modules["matplotlib"].rcdefaults()
    if "matplotlib.pyplot" in sys.modules:
        sys.modules["matplotlib.pyplot"].close("all")


def _reset_pandas_options(pandas):
    """Solo las opciones que cambió el programa anterior (reset_option("all") cargaría matplotlib)."""
    try:
        registered = pandas._config.config._registered_options
    except AttributeError:
        return
    for key, option in registered.items():
        try:
            if pandas.get_option(key) != option.defval:
                pandas.set_option(key, option.defval)
        except Exception:
            pass


def _input(prompt=""):
    text = str(prompt)
    if _state["inputs"] is None:
        raise RuntimeError(
            "input() no funciona en los programas que usan pandas, numpy o matplotlib: "
            "escribe los datos directamente en el código."
        )
    if not _state["inputs"]:
        raise _InputsExhausted()
    value = _state["inputs"].pop(0)
    _state["echo"](text, value)
    return value


def run(code, files, databases, inputs, echo, on_figure):
    """Ejecuta el programa y devuelve un diccionario con lo que pasó."""
    _reset_disk(files, databases, code)
    _reset_libraries()
    _state["figures"] = []
    _state["inputs"] = None if inputs is None else list(inputs)
    _state["echo"] = echo
    _state["on_figure"] = on_figure

    module = types.ModuleType("__main__")
    module.__builtins__ = builtins
    linecache.cache[FILENAME] = (len(code), None, code.splitlines(True), FILENAME)
    previous_main = sys.modules.get("__main__")
    previous_input = builtins.input
    sys.modules["__main__"] = module
    builtins.input = _input
    result = {"status": "ok", "error": None}
    try:
        exec(compile(code, FILENAME, "exec"), module.__dict__)
    except _InputsExhausted:
        result = {"status": "inputs-exhausted", "error": None}
    except SystemExit as error:
        # sys.exit("mensaje") escribe el mensaje en la salida de errores y termina con código 1.
        if error.code is None:
            result["exit_code"] = 0
        elif isinstance(error.code, int):
            result["exit_code"] = int(error.code)
        else:
            print(error.code, file=sys.stderr)
            result["exit_code"] = 1
    except BaseException as error:
        result = {"status": "error", "error": _describe(error)}
    finally:
        builtins.input = previous_input
        if previous_main is not None:
            sys.modules["__main__"] = previous_main
        sys.stdout.flush()
        sys.stderr.flush()

    pyplot = sys.modules.get("matplotlib.pyplot")
    result["unshown"] = len(pyplot.get_fignums()) if pyplot else 0
    if pyplot:
        pyplot.close("all")
    result["figures"] = _state["figures"]
    result["files"] = _saved_files()
    return result


def _describe(error):
    """Tipo, mensaje y líneas del programa donde ocurrió el error (de la más interna a la externa)."""
    frames = [
        frame.lineno
        for frame in reversed(traceback.extract_tb(error.__traceback__))
        if frame.filename == FILENAME
    ]
    message = str(error)
    line = frames[0] if frames else None
    if isinstance(error, SyntaxError) and error.filename == FILENAME:
        message = error.msg
        line = error.lineno
        frames = [line]
    # De dónde viene el error: si es de pandas, la explicación puede ser más concreta.
    innermost = traceback.extract_tb(error.__traceback__)[-1:] if error.__traceback__ else []
    library = None
    for name in ("pandas", "numpy", "matplotlib"):
        if innermost and ("/" + name + "/") in innermost[0].filename:
            library = name
    described = {
        "type": type(error).__name__,
        "message": message,
        "line": line,
        "frames": frames,
        "library": library,
    }
    if isinstance(error, FileNotFoundError):
        described["available"] = sorted(os.listdir(WORKDIR))
    return described


def _saved_files():
    """Los archivos que el programa creó o cambió, con su texto o su imagen."""
    saved = []
    for folder, _, names in os.walk(WORKDIR):
        for name in sorted(names):
            path = os.path.join(folder, name)
            relative = os.path.relpath(path, WORKDIR)
            with open(path, "rb") as file:
                data = file.read()
            if _state["practice"].get(relative) == data:
                continue
            entry = {"name": relative, "size": len(data), "text": None, "image": None}
            if relative.lower().endswith(".png") and len(data) <= MAX_IMAGE_BYTES:
                entry["image"] = base64.b64encode(data).decode("ascii")
            elif len(data) <= MAX_TEXT_BYTES:
                try:
                    entry["text"] = data.decode("utf-8")
                except UnicodeDecodeError:
                    pass
            saved.append(entry)
    return saved
