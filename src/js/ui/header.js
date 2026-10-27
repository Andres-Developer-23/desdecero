/* Cabecera: enlace activo de la navegación, racha y dónde se guarda el progreso. */

import { $, $$ } from "../lib/dom.js";

const SYNC_TEXT = {
  account: {
    label: "guardado en tu cuenta",
    title: "Tu progreso se guarda en tu cuenta y te sigue entre dispositivos",
  },
  local: {
    label: "en este navegador",
    title: "Tu progreso se guarda solo en este navegador",
  },
};

export function createHeader() {
  const streak = $("#header-streak");
  const sync = $("#header-sync");
  const syncLabel = $("#header-sync-label");

  return {
    setStreak(days) {
      streak.textContent = String(days);
    },

    /** @param {"account" | "local"} status */
    setSyncStatus(status) {
      sync.dataset.sync = status;
      sync.title = SYNC_TEXT[status].title;
      syncLabel.textContent = SYNC_TEXT[status].label;
    },

    /** Marca como actual el enlace de la sección indicada (panel, rutas o playground). */
    setActiveNav(name) {
      $$("[data-nav]").forEach((link) => {
        if (link.dataset.nav === name) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    },
  };
}

export const syncStatusText = (status) =>
  status === "account" ? "en tu cuenta" : "en este navegador";
