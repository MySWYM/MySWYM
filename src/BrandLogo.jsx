/** Logo mySWYM, lockup icône+texte, ou wordmark seul. */
const ASSETS = {
  full: {
    dark: "/logo-full.png",
    light: "/logo-full-on-light.png",
    ratio: 519 / 390,
  },
  wordmark: {
    dark: "/logo-myswym-banner-blanc.png",
    light: "/logo-myswym-on-light.png",
    ratio: 192 / 28,
  },
};

export default function BrandLogo({
  height = 36,
  onDark = false,
  variant = "full",
  style,
  alt = "mySWYM",
}) {
  const asset = ASSETS[variant] || ASSETS.full;
  const src = onDark ? asset.dark : asset.light;
  return (
    <img
      src={src}
      alt={alt}
      height={height}
      width={Math.round(height * asset.ratio)}
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
