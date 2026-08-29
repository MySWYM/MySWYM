const THEME_LAST_KEY = "myswym_theme_last";
const THEME_LEGACY_KEY = "myswym_theme";

export const G_DARK = {
  bg: "#000514",
  surface: "#06101f",
  ink: "#f4f8fa",
  /* Muted un cran plus clair pour contraste ~AA sur #000514 */
  inkLight: "#b4c6db",
  inverse: "#000514",
  blue: "#006bfd",
  blueLight: "#0a162c",
  blueMid: "#3d8fff",
  blueDeep: "#3d8fff",
  water: "#22c3e0",
  waterLight: "#0c2a32",
  coral: "#FF6B78",
  coralLight: "#3a151a",
  mint: "#2dd4a0",
  mintLight: "#0c2a20",
  gold: "#FBBF24",
  goldLight: "#3a2a0a",
  purple: "#a78bfa",
  purpleLight: "#241a3d",
  grey: "#b4c6db",
  greyMid: "#8a9bb0",
  greyLight: "rgba(0, 107, 253, 0.22)",
  greyXLight: "#0a162c",
  white: "#FFFFFF",
  glass: "rgba(0, 5, 20, 0.92)",
  navGlass: "rgba(6, 16, 31, 0.94)",
};

/** Palette DA, dark only. Mutée par applyTheme. */
export const G = { ...G_DARK };

export const applyTheme = () => {
  Object.assign(G, G_DARK);
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.setAttribute("data-theme", "dark");
  root.style.colorScheme = "dark";
  root.style.setProperty("--myswym-bg", G_DARK.bg);
  root.style.setProperty("--myswym-surface", G_DARK.surface);
  root.style.setProperty("--myswym-ink", G_DARK.ink);
  root.style.setProperty("--myswym-ink-light", G_DARK.inkLight);
  root.style.setProperty("--myswym-blue", G_DARK.blue);
  root.style.setProperty("--myswym-blue-light", G_DARK.blueLight);
  root.style.setProperty("--myswym-blue-mid", G_DARK.blueMid);
  root.style.setProperty("--myswym-blue-deep", G_DARK.blueDeep);
  root.style.setProperty("--myswym-grey", G_DARK.grey);
  root.style.setProperty("--myswym-grey-mid", G_DARK.greyMid);
  root.style.setProperty("--myswym-grey-light", G_DARK.greyLight);
  root.style.setProperty("--myswym-grey-xlight", G_DARK.greyXLight);
  root.style.setProperty("--myswym-nav-bg", G_DARK.navGlass);
  root.style.setProperty("--myswym-nav-border", G_DARK.greyLight);
  root.style.setProperty("--myswym-glass", G_DARK.glass);
  try {
    localStorage.setItem(THEME_LAST_KEY, "dark");
    localStorage.removeItem(THEME_LEGACY_KEY);
  } catch { /* ignore */ }
};
