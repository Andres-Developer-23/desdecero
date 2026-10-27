/*
 * Dibuja en la página el árbol de controles que envía el simulador de Flet
 * (src/python/flet) y avisa de los eventos de la persona (clic, escribir,
 * Enter, marcar) para que los atienda el código Python.
 *
 * Imita el aspecto de Material 3 de Flet; no pretende ser idéntico a
 * Flutter, solo lo bastante fiel para aprender.
 */

import { resolveColor, THEMES } from "./colors.js";

const MAIN_AXIS = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  spaceBetween: "space-between",
  spaceAround: "space-around",
  spaceEvenly: "space-evenly",
};

const CROSS_AXIS = {
  start: "flex-start",
  end: "flex-end",
  center: "center",
  stretch: "stretch",
  baseline: "baseline",
};

const BUTTON_VARIANTS = {
  Button: "elevated",
  FilledButton: "filled",
  FilledTonalButton: "tonal",
  OutlinedButton: "outlined",
  TextButton: "text",
};

const ICON_FAMILIES = [
  ["_outlined", "material-icons-outlined"],
  ["_rounded", "material-icons-round"],
  ["_sharp", "material-icons"],
];

/**
 * @param {HTMLElement} host Elemento donde se dibuja la ventana de la app.
 * @param {{onEvent: (sessionId: number, uid: number, name: string, data?: unknown) => void}} options
 */
export function createFletRenderer(host, { onEvent }) {
  let sessionId = null;

  function emit(uid, name, data) {
    onEvent(sessionId, uid, name, data);
  }

  return {
    /** Prepara una ejecución nueva y muestra la ventana vacía. */
    start(id) {
      sessionId = id;
      host.hidden = false;
      delete host.dataset.autofocused;
      host.replaceChildren(placeholder("abriendo la app…"));
    },

    /** Muestra un mensaje en lugar de la app. */
    showMessage(text) {
      host.hidden = false;
      host.replaceChildren(placeholder(text));
    },

    render(tree) {
      const focus = captureFocus(host);
      const scroll = captureScroll(host);
      const theme = pickTheme(tree.theme_mode);
      host.replaceChildren(renderWindow(tree, { theme, emit }));
      restoreScroll(host, scroll);
      restoreFocus(host, focus);
      host.querySelectorAll("[data-auto-scroll]").forEach((list) => {
        list.scrollTop = list.scrollHeight;
      });
    },

    /** La app deja de responder: se ejecutó otro programa. */
    detach() {
      const windowEl = host.querySelector(".flet-window");
      if (!windowEl || windowEl.classList.contains("flet-window--stale")) return;
      windowEl.classList.add("flet-window--stale");
      windowEl.querySelector(".flet-window__body")?.setAttribute("inert", "");
      const note = document.createElement("p");
      note.className = "flet-window__stale-note";
      note.textContent = "vista previa detenida · vuelve a ejecutar para usarla";
      windowEl.appendChild(note);
    },

    clear() {
      host.replaceChildren();
      host.hidden = true;
    },
  };
}

/* ---- Ventana y página ---- */

function placeholder(text) {
  const windowEl = el("div", "flet-window flet-window--empty");
  windowEl.appendChild(el("div", "flet-window__titlebar", { text: "app" }));
  windowEl.appendChild(el("p", "flet-window__placeholder", { text }));
  return windowEl;
}

function pickTheme(mode) {
  if (mode === "dark") return { name: "dark", colors: THEMES.dark };
  if (mode === "light") return { name: "light", colors: THEMES.light };
  const dark = window.matchMedia?.("(prefers-color-scheme: dark)").matches;
  return dark ? { name: "dark", colors: THEMES.dark } : { name: "light", colors: THEMES.light };
}

function renderWindow(tree, { theme, emit }) {
  const windowEl = el("div", `flet-window flet-window--${theme.name}`);
  for (const [key, value] of Object.entries(theme.colors)) {
    windowEl.style.setProperty(`--flet-${key}`, value);
  }
  windowEl.appendChild(el("div", "flet-window__titlebar", { text: tree.title || "app" }));

  const body = el("div", "flet-window__body");
  const ctx = { theme: theme.colors, emit, axis: "column", disabled: false };
  if (tree.appbar) body.appendChild(renderControl(tree.appbar, { ...ctx, axis: null }));

  const page = el("div", "flet-page");
  page.style.padding = boxValue(tree.padding);
  page.style.gap = px(tree.spacing);
  page.style.justifyContent = MAIN_AXIS[tree.vertical_alignment] ?? "flex-start";
  page.style.alignItems = CROSS_AXIS[tree.horizontal_alignment] ?? "flex-start";
  const bgcolor = resolveColor(tree.bgcolor, theme.colors);
  if (bgcolor) page.style.background = bgcolor;
  for (const node of tree.controls) page.appendChild(renderControl(node, ctx));
  body.appendChild(page);

  if (tree.fab) body.appendChild(renderControl(tree.fab, { ...ctx, axis: null }));
  windowEl.appendChild(body);
  return windowEl;
}

/* ---- Controles ---- */

const RENDERERS = {
  Text: renderText,
  Icon: renderIcon,
  Button: renderButton,
  FilledButton: renderButton,
  FilledTonalButton: renderButton,
  OutlinedButton: renderButton,
  TextButton: renderButton,
  IconButton: renderIconButton,
  FloatingActionButton: renderFab,
  TextField: renderTextField,
  Checkbox: renderToggle,
  Switch: renderToggle,
  Slider: renderSlider,
  ProgressBar: renderProgressBar,
  Row: renderFlex,
  Column: renderFlex,
  ListView: renderListView,
  Container: renderContainer,
  SafeArea: renderSafeArea,
  Card: renderCard,
  Divider: renderDivider,
  VerticalDivider: renderDivider,
  ListTile: renderListTile,
  AppBar: renderAppBar,
};

function renderControl(node, ctx) {
  const render = RENDERERS[node.type];
  const disabled = ctx.disabled || Boolean(node.props.disabled);
  const element = render
    ? render(node, { ...ctx, disabled })
    : el("div", "flet-unsupported", {
        text: `ft.${node.type} no está disponible en el simulador del curso`,
      });
  applyCommon(element, node, ctx, disabled);
  return element;
}

function renderChildren(nodes, ctx) {
  return (nodes ?? []).map((node) => renderControl(node, ctx));
}

/** Propiedades que comparten todos los controles. */
function applyCommon(element, node, ctx, disabled) {
  const p = node.props;
  element.dataset.uid = node.id;
  if (p.visible === false) element.hidden = true;
  if (p.width != null) {
    element.style.width = px(p.width);
    element.style.flexShrink = "0";
  }
  if (p.height != null) {
    element.style.height = px(p.height);
    element.style.flexShrink = "0";
  }
  if (p.expand) applyExpand(element, p.expand, ctx.axis);
  if (p.opacity != null) element.style.opacity = String(p.opacity);
  if (p.tooltip) element.title = String(p.tooltip);
  if (disabled) element.classList.add("flet-disabled");
}

function applyExpand(element, expand, axis) {
  const grow = expand === true ? 1 : Number(expand) || 1;
  if (axis === "row" || axis === "column") {
    element.style.flex = `${grow} 1 0px`;
    if (axis === "row") element.style.minWidth = "0";
    else element.style.minHeight = "0";
  } else {
    element.style.width = "100%";
    element.style.height = "100%";
  }
}

function renderText(node, ctx) {
  const p = node.props;
  const style = p.style ?? {};
  const text = el("div", "flet-text", { text: p.value == null ? "" : String(p.value) });
  const size = p.size ?? style.size;
  const weight = p.weight ?? style.weight;
  const color = resolveColor(p.color ?? style.color, ctx.theme);
  if (size != null) text.style.fontSize = px(size);
  if (weight) text.style.fontWeight = fontWeight(weight);
  if (color) text.style.color = color;
  if (p.italic || style.italic) text.style.fontStyle = "italic";
  if (style.decoration === "underline") text.style.textDecoration = "underline";
  if (style.decoration === "lineThrough") text.style.textDecoration = "line-through";
  if (p.text_align) text.style.textAlign = p.text_align;
  if (p.bgcolor) text.style.background = resolveColor(p.bgcolor, ctx.theme);
  if (p.selectable) text.classList.add("flet-text--selectable");
  if (p.no_wrap) text.style.whiteSpace = "nowrap";
  if (p.max_lines) {
    text.classList.add("flet-text--clamp");
    text.style.webkitLineClamp = String(p.max_lines);
  }
  return text;
}

function renderIcon(node, ctx) {
  const p = node.props;
  return iconElement(p.icon, { size: p.size, color: resolveColor(p.color, ctx.theme) });
}

function iconElement(name, { size, color } = {}) {
  let glyph = String(name ?? "");
  let family = "material-icons";
  for (const [suffix, className] of ICON_FAMILIES) {
    if (glyph.endsWith(suffix)) {
      glyph = glyph.slice(0, -suffix.length);
      family = className;
    }
  }
  const icon = el("span", `flet-icon ${family}`, { text: glyph });
  icon.setAttribute("aria-hidden", "true");
  if (size != null) icon.style.fontSize = px(size);
  if (color) icon.style.color = color;
  return icon;
}

/** Contenido de un botón: icono (texto o control) más texto (o control). */
function buttonContent(node, ctx, { iconColor } = {}) {
  const parts = [];
  if (node.slots.icon) parts.push(renderControl(node.slots.icon, { ...ctx, axis: null }));
  else if (node.props.icon)
    parts.push(iconElement(node.props.icon, { size: 18, color: iconColor }));
  if (node.slots.content) parts.push(renderControl(node.slots.content, { ...ctx, axis: null }));
  else if (node.props.content != null) {
    parts.push(el("span", "flet-button__label", { text: String(node.props.content) }));
  }
  return parts;
}

function renderButton(node, ctx) {
  const p = node.props;
  const style = p.style ?? {};
  const button = el("button", `flet-button flet-button--${BUTTON_VARIANTS[node.type]}`);
  button.type = "button";
  button.disabled = ctx.disabled;
  const bgcolor = resolveColor(p.bgcolor ?? style.bgcolor, ctx.theme);
  const color = resolveColor(p.color ?? style.color, ctx.theme);
  if (bgcolor) button.style.background = bgcolor;
  if (color) button.style.color = color;
  if (style.padding != null) button.style.padding = boxValue(style.padding);
  applyShape(button, style.shape);
  button.append(...buttonContent(node, ctx, { iconColor: resolveColor(p.icon_color, ctx.theme) }));
  onClick(button, node, ctx);
  return button;
}

function renderIconButton(node, ctx) {
  const p = node.props;
  const button = el("button", "flet-icon-button");
  button.type = "button";
  button.disabled = ctx.disabled;
  button.setAttribute("aria-label", p.tooltip ? String(p.tooltip) : String(p.icon ?? "icono"));
  const bgcolor = resolveColor(p.bgcolor, ctx.theme);
  if (bgcolor) button.style.background = bgcolor;
  const icon = node.slots.icon
    ? renderControl(node.slots.icon, { ...ctx, axis: null })
    : iconElement(p.selected && p.selected_icon ? p.selected_icon : p.icon, {
        size: p.icon_size,
        color: resolveColor(p.icon_color, ctx.theme),
      });
  button.appendChild(icon);
  onClick(button, node, ctx);
  return button;
}

function renderFab(node, ctx) {
  const p = node.props;
  const hasLabel = node.slots.content || (p.content != null && p.content !== "");
  const button = el("button", `flet-fab${hasLabel && p.icon ? " flet-fab--extended" : ""}`);
  button.type = "button";
  button.disabled = ctx.disabled;
  const bgcolor = resolveColor(p.bgcolor, ctx.theme);
  const color = resolveColor(p.foreground_color, ctx.theme);
  if (bgcolor) button.style.background = bgcolor;
  if (color) button.style.color = color;
  if (p.icon) button.appendChild(iconElement(p.icon));
  if (node.slots.content) button.appendChild(renderControl(node.slots.content, ctx));
  else if (p.content != null) button.appendChild(el("span", "", { text: String(p.content) }));
  if (p.tooltip) button.setAttribute("aria-label", String(p.tooltip));
  onClick(button, node, ctx);
  return button;
}

function renderTextField(node, ctx) {
  const p = node.props;
  const field = el("div", "flet-textfield");
  if (p.filled) field.classList.add("flet-textfield--filled");
  if (p.error) field.classList.add("flet-textfield--error");
  if (ctx.axis === "column" && p.width == null) field.style.alignSelf = "stretch";
  if (ctx.axis === "row" && p.width == null && !p.expand) field.style.width = "240px";

  const box = el("div", "flet-textfield__box");
  if (p.border_radius != null) box.style.borderRadius = radiusValue(p.border_radius);
  if (p.bgcolor) box.style.background = resolveColor(p.bgcolor, ctx.theme);
  if (p.label != null || node.slots.label) {
    box.appendChild(el("span", "flet-textfield__label", { text: String(p.label ?? "") }));
  }
  if (p.prefix_icon) box.appendChild(iconElement(p.prefix_icon, { size: 20 }));
  if (node.slots.prefix) box.appendChild(renderControl(node.slots.prefix, { ...ctx, axis: null }));

  const input = el(p.multiline ? "textarea" : "input", "flet-textfield__input");
  if (!p.multiline) input.type = p.password ? "password" : "text";
  else input.rows = p.min_lines ?? 2;
  input.value = p.value == null ? "" : String(p.value);
  input.id = `flet-input-${node.id}`;
  input.dataset.uid = node.id;
  if (p.hint_text != null) input.placeholder = String(p.hint_text);
  if (p.label != null) input.setAttribute("aria-label", String(p.label));
  if (p.max_length != null) input.maxLength = Number(p.max_length);
  if (p.read_only) input.readOnly = true;
  if (p.keyboard_type === "number") input.inputMode = "decimal";
  if (p.text_align) input.style.textAlign = p.text_align;
  if (p.text_size != null) input.style.fontSize = px(p.text_size);
  input.disabled = ctx.disabled;
  if (p.autofocus) input.dataset.autofocus = "true";

  // El valor se envía siempre a Python, haya o no on_change, para que field.value esté al día.
  input.addEventListener("input", () => ctx.emit(node.id, "change", input.value));
  if (!p.multiline) {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") ctx.emit(node.id, "submit", input.value);
    });
  }
  if (node.events.includes("focus"))
    input.addEventListener("focus", () => ctx.emit(node.id, "focus"));
  if (node.events.includes("blur")) input.addEventListener("blur", () => ctx.emit(node.id, "blur"));
  box.appendChild(input);

  if (p.suffix_icon) box.appendChild(iconElement(p.suffix_icon, { size: 20 }));
  if (node.slots.suffix) box.appendChild(renderControl(node.slots.suffix, { ...ctx, axis: null }));
  if (p.password && p.can_reveal_password) box.appendChild(revealButton(input));
  field.appendChild(box);

  const helper = p.error ?? p.helper;
  if (helper != null && typeof helper !== "object") {
    field.appendChild(el("div", "flet-textfield__helper", { text: String(helper) }));
  }
  return field;
}

function revealButton(input) {
  const button = el("button", "flet-textfield__reveal");
  button.type = "button";
  button.setAttribute("aria-label", "Mostrar u ocultar la contraseña");
  const icon = iconElement("visibility", { size: 20 });
  button.appendChild(icon);
  button.addEventListener("click", () => {
    const hidden = input.type === "password";
    input.type = hidden ? "text" : "password";
    icon.textContent = hidden ? "visibility_off" : "visibility";
  });
  return button;
}

function renderToggle(node, ctx) {
  const p = node.props;
  const kind = node.type === "Switch" ? "switch" : "checkbox";
  const wrapper = el("label", `flet-toggle flet-toggle--${kind}`);
  if (p.label_position === "left") wrapper.classList.add("flet-toggle--label-left");
  const input = el("input", "flet-toggle__input");
  input.type = "checkbox";
  input.checked = Boolean(p.value);
  input.disabled = ctx.disabled;
  input.dataset.uid = node.id;
  input.id = `flet-toggle-${node.id}`;
  const active = resolveColor(p.active_color, ctx.theme);
  const mark = el("span", `flet-toggle__mark flet-toggle__mark--${kind}`);
  if (active) mark.style.setProperty("--flet-toggle-active", active);
  input.addEventListener("change", () => ctx.emit(node.id, "change", input.checked));
  wrapper.append(input, mark);
  if (node.slots.label)
    wrapper.appendChild(renderControl(node.slots.label, { ...ctx, axis: null }));
  else if (p.label != null)
    wrapper.appendChild(el("span", "flet-toggle__label", { text: String(p.label) }));
  return wrapper;
}

function renderSlider(node, ctx) {
  const p = node.props;
  const input = el("input", "flet-slider");
  input.type = "range";
  input.min = String(p.min ?? 0);
  input.max = String(p.max ?? 1);
  input.step = p.divisions ? String(((p.max ?? 1) - (p.min ?? 0)) / p.divisions) : "any";
  input.value = String(p.value ?? p.min ?? 0);
  input.disabled = ctx.disabled;
  input.dataset.uid = node.id;
  input.id = `flet-slider-${node.id}`;
  if (p.label) input.setAttribute("aria-label", String(p.label));
  input.addEventListener("input", () => ctx.emit(node.id, "change", Number(input.value)));
  input.addEventListener("change", () => ctx.emit(node.id, "change_end", Number(input.value)));
  if (ctx.axis === "column" && p.width == null) input.style.alignSelf = "stretch";
  return input;
}

function renderProgressBar(node, ctx) {
  const p = node.props;
  const bar = el("div", "flet-progress");
  if (p.bar_height != null) bar.style.height = px(p.bar_height);
  if (p.bgcolor) bar.style.background = resolveColor(p.bgcolor, ctx.theme);
  const fill = el("div", "flet-progress__fill");
  if (p.value == null) bar.classList.add("flet-progress--indeterminate");
  else fill.style.width = `${Math.max(0, Math.min(1, Number(p.value))) * 100}%`;
  if (p.color) fill.style.background = resolveColor(p.color, ctx.theme);
  bar.appendChild(fill);
  if (ctx.axis === "column" && p.width == null) bar.style.alignSelf = "stretch";
  return bar;
}

function renderFlex(node, ctx) {
  const p = node.props;
  const isRow = node.type === "Row";
  const box = el("div", `flet-flex flet-flex--${isRow ? "row" : "column"}`);
  box.style.gap = isRow && p.wrap ? `${px(p.run_spacing)} ${px(p.spacing)}` : px(p.spacing);
  box.style.justifyContent = MAIN_AXIS[p.alignment] ?? "flex-start";
  box.style.alignItems =
    CROSS_AXIS[isRow ? p.vertical_alignment : p.horizontal_alignment] ?? "flex-start";
  if (p.wrap) box.style.flexWrap = "wrap";
  if (p.scroll) box.classList.add(isRow ? "flet-scroll-x" : "flet-scroll-y");
  // Como en Flutter, una fila ocupa todo el ancho disponible salvo que sea "tight".
  if (isRow && !p.tight && p.width == null && ctx.axis !== "row") box.style.alignSelf = "stretch";
  box.append(...renderChildren(node.slots.controls, { ...ctx, axis: isRow ? "row" : "column" }));
  return box;
}

function renderListView(node, ctx) {
  const p = node.props;
  const horizontal = Boolean(p.horizontal);
  const list = el("div", `flet-listview flet-listview--${horizontal ? "row" : "column"}`);
  list.style.gap = px(p.spacing);
  if (p.padding != null) list.style.padding = boxValue(p.padding);
  if (p.auto_scroll) list.dataset.autoScroll = "true";
  if (ctx.axis === "column" && p.width == null) list.style.alignSelf = "stretch";
  list.append(
    ...renderChildren(node.slots.controls, { ...ctx, axis: horizontal ? "row" : "column" }),
  );
  return list;
}

function renderContainer(node, ctx) {
  const p = node.props;
  const box = el("div", "flet-container");
  if (p.padding != null) box.style.padding = boxValue(p.padding);
  if (p.margin != null) box.style.margin = boxValue(p.margin);
  const bgcolor = resolveColor(p.bgcolor, ctx.theme);
  if (bgcolor) box.style.background = bgcolor;
  if (p.border_radius != null) box.style.borderRadius = radiusValue(p.border_radius);
  if (p.border) applyBorder(box, p.border, ctx.theme);
  if (p.alignment) {
    box.classList.add("flet-container--aligned");
    box.style.justifyContent = alignmentToFlex(p.alignment.x);
    box.style.alignItems = alignmentToFlex(p.alignment.y);
    if (p.width == null) box.style.alignSelf = "stretch";
  }
  if (p.ink) box.classList.add("flet-container--ink");
  if (node.slots.content)
    box.appendChild(renderControl(node.slots.content, { ...ctx, axis: null }));
  onClick(box, node, ctx);
  return box;
}

function renderSafeArea(node, ctx) {
  const box = el("div", "flet-safearea");
  if (node.slots.content)
    box.appendChild(renderControl(node.slots.content, { ...ctx, axis: "column" }));
  return box;
}

function renderCard(node, ctx) {
  const p = node.props;
  const card = el("div", "flet-card");
  if (p.bgcolor) card.style.background = resolveColor(p.bgcolor, ctx.theme);
  if (p.margin != null) card.style.margin = boxValue(p.margin);
  if (node.slots.content)
    card.appendChild(renderControl(node.slots.content, { ...ctx, axis: null }));
  if (ctx.axis === "column" && p.width == null) card.style.alignSelf = "stretch";
  return card;
}

function renderDivider(node, ctx) {
  const p = node.props;
  const vertical = node.type === "VerticalDivider";
  const divider = el("div", `flet-divider flet-divider--${vertical ? "vertical" : "horizontal"}`);
  const line = el("div", "flet-divider__line");
  if (p.thickness != null) line.style[vertical ? "width" : "height"] = px(p.thickness);
  if (p.color) line.style.background = resolveColor(p.color, ctx.theme);
  if (p.leading_indent != null) line.style.marginLeft = px(p.leading_indent);
  if (p.trailing_indent != null) line.style.marginRight = px(p.trailing_indent);
  divider.appendChild(line);
  if (!vertical) divider.style.alignSelf = "stretch";
  return divider;
}

function renderListTile(node, ctx) {
  const p = node.props;
  const tile = el("div", "flet-listtile");
  if (p.bgcolor) tile.style.background = resolveColor(p.bgcolor, ctx.theme);
  const child = (slot) =>
    node.slots[slot] ? renderControl(node.slots[slot], { ...ctx, axis: null }) : null;
  const leading = child("leading");
  if (leading) tile.appendChild(wrap("flet-listtile__leading", leading));
  const texts = el("div", "flet-listtile__texts");
  const title =
    child("title") ?? (p.title != null ? el("div", "flet-text", { text: String(p.title) }) : null);
  const subtitle =
    child("subtitle") ??
    (p.subtitle != null ? el("div", "flet-text", { text: String(p.subtitle) }) : null);
  if (title) texts.appendChild(wrap("flet-listtile__title", title));
  if (subtitle) texts.appendChild(wrap("flet-listtile__subtitle", subtitle));
  tile.appendChild(texts);
  const trailing = child("trailing");
  if (trailing) tile.appendChild(wrap("flet-listtile__trailing", trailing));
  if (ctx.axis === "column" && p.width == null) tile.style.alignSelf = "stretch";
  onClick(tile, node, ctx);
  return tile;
}

function renderAppBar(node, ctx) {
  const p = node.props;
  const bar = el("header", "flet-appbar");
  const bgcolor = resolveColor(p.bgcolor, ctx.theme);
  const color = resolveColor(p.color, ctx.theme);
  if (bgcolor) bar.style.background = bgcolor;
  if (color) bar.style.color = color;
  if (node.slots.leading)
    bar.appendChild(wrap("flet-appbar__leading", renderControl(node.slots.leading, ctx)));
  const title = el(
    "div",
    `flet-appbar__title${p.center_title ? " flet-appbar__title--center" : ""}`,
  );
  if (node.slots.title) title.appendChild(renderControl(node.slots.title, { ...ctx, axis: null }));
  else if (p.title != null) title.textContent = String(p.title);
  bar.appendChild(title);
  const actions = el("div", "flet-appbar__actions");
  actions.append(...renderChildren(node.slots.actions, { ...ctx, axis: "row" }));
  bar.appendChild(actions);
  return bar;
}

/* ---- Utilidades ---- */

function el(tag, className, { text } = {}) {
  const element = document.createElement(tag);
  if (className) element.className = className;
  if (text != null) element.textContent = text;
  return element;
}

function wrap(className, child) {
  const box = el("div", className);
  box.appendChild(child);
  return box;
}

function onClick(element, node, ctx) {
  if (!node.events.includes("click")) return;
  element.classList.add("flet-clickable");
  element.addEventListener("click", (event) => {
    if (ctx.disabled) return;
    event.stopPropagation();
    ctx.emit(node.id, "click");
  });
}

const px = (value) => (value == null ? "" : `${Number(value)}px`);

/** Padding o margin: número (todos los lados) o {left, top, right, bottom}. */
function boxValue(value) {
  if (value == null) return "";
  if (typeof value === "number") return px(value);
  return [value.top, value.right, value.bottom, value.left].map((side) => px(side ?? 0)).join(" ");
}

function radiusValue(value) {
  if (typeof value === "number") return px(value);
  return [value.top_left, value.top_right, value.bottom_right, value.bottom_left]
    .map((corner) => px(corner ?? 0))
    .join(" ");
}

function applyBorder(element, border, theme) {
  for (const side of ["top", "right", "bottom", "left"]) {
    const info = border[side];
    if (!info) continue;
    const color = resolveColor(info.color, theme) ?? theme.outline;
    element.style[`border${side[0].toUpperCase()}${side.slice(1)}`] =
      `${px(info.width ?? 1)} solid ${color}`;
  }
}

function applyShape(button, shape) {
  if (!shape) return;
  if (shape.kind === "rounded") button.style.borderRadius = px(shape.radius ?? 0);
  if (shape.kind === "stadium") button.style.borderRadius = "999px";
  if (shape.kind === "circle") {
    button.style.borderRadius = "50%";
    button.style.aspectRatio = "1";
  }
}

const alignmentToFlex = (value) => (value < 0 ? "flex-start" : value > 0 ? "flex-end" : "center");

function fontWeight(weight) {
  if (weight === "bold") return "700";
  if (weight === "normal") return "400";
  const match = /^w(\d{3})$/.exec(weight);
  return match ? match[1] : "";
}

/* ---- Conservar el foco y el desplazamiento entre redibujados ---- */

function captureFocus(host) {
  const active = document.activeElement;
  if (!active || !host.contains(active) || !active.dataset?.uid) return null;
  return {
    uid: active.dataset.uid,
    tag: active.tagName,
    start: active.selectionStart ?? null,
    end: active.selectionEnd ?? null,
  };
}

function restoreFocus(host, focus) {
  if (focus) {
    const target = host.querySelector(`${focus.tag}[data-uid="${focus.uid}"]`);
    if (!target) return;
    target.focus({ preventScroll: true });
    if (focus.start != null && typeof target.setSelectionRange === "function") {
      try {
        target.setSelectionRange(focus.start, focus.end);
      } catch {
        /* algunos tipos de input no admiten selección */
      }
    }
    return;
  }
  const autofocus = host.querySelector("[data-autofocus]");
  if (autofocus && !host.dataset.autofocused) {
    host.dataset.autofocused = "true";
    autofocus.focus({ preventScroll: true });
  }
}

function captureScroll(host) {
  const positions = new Map();
  host
    .querySelectorAll(".flet-page, .flet-listview, .flet-scroll-x, .flet-scroll-y")
    .forEach((element) => {
      const key = element.dataset.uid ?? "page";
      positions.set(key, [element.scrollTop, element.scrollLeft]);
    });
  return positions;
}

function restoreScroll(host, positions) {
  host
    .querySelectorAll(".flet-page, .flet-listview, .flet-scroll-x, .flet-scroll-y")
    .forEach((element) => {
      const saved = positions.get(element.dataset.uid ?? "page");
      if (saved) [element.scrollTop, element.scrollLeft] = saved;
    });
}
