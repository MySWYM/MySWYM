import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { BRAND, FONT } from "../theme/brand.js";

/** CTA mobile collé en bas — option B (en plus du bouton header). */
export default function StickyCta({ href = "/inscription" }) {
  const { t } = useTranslation("common");
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < 768,
  );

  useEffect(() => {
    const apply = () => setMobile(window.innerWidth < 768);
    window.addEventListener("resize", apply);
    return () => window.removeEventListener("resize", apply);
  }, []);

  if (!mobile) return null;

  return (
    <>
      <div aria-hidden style={{ height: 76 }} />
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 180,
          padding: "10px 16px max(12px, env(safe-area-inset-bottom))",
          background: "rgba(0, 5, 20, 0.92)",
          backdropFilter: "blur(12px)",
          borderTop: `1px solid ${BRAND.border}`,
          boxShadow: "0 -8px 28px rgba(0,0,0,0.35)",
        }}
      >
        <a
          href={href}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 48,
            borderRadius: 14,
            background: BRAND.primary,
            color: BRAND.accentText,
            fontWeight: 700,
            fontSize: 15,
            fontFamily: FONT,
            textDecoration: "none",
          }}
        >
          {t("nav.cta")}
        </a>
      </div>
    </>
  );
}
