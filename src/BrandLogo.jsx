/**
 * Logos ForSwim (kit A–F).
 * A icon-app · B picto bleu · C picto blanc · D wordmark color ·
 * E horizontal noir · F horizontal blanc.
 */
const ASSETS = {
  /** E horizontal noir (clair) / F horizontal blanc (sombre). */
  full: {
    dark: "/logo-full.png",
    light: "/logo-full-on-light.png",
    ratioDark: 1024 / 308,
    ratioLight: 1024 / 308,
  },
  /** D wordmark color (clair) / wordmark blanc (sombre). */
  wordmark: {
    dark: "/logo-myswym-banner-blanc.png",
    light: "/logo-myswym-on-light.png",
    ratio: 1024 / 308,
  },
  /** B picto bleu (clair) / C picto blanc (sombre). */
  mark: {
    dark: "/logo-mark-on-dark.png",
    light: "/logo-mark.png",
    ratio: 787 / 609,
  },
  /** A icône app bleue (profil / raccourci). */
  icon: {
    dark: "/logo-icon-app.png",
    light: "/logo-icon-app.png",
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
  const ratio =
    asset.ratio ??
    (onDark ? asset.ratioDark : asset.ratioLight) ??
    asset.ratioLight ??
    1;
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
