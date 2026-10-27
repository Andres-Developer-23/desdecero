/*
 * Colores de Flet: la paleta de Material (ft.Colors.BLUE_200…), los colores
 * del tema (ft.Colors.PRIMARY…) y los valores hexadecimales.
 */

/* Tonos 50, 100, 200 … 900 de cada color de la paleta de Material. */
const SHADES = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900];

const PALETTE = {
  red: "FFEBEE FFCDD2 EF9A9A E57373 EF5350 F44336 E53935 D32F2F C62828 B71C1C",
  pink: "FCE4EC F8BBD0 F48FB1 F06292 EC407A E91E63 D81B60 C2185B AD1457 880E4F",
  purple: "F3E5F5 E1BEE7 CE93D8 BA68C8 AB47BC 9C27B0 8E24AA 7B1FA2 6A1B9A 4A148C",
  deeppurple: "EDE7F6 D1C4E9 B39DDB 9575CD 7E57C2 673AB7 5E35B1 512DA8 4527A0 311B92",
  indigo: "E8EAF6 C5CAE9 9FA8DA 7986CB 5C6BC0 3F51B5 3949AB 303F9F 283593 1A237E",
  blue: "E3F2FD BBDEFB 90CAF9 64B5F6 42A5F5 2196F3 1E88E5 1976D2 1565C0 0D47A1",
  lightblue: "E1F5FE B3E5FC 81D4FA 4FC3F7 29B6F6 03A9F4 039BE5 0288D1 0277BD 01579B",
  cyan: "E0F7FA B2EBF2 80DEEA 4DD0E1 26C6DA 00BCD4 00ACC1 0097A7 00838F 006064",
  teal: "E0F2F1 B2DFDB 80CBC4 4DB6AC 26A69A 009688 00897B 00796B 00695C 004D40",
  green: "E8F5E9 C8E6C9 A5D6A7 81C784 66BB6A 4CAF50 43A047 388E3C 2E7D32 1B5E20",
  lightgreen: "F1F8E9 DCEDC8 C5E1A5 AED581 9CCC65 8BC34A 7CB342 689F38 558B2F 33691E",
  lime: "F9FBE7 F0F4C3 E6EE9C DCE775 D4E157 CDDC39 C0CA33 AFB42B 9E9D24 827717",
  yellow: "FFFDE7 FFF9C4 FFF59D FFF176 FFEE58 FFEB3B FDD835 FBC02D F9A825 F57F17",
  amber: "FFF8E1 FFECB3 FFE082 FFD54F FFCA28 FFC107 FFB300 FFA000 FF8F00 FF6F00",
  orange: "FFF3E0 FFE0B2 FFCC80 FFB74D FFA726 FF9800 FB8C00 F57C00 EF6C00 E65100",
  deeporange: "FBE9E7 FFCCBC FFAB91 FF8A65 FF7043 FF5722 F4511E E64A19 D84315 BF360C",
  brown: "EFEBE9 D7CCC8 BCAAA4 A1887F 8D6E63 795548 6D4C41 5D4037 4E342E 3E2723",
  grey: "FAFAFA F5F5F5 EEEEEE E0E0E0 BDBDBD 9E9E9E 757575 616161 424242 212121",
  bluegrey: "ECEFF1 CFD8DC B0BEC5 90A4AE 78909C 607D8B 546E7A 455A64 37474F 263238",
};

/* Acentos 100, 200, 400 y 700. */
const ACCENTS = {
  red: "FF8A80 FF5252 FF1744 D50000",
  pink: "FF80AB FF4081 F50057 C51162",
  purple: "EA80FC E040FB D500F9 AA00FF",
  deeppurple: "B388FF 7C4DFF 651FFF 6200EA",
  indigo: "8C9EFF 536DFE 3D5AFE 304FFE",
  blue: "82B1FF 448AFF 2979FF 2962FF",
  lightblue: "80D8FF 40C4FF 00B0FF 0091EA",
  cyan: "84FFFF 18FFFF 00E5FF 00B8D4",
  teal: "A7FFEB 64FFDA 1DE9B6 00BFA5",
  green: "B9F6CA 69F0AE 00E676 00C853",
  lightgreen: "CCFF90 B2FF59 76FF03 64DD17",
  lime: "F4FF81 EEFF41 C6FF00 AEEA00",
  yellow: "FFFF8D FFFF00 FFEA00 FFD600",
  amber: "FFE57F FFD740 FFC400 FFAB00",
  orange: "FFD180 FFAB40 FF9100 FF6D00",
  deeporange: "FF9E80 FF6E40 FF3D00 DD2C00",
};

const NAMED = new Map([
  ["white", "#FFFFFF"],
  ["black", "#000000"],
  ["transparent", "transparent"],
]);

for (const [name, values] of Object.entries(PALETTE)) {
  const hexes = values.split(" ");
  hexes.forEach((hex, index) => NAMED.set(`${name}${SHADES[index]}`, `#${hex}`));
  NAMED.set(name, `#${hexes[5]}`);
}
for (const [name, values] of Object.entries(ACCENTS)) {
  const hexes = values.split(" ");
  [100, 200, 400, 700].forEach((shade, index) =>
    NAMED.set(`${name}accent${shade}`, `#${hexes[index]}`),
  );
  NAMED.set(`${name}accent`, `#${hexes[1]}`);
}
for (const shade of [10, 12, 24, 30, 38, 45, 54, 60, 70, 87]) {
  NAMED.set(`white${shade}`, `rgba(255, 255, 255, ${shade / 100})`);
  NAMED.set(`black${shade}`, `rgba(0, 0, 0, ${shade / 100})`);
}

/*
 * Esquema de Material 3 generado a partir del azul, como el tema por
 * defecto de Flet. Las claves son los valores de ft.Colors sin guiones.
 */
export const THEMES = {
  light: {
    primary: "#0061A4",
    onprimary: "#FFFFFF",
    primarycontainer: "#D1E4FF",
    onprimarycontainer: "#001D36",
    secondary: "#535F70",
    onsecondary: "#FFFFFF",
    secondarycontainer: "#D7E3F7",
    onsecondarycontainer: "#101C2B",
    tertiary: "#6B5778",
    ontertiary: "#FFFFFF",
    tertiarycontainer: "#F2DAFF",
    ontertiarycontainer: "#251431",
    error: "#BA1A1A",
    onerror: "#FFFFFF",
    errorcontainer: "#FFDAD6",
    onerrorcontainer: "#410002",
    surface: "#F8F9FF",
    onsurface: "#191C20",
    onsurfacevariant: "#42474E",
    surfacetint: "#0061A4",
    surfacecontainerlowest: "#FFFFFF",
    surfacecontainerlow: "#F2F3F9",
    surfacecontainer: "#ECEEF4",
    surfacecontainerhigh: "#E6E8EE",
    surfacecontainerhighest: "#E0E2E8",
    outline: "#73777F",
    outlinevariant: "#C2C7CF",
    shadow: "#000000",
    inversesurface: "#2E3135",
    oninversesurface: "#EFF0F7",
    inverseprimary: "#9ECAFF",
  },
  dark: {
    primary: "#9ECAFF",
    onprimary: "#003258",
    primarycontainer: "#00497D",
    onprimarycontainer: "#D1E4FF",
    secondary: "#BBC7DB",
    onsecondary: "#253140",
    secondarycontainer: "#3B4858",
    onsecondarycontainer: "#D7E3F7",
    tertiary: "#D6BEE4",
    ontertiary: "#3B2948",
    tertiarycontainer: "#523F5F",
    ontertiarycontainer: "#F2DAFF",
    error: "#FFB4AB",
    onerror: "#690005",
    errorcontainer: "#93000A",
    onerrorcontainer: "#FFDAD6",
    surface: "#111418",
    onsurface: "#E1E2E8",
    onsurfacevariant: "#C2C7CF",
    surfacetint: "#9ECAFF",
    surfacecontainerlowest: "#0B0E13",
    surfacecontainerlow: "#191C20",
    surfacecontainer: "#1D2024",
    surfacecontainerhigh: "#272A2F",
    surfacecontainerhighest: "#32353A",
    outline: "#8C9199",
    outlinevariant: "#42474E",
    shadow: "#000000",
    inversesurface: "#E1E2E8",
    oninversesurface: "#2E3135",
    inverseprimary: "#0061A4",
  },
};

/**
 * Convierte un color de Flet en un color CSS.
 * Admite nombres (ft.Colors.BLUE_100 → "blue100"), colores del tema,
 * "#RRGGBB", "#AARRGGBB" y ft.Colors.with_opacity (→ "color,0.5").
 */
export function resolveColor(value, theme) {
  if (value == null || value === "") return undefined;
  const text = String(value).trim();

  const comma = text.lastIndexOf(",");
  if (comma > 0 && !text.startsWith("#")) {
    const base = resolveColor(text.slice(0, comma), theme);
    const opacity = Number(text.slice(comma + 1));
    return base && !Number.isNaN(opacity) ? withAlpha(base, opacity) : base;
  }
  if (text.startsWith("#")) return fromHex(text);

  const key = text.toLowerCase().replace(/[_\s]/g, "");
  return theme[key] ?? NAMED.get(key) ?? text;
}

function fromHex(hex) {
  const digits = hex.slice(1);
  if (digits.length === 8) {
    // Flet usa #AARRGGBB: el canal alfa va primero.
    const alpha = parseInt(digits.slice(0, 2), 16) / 255;
    return withAlpha(`#${digits.slice(2)}`, alpha);
  }
  return hex;
}

function withAlpha(color, alpha) {
  const match = /^#([0-9a-f]{6})$/i.exec(color);
  if (!match) return color;
  const n = parseInt(match[1], 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${Math.round(alpha * 1000) / 1000})`;
}
