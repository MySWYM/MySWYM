import { formatCoachAdaptLine } from "./lib/adapt-message.js";
import { G } from "./theme/palette.js";

const COACH = {
  name: "Arthur N.",
  photo: "/coach.webp",
  initials: "AN",
};

const COACH_MESSAGES = {
  // ── Découverte — messages simples, encourageants, zéro jargon ──
  découverte_base: [
    "L'important c'est d'y aller. Pas besoin de nager vite — nage régulièrement. Ton corps s'adapte plus vite que tu ne le crois.",
    "Chaque longueur compte. Si tu as nagé aujourd'hui, tu as déjà réussi ta séance. Le reste viendra tout seul.",
    "Commencer c'est la partie la plus difficile — tu l'as déjà faite. Continue à ton rythme, sans te comparer à personne.",
  ],
  découverte_development: [
    "Tu progresses ! Tu tiens plus longtemps dans l'eau qu'au début — même si tu ne t'en rends pas compte. C'est ça, la progression.",
    "Tes séances sont un peu plus longues maintenant. Pas de panique si tu dois t'arrêter : reprends, souffle, et continue.",
  ],
  découverte_peak: [
    "Tu nages bien. Cette semaine on ajoute un peu d'intensité — juste pour voir jusqu'où tu peux aller. Pas d'obligation.",
    "Tu es plus à l'aise dans l'eau qu'il y a quelques semaines. Profite de chaque séance, c'est là que tout se passe.",
  ],
  // ── Niveaux confirmés ──
  base: [
    "Ce mois est fondamental : on construit ta base aérobie. Travaille à basse intensité, respire, prends tes marques. La vitesse viendra plus tard.",
    "La base, c'est le moteur. Chaque séance d'endurance que tu fais aujourd'hui, tu l'encaisseras comme un avantage dans 2 mois. Sois patient.",
    "La simplicité est la sophistication suprême. — Léonard de Vinci",
  ],
  development: [
    "On monte en charge. Les séances au seuil vont piquer — c'est normal. Reste dans les zones, ne cherche pas à tout donner d'un coup.",
    "Ce mois développe ton endurance spécifique. Les efforts sont plus longs, l'intensité monte. Tu dois sortir fatigué mais pas détruit.",
  ],
  peak: [
    "On est en phase de pointe. Les séances de vitesse sont courtes mais intenses. Récupère bien entre les efforts — c'est là que la progression s'installe.",
    "Ce mois tu touches à ta meilleure forme. Chaque séance compte. Dors bien, mange bien, et fais confiance au travail déjà accompli.",
  ],
  taper: [
    "On allège. C'est le moment où beaucoup veulent en faire plus — fais l'inverse. La fraîcheur au départ vaut plus que 3 séances de plus.",
  ],
  competition: [
    "Semaine de compétition — reste frais, séances courtes. Ne t'inquiète pas : si tu as suivi le plan, le travail est fait.",
  ],
  test: [
    "Semaine chrono : note ton T100 (100 m, départ dans l'eau). Pas de forçage — un chrono propre pour mesurer si tu progresses vraiment.",
    "Compare avec le test précédent. Même 2–3 secondes de mieux, c'est une vraie évolution. Note-les quelque part.",
  ],
  wellness: [
    "On reprend doucement. L'objectif ce mois : créer l'habitude. Deux séances régulières valent mieux qu'une séance intense suivie d'une semaine sans.",
    "Le corps s'adapte progressivement. Tu vas peut-être te sentir limité — c'est une bonne chose. On construit sur du solide.",
  ],
  default: [
    "Entraîne-toi intelligemment. La régularité bat toujours l'intensité ponctuelle. Une séance de plus par semaine sur 3 mois, ça change tout.",
  ],
};

const CoachCard = ({ plan, profile, currentWeekIndex }) => {
  const week = plan.weeks[Math.max(0, currentWeekIndex)];
  const isDecouverte = profile?.level === "découverte";
  const adaptLine = formatCoachAdaptLine(plan);

  const resolveCoachPhase = () => {
    if (!week) return "default";
    const f = (week.focus || "").toLowerCase();
    if (week.isTest || f.includes("test") || f.includes("contrôle")) return "test";
    if (week.isBilan || f.includes("bilan")) return "taper";
    if (f.includes("compét")) return "competition";
    if (f.includes("affût")) return "taper";
    if (f.includes("vitesse") || f.includes("intensité") || f.includes("volume maximum")) return "peak";
    if (f.includes("seuil") || f.includes("développement")) return "development";
    if (f.includes("mise en") || f.includes("construction") || f.includes("jambes") || f.includes("aérobie")) return "base";
    if (plan.isProgression) {
      if (currentWeekIndex < 3) return "base";
      if (currentWeekIndex === 3) return "test";
      if (currentWeekIndex < 7) return "development";
      if (currentWeekIndex === 7) return "test";
      if (currentWeekIndex < 11) return "peak";
      return "taper";
    }
    return "base";
  };
  const phase = resolveCoachPhase();

  // Découverte level gets its own set of simple, jargon-free messages
  const phaseKey = isDecouverte
    ? (`découverte_${phase}` in COACH_MESSAGES ? `découverte_${phase}` : "découverte_base")
    : phase;
  const msgs = COACH_MESSAGES[phaseKey] || COACH_MESSAGES.default;
  // Change de message chaque mois civil pour que ça évolue même sans progresser
  const msgIndex = new Date().getMonth() % msgs.length;
  const message = msgs[msgIndex];

  return (
    <div style={{
      background: `linear-gradient(135deg, ${G.blue} 0%, ${G.blueDeep} 100%)`,
      borderRadius: 22,
      padding: "20px",
      marginBottom: 20,
      boxShadow: "0 8px 28px rgba(53,93,163,0.28)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* Decorative circle */}
      <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(255,255,255,0.06)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: -30, right: 30, width: 60, height: 60, borderRadius: "50%", background: "rgba(255,255,255,0.05)", pointerEvents: "none" }} />

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", gap: 13, marginBottom: 16 }}>
        {COACH.photo ? (
          <img src={COACH.photo} alt={COACH.name} style={{ width: 50, height: 50, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2.5px solid rgba(255,255,255,0.4)` }} />
        ) : (
          <div style={{ width: 50, height: 50, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            <span style={{ color: G.white, fontSize: 16, fontWeight: 800 }}>{COACH.initials}</span>
          </div>
        )}
        <div>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,0.6)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 4 }}>Message de ton coach</div>
          <div style={{ fontSize: 16, fontWeight: 800, color: G.white, letterSpacing: "-0.01em", lineHeight: 1.1 }}>{COACH.name}</div>
        </div>
      </div>

      {/* Message bubble */}
      <div style={{ background: "rgba(255,255,255,0.13)", borderRadius: 14, padding: "14px 16px", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)" }}>
        <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.92)", lineHeight: 1.65, margin: 0 }}>{message}</p>
        {adaptLine && (
          <p style={{
            fontSize: 12.5, color: G.mint, lineHeight: 1.5, margin: "12px 0 0", fontWeight: 700,
            paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.18)",
          }}>
            {adaptLine}
          </p>
        )}
      </div>
    </div>
  );
};


export default CoachCard;
