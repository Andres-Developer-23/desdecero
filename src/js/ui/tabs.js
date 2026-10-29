/*
 * Pestañas accesibles (role="tablist"): cada botón con data-tab muestra su panel.
 * Las pestañas ocultas (hidden) se saltan al moverse con las flechas.
 */

/**
 * @param {HTMLElement} tablist
 * @param {Record<string, HTMLElement>} panels Panel de cada pestaña, por nombre.
 * @param {{initial: string}} options
 */
export function createTabs(tablist, panels, { initial }) {
  const tabs = [...tablist.querySelectorAll("[data-tab]")];
  let current = initial;

  function select(name) {
    current = name;
    for (const tab of tabs) {
      const active = tab.dataset.tab === name;
      tab.setAttribute("aria-selected", String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active) tab.querySelector(".tabs__dot")?.setAttribute("hidden", "");
    }
    for (const [panelName, panel] of Object.entries(panels)) panel.hidden = panelName !== name;
  }

  tablist.addEventListener("click", (event) => {
    const tab = event.target.closest("[data-tab]");
    if (tab) select(tab.dataset.tab);
  });

  tablist.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    const visible = tabs.filter((tab) => !tab.hidden);
    const index = visible.findIndex((tab) => tab.dataset.tab === current);
    const step = event.key === "ArrowRight" ? 1 : visible.length - 1;
    const next = visible[(index + step) % visible.length];
    select(next.dataset.tab);
    next.focus();
  });

  select(initial);

  return {
    select,
    selected: () => current,
    /** Muestra solo las pestañas indicadas. */
    show(names) {
      for (const tab of tabs) tab.hidden = !names.includes(tab.dataset.tab);
    },
    /** Marca con un punto una pestaña que tiene novedades sin ver. */
    markUnread(name) {
      if (name === current) return;
      tabs
        .find((tab) => tab.dataset.tab === name)
        ?.querySelector(".tabs__dot")
        ?.removeAttribute("hidden");
    },
  };
}
