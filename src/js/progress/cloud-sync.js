/*
 * Sincronización opcional del progreso con la cuenta del usuario.
 *
 * Solo se activa cuando la página se publica como artifact de Claude, que
 * ofrece window.claude con las capacidades "db" y "user". En cualquier otro
 * sitio (GitHub Pages, un archivo abierto en local) no hace nada y el
 * progreso se queda en el navegador.
 */

import { mergeStates, sameProgress } from "./state.js";

const PUSH_DELAY_MS = 700;
const MAX_RETRIES = 2;

/**
 * @param {ReturnType<import("./progress.js").createProgress>} progress
 * @param {{onStatusChange: (status: "account" | "local") => void}} options
 */
export async function startCloudSync(progress, { onStatusChange }) {
  const remoteDoc = await openRemoteDocument();
  if (!remoteDoc) return;

  let remote;
  try {
    const snapshot = await remoteDoc.get();
    remote = snapshot?.exists ? snapshot.data() : null;
  } catch {
    return;
  }

  // Une lo guardado en la cuenta con lo de este navegador, sin perder nada.
  const merged = mergeStates(progress.snapshot(), remote, progress.validIds);
  if (!sameProgress(merged, progress.snapshot())) progress.replace(merged);
  onStatusChange("account");

  let lastPushed = remote ? mergeStates(remote, null, progress.validIds) : null;
  let timer = null;
  let busy = false;
  let pending = false;
  let retries = 0;

  const unsubscribe = progress.on("change", () => schedulePush(PUSH_DELAY_MS));
  schedulePush(0);

  function schedulePush(delay) {
    clearTimeout(timer);
    timer = setTimeout(push, delay);
  }

  async function push() {
    if (busy) {
      pending = true;
      return;
    }
    const state = progress.snapshot();
    if (lastPushed && sameProgress(state, lastPushed)) return;

    busy = true;
    try {
      await remoteDoc.set(state);
      lastPushed = state;
      retries = 0;
    } catch (error) {
      const transient = error?.code === "unavailable" || error?.code === "resource_exhausted";
      if (transient && retries < MAX_RETRIES) {
        retries += 1;
        schedulePush(1200 + Math.random() * 1800);
      } else {
        unsubscribe();
        onStatusChange("local");
      }
    } finally {
      busy = false;
      if (pending) {
        pending = false;
        schedulePush(PUSH_DELAY_MS);
      }
    }
  }
}

/** Devuelve el documento de progreso del usuario, o null si no hay cuenta disponible. */
async function openRemoteDocument() {
  const api = window.claude;
  if (!api || typeof api.use !== "function") return null;
  try {
    const [db, user] = await Promise.all([api.use("db"), api.use("user")]);
    if (!db || !user) return null;
    const userId = await user.id();
    return userId ? db.doc(`data/users/${userId}/progress`) : null;
  } catch {
    return null;
  }
}
