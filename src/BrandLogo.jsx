import {
  LOGO_FULL_DARK,
  LOGO_FULL_LIGHT,
  LOGO_ICON_APP,
  LOGO_MARK_DARK,
  LOGO_MARK_LIGHT,
  LOGO_MARK_RATIO,
  LOGO_WORDMARK_DARK,
  LOGO_WORDMARK_LIGHT,
  LOGO_WORDMARK_RATIO,
} from "./lib/brand.js";

/**
 * Logos ForSwim (kit S ondulé).
 * wordmark · full · mark (carré) · icon (fond #006BFD).
 */
const ASSETS = {
  full: {
    dark: LOGO_FULL_DARK,
    light: LOGO_FULL_LIGHT,
    ratio: LOGO_WORDMARK_RATIO,
  },
  wordmark: {
    dark: LOGO_WORDMARK_DARK,
    light: LOGO_WORDMARK_LIGHT,
    ratio: LOGO_WORDMARK_RATIO,
  },
  mark: {
    dark: LOGO_MARK_DARK,
    light: LOGO_MARK_LIGHT,
    ratio: LOGO_MARK_RATIO,
  },
  icon: {
    dark: LOGO_ICON_APP,
    light: LOGO_ICON_APP,
    ratio: 1,
  },
};

export default function BrandLogo({
  height = 36,
  onDark = false,
  variant = "full",
  style,
  alt = "ForSwim",
}) {
  const asset = ASSETS[variant] || ASSETS.full;
  const src = onDark ? asset.dark : asset.light;
  const ratio = asset.ratio ?? 1;
  return (
    <img
      src={src}
      alt={alt}
      height={height}
      width={Math.round(height * ratio)}
      style={{
        display: "block",
        height,
        width: "auto",
        objectFit: "contain",
        ...style,
      }}
    />
  );
}
