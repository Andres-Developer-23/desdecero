# Cómo contribuir

Esta guía explica cómo se trabaja en el repositorio: issues, ramas, commits, pull requests y versiones. La idea es que cualquier cambio se pueda seguir desde que se propone hasta que llega a la página publicada.

## El flujo, de principio a fin

1. **Issue**: todo cambio empieza con un issue que explica qué se quiere y por qué. Usa una de las plantillas (error, mejora o contenido) y asígnale su etiqueta y, si aplica, el hito de la versión.
2. **Rama**: crea una rama desde `main` actualizado con el prefijo del tipo de cambio.
3. **Commits**: haz commits pequeños y descriptivos, en español.
4. **Pull request**: abre un PR hacia `main` que enlace el issue con `Closes #N`. La CI tiene que pasar.
5. **Merge**: se fusiona con un _merge commit_ para conservar la historia de la rama, y se borra la rama.
6. **Publicación**: al llegar a `main`, la CI publica la página en GitHub Pages automáticamente.

`main` siempre está estable y publicado. Nunca se hace commit directamente en `main`.

## Ramas

| Prefijo     | Para qué                                         | Ejemplo                       |
| ----------- | ------------------------------------------------ | ----------------------------- |
| `feat/`     | Funcionalidad nueva de la página                 | `feat/modo-claro`             |
| `content/`  | Lecciones nuevas o cambios en el contenido       | `content/leccion-archivos`    |
| `fix/`      | Corrección de un error                           | `fix/racha-cambio-de-mes`     |
| `refactor/` | Reorganizar código sin cambiar el comportamiento | `refactor/estructura-modular` |
| `test/`     | Pruebas nuevas o mejoras en las existentes       | `test/pruebas-automaticas`    |
| `ci/`       | Integración continua, publicación, dependencias  | `ci/github-actions`           |
| `docs/`     | Documentación                                    | `docs/flujo-de-trabajo`       |
| `release/`  | Preparar una versión                             | `release/v1.1.0`              |

Nombres en minúsculas, con guiones y sin tildes.

## Commits

Los mensajes se escriben **en español** y siguen este formato:

```
Título en imperativo, de 72 caracteres como máximo

Cuerpo que explica qué cambia y, sobre todo, por qué. Puede tener
varios párrafos o una lista. Líneas de unos 72 caracteres.
```

- El título empieza con un verbo en imperativo: _Añadir_, _Corregir_, _Separar_, _Actualizar_, _Eliminar_… y no termina en punto.
- El cuerpo es obligatorio salvo en cambios triviales (una errata, por ejemplo). Cuenta el problema y la decisión, no repite el diff.
- Un commit hace una sola cosa y deja el proyecto funcionando.

Un ejemplo real del historial:

```
Separar el contenido del curso en una carpeta por lección

Hasta ahora las 20 lecciones vivían en un único archivo de texto de más
de mil líneas, con un formato propio que mezclaba teoría, código y
comprobaciones. Cada lección pasa a tener su propia carpeta dentro de
content/, ordenada por módulo.
```

## Pull requests

- Título en español, con el mismo estilo que un commit.
- La plantilla pide: qué cambia, por qué, cómo se ha probado y el issue que cierra (`Closes #N`).
- Antes de pedir revisión, ejecuta `npm run check` (formato, lint y todas las pruebas). La CI lo repite y tiene que pasar para hacer merge.

## Etiquetas

| Etiqueta              | Uso                                           |
| --------------------- | --------------------------------------------- |
| `tipo: error`         | Algo no funciona como debería                 |
| `tipo: mejora`        | Funcionalidad nueva o mejora de una existente |
| `tipo: contenido`     | Lecciones, ejercicios y textos del curso      |
| `tipo: refactor`      | Reorganización del código                     |
| `tipo: pruebas`       | Pruebas automáticas                           |
| `tipo: ci`            | Integración continua y publicación            |
| `tipo: documentación` | README, guías y comentarios                   |

## Versiones

El proyecto sigue [versionado semántico](https://semver.org/lang/es/) con el número en `package.json`:

- **MAYOR** (`2.0.0`): cambios que rompen algo para quien ya usa el curso, como un formato de progreso que no se puede migrar o un formato de lección incompatible.
- **MENOR** (`1.1.0`): lecciones nuevas, funcionalidades nuevas o reorganizaciones grandes que no rompen nada.
- **PARCHE** (`1.0.1`): correcciones de errores y de erratas en el contenido.

Cada versión agrupa sus issues en un **hito** con su número (por ejemplo, `v1.1.0`).

### Publicar una versión

1. Crea la rama `release/vX.Y.Z` desde `main`.
2. Mueve lo que haya en **Sin publicar** de [`CHANGELOG.md`](CHANGELOG.md) a una sección nueva `[X.Y.Z] - AAAA-MM-DD`.
3. Cambia `version` en `package.json` y ejecuta `npm install` para actualizar `package-lock.json`.
4. Commit `Publicar la versión X.Y.Z`, PR y merge.
5. En `main`, crea la etiqueta anotada y súbela:
   ```bash
   git tag -a vX.Y.Z -m "vX.Y.Z: resumen en una línea"
   git push origin vX.Y.Z
   ```
6. Crea el _release_ en GitHub a partir de la etiqueta, con las notas del CHANGELOG, y cierra el hito.

## Añadir una lección

1. Crea la carpeta `content/NN-modulo/NN-id/` con `lesson.md`, `starter.py`, `solution.py` y `checks.json` (y `test.py` si hace falta). El formato está en el [README](README.md#escribir-lecciones).
2. Ejecuta `npm run build`: si falta algo o hay un error, el mensaje dice qué y en qué archivo.
3. Ejecuta `npm run test:e2e`: la prueba de ejercicios comprueba automáticamente que la solución pasa y el código de partida no.
4. Abre la página (`dist/index.html`) y haz la lección como lo haría un alumno.

## Estilo de código

- Prettier decide el formato (`npm run format`) y ESLint revisa el resto (`npm run lint`).
- Nombres de archivos, funciones y variables en inglés; comentarios, textos de la interfaz y contenido en español.
- Cada módulo de `src/js/` tiene una sola responsabilidad. La lógica que no necesita el navegador va en funciones puras con pruebas en `tests/unit/`.
- En CSS, clases con formato BEM (`bloque__elemento--modificador`) y colores solo a través de las variables de `src/styles/tokens.css`.
