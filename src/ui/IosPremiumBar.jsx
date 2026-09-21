import { Star } from "lucide-react";
import { playUiSound } from "../lib/ui-sounds.js";

/** CTA Premium iOS, même barre sur Analyse / Profil / Accueil. */
export default function IosPremiumBar({ onUpgrade, source = "ios_bar" }) {
  return (
    <button
      type="button"
      className="ms-pill-cta ms-pill-cta-gold ios-premium-bar"
      onClick={() => {
        playUiSound("tap");
        onUpgrade?.(source);
      }}
    >
      <Star size={16} strokeWidth={2.25} aria-hidden />
      Devenir Premium
    </button>
  );
}
