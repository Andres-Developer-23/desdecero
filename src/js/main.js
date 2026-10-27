/*
 * Punto de entrada: crea el curso, el progreso y las vistas, y los conecta.
 */

import { createCourse, readCourseData } from "./course/course.js";
import { checkExercise } from "./exercises/checker.js";
import { $ } from "./lib/dom.js";
import { startCloudSync } from "./progress/cloud-sync.js";
import { createProgress } from "./progress/progress.js";
import { loadEditorLibrary, loadPythonEngine } from "./python/libraries.js";
import { createRouter } from "./router.js";
import { bindEngineStatus } from "./ui/engine-status.js";
import { highlightExamples, setupExamples } from "./ui/examples.js";
import { createHeader } from "./ui/header.js";
import { createTerminal } from "./ui/terminal.js";
import { createLessonView } from "./views/lesson.js";
import { createPanelView } from "./views/panel.js";
import { createPlaygroundView } from "./views/playground.js";
import { createRouteView } from "./views/route.js";

const course = createCourse(readCourseData($("#course-data")));
const progress = createProgress(course.lessons.map((lesson) => lesson.id));
const header = createHeader();
let syncStatus = "local";

const views = {
  panel: createPanelView({ course, progress, getSyncStatus: () => syncStatus }),
  route: createRouteView({ course, progress }),
  lesson: createLessonView({ course, progress }),
  playground: createPlaygroundView({ progress }),
};

const router = createRouter({
  course,
  views,
  onChange: (route) => header.setActiveNav(route.nav),
});

setupExamples({
  onRun: () => progress.recordActivity(),
  onEditInPlayground: (code) => router.go("playground", { code }),
});

progress.on("change", () => {
  header.setStreak(progress.streak());
  router.refresh();
});

// Las librerías empiezan a descargarse ya, mientras se pinta la página.
loadPythonEngine();
loadEditorLibrary().then((ready) => ready && highlightExamples());
bindEngineStatus();

header.setStreak(progress.streak());
header.setSyncStatus(syncStatus);
router.start();

startCloudSync(progress, {
  onStatusChange: (status) => {
    syncStatus = status;
    header.setSyncStatus(status);
    router.refresh();
  },
});

// Acceso para las pruebas automáticas (tests/e2e).
window.__desdecero = { course, checkExercise, createTerminal };
