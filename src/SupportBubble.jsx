import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Send, X } from "lucide-react";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { getStoredLanguage } from "./i18n/index.js";

const SUPPORT_EMAIL = "contact@myswym.app";
const FONT = "Geist, ui-sans-serif, system-ui, sans-serif";
const TRIAL_DAYS = 7;

const QUICK_PROMPTS = [
  "C'est gratuit ?",
  "C'est quoi Z1 / Z2 ?",
  "D… ou R… ?",
  "Qu'est-ce que les godilles ?",
];

/** FAQ rule-based — produit + vocabulaire / méthode natation MySWYM. */
const FAQ_RULES = [
  // ── Produit ──────────────────────────────────────────────
  {
    keys: ["gratuit", "free", "prix", "tarif", "coût", "cout", "abonnement", "premium", "payer", "paiement", "stripe", "combien"],
    answer:
      `À la création du compte : essai Premium ${TRIAL_DAYS} jours sans carte. Ensuite l'app se gèle (plus rien de visible) jusqu'à l'abonnement. Mensuel 4,99€ sans engagement, ou annuel 39,99€ (pas de remboursement). Détails sur la page Tarifs.`,
  },
  {
    keys: ["annul", "résili", "resili", "stop", "désabon", "desabon", "rembours"],
    answer:
      "L'essai 7 jours ne demande pas de carte : il s'arrête tout seul et l'app se gèle. Ensuite, mensuel 4,99€ sans engagement (accès jusqu'à la fin de période payée). Annuel 39,99€ : prépaiement, pas de remboursement une fois facturé (hors cas légaux).",
  },
  {
    keys: ["objectif", "changer", "relancer", "nouveau plan", "onboarding", "plusieurs plan"],
    answer:
      "Un nouvel objectif se lance depuis le profil (relance de l'onboarding). Premium permet aussi de gérer plusieurs plans en parallèle.",
  },
  {
    keys: ["début", "debut", "débutant", "debutant", "jamais", "apprendre", "savoir nager", "école"],
    answer:
      "MySWYM convient dès que tu sais déjà nager. Le niveau découverte allège le vocabulaire (zones en français, repos en secondes). Ce n'est pas une école pour apprendre le geste de A à Z. L'app génère et structure tes séances.",
  },
  {
    keys: ["comment ça marche", "comment ca marche", "fonctionn", "personnalis", "générateur", "generateur"],
    answer:
      "Après le questionnaire (objectif, niveau, fréquence), un plan est généré semaine par semaine. Structure type : départ → technique → corps (zones) → retour au calme. Pas d'IA générative : logique coaching déterministe.",
  },
  {
    keys: ["contact", "humain", "équipe", "equipe", "écrire", "ecrire", "mail", "email", "support"],
    answer:
      `Pour une question perso ou un souci sur une séance, écris à ${SUPPORT_EMAIL}. L'équipe répond sous 24-48 h (jours ouvrés).`,
  },
  {
    keys: ["compte", "connexion", "mot de passe", "inscription", "supprimer"],
    answer:
      `Connexion et inscription via /connexion et /inscription. Pour supprimer ton compte : Profil → Paramètres → « Supprimer mon compte », ou écris à ${SUPPORT_EMAIL}.`,
  },

  // ── Natation / méthode ───────────────────────────────────
  {
    keys: ["zone", "z1", "z2", "z3", "z4", "intensité", "intensite", "filière", "filiere"],
    answer:
      "Les zones guident l'effort : Z1 = aisance / récup active, Z2 = endurance aéro, Z3 = seuil (soutenu mais régulier), Z4 = vitesse / VO2. En découverte, l'app les traduit en français (facile, endurance…). En Premium + T100 renseigné, chaque zone affiche aussi une fourchette @mm:ss.",
  },
  {
    keys: ["allure", "t100", "temps 100", "pace", "@", "mm:ss", "chron"],
    answer:
      "Les allures cibles partent de ton seul T100 (meilleur 100 m, départ dans l'eau), plus de T400. Pendant l'essai et en Premium : @mm:ss à côté des zones. Après l'essai sans abo, l'app est gelée. Les coefficients s'adaptent : plus tu es rapide, plus les bandes aérobie sont calibrées.",
  },
  {
    keys: ["d…", "d...", "r…", "r...", "d ou r", "départ chron", "depart chron", "repos ", "intervalle fixe", "chronométré", "chronometre"],
    answer:
      "R… = repos simple entre reps (ex. R30\"). D… = départ chronométré (ex. D1'30) : tu repartis à intervalle fixe. Premium affiche l'allure cible si T100 connu. Sur un sprint, la récup doit rester complète : sinon c'est de l'endurance déguisée.",
  },
  {
    keys: ["structure", "échauff", "echauff", "retour calme", "rac", "bloc", "départ", "depart", "corps de séance", "corps de seance"],
    answer:
      "Séance type MySWYM : départ (souvent godilles en Z1) → bloc technique rotatif → corps physio (Z1–Z4 selon la filière) → fin / retour au calme. Eau libre : consignes spécifiques (sighting, combinaison), pas seulement des reps bassin.",
  },
  {
    keys: ["godille", "sculling", "scull"],
    answer:
      "Les godilles (pas « sculling ») : petits mouvements de main pour sentir l'appui et l'eau, souvent en début de séance en Z1. Objectif sensation / échauffement, pas vitesse.",
  },
  {
    keys: ["grand chien", "petit chien", "chien"],
    answer:
      "Grand / petit chien = éducatifs de position et d'appui. MySWYM les utilise avec parcimonie (~1 séance sur 8 en focus) : on privilégie jambes et nage appliquée. Sur niveau découverte, l'app explique l'éducatif en ligne plutôt que le jargon seul.",
  },
  {
    keys: ["rattrapé", "rattrape", "catch-up", "catch up", "catchup"],
    answer:
      "Le rattrapé : un bras attend dans l'axe des épaules (pas mains qui se touchent) pendant que l'autre tire. Éducatif de timing et d'alignement, pas un exercice de vitesse.",
  },
  {
    keys: ["coulée", "coulee", "virage", "apnée", "apnee", "glisse"],
    answer:
      "Après un virage, on parle de coulée (glisse sous l'eau), pas de « sortie en apnée ». Sur BNSSA / pompiers, l'apnée dynamique et le matériel (palmes, masque, tuba) servent au parcours examen. C'est un autre contexte.",
  },
  {
    keys: ["jambes", "battement", "kick"],
    answer:
      "Focus jambes = éducatif court puis série jambes. Jamais deux gros blocs battements d'affilée. Si la séance est déjà centrée jambes, le départ ne rajoute pas encore du kick.",
  },
  {
    keys: ["sprint", "vitesse", "récup complète", "recup complete"],
    answer:
      "Sprint / vitesse : récup longue et complète entre les reps (souvent 1:3 à 1:6). Si tu raccourcis le repos, tu bascules en endurance. Ce n'est plus le même stimulus.",
  },
  {
    keys: ["seuil", "régular", "regular", "constance"],
    answer:
      "Au seuil (souvent Z3) : effort soutenu mais régulier. Vise la constance des temps sur les reps, pas un coup de collier puis un crash.",
  },
  {
    keys: ["sighting", "eau libre", "bouée", "bouee", "combinaison", "open water", "ow"],
    answer:
      "Eau libre : repères (sighting), combinaison, allure course. Les séances le mentionnent explicitement (« À faire en eau libre »). Triathlon : cues régularité / bouée sur les reps longues. Pas uniquement du fractionné bassin générique.",
  },
  {
    keys: ["bnssa", "pompier", "sauvetage", "remorquage", "palmes", "tuba", "masque"],
    answer:
      "BNSSA / tests pompiers : séances orientées examen (apnée, palmes + masque + tuba, remorquage, simulations parcours). Ce n'est pas de l'endurance loisir générique.",
  },
  {
    keys: ["bpjeps", "400 m", "400m", "7'40", "7:40"],
    answer:
      "BPJEPS AAN : focus 400 m NL (repère examen souvent < 7'40\"), fractionné et régularité des temps. Distinct du parcours sauvetage BNSSA.",
  },
  {
    keys: ["palme", "plaquette", "roulis", "rotation"],
    answer:
      "Sur roulis / rotation du corps : palmes OK, plaquettes non. Elles faussent l'appui. Les plaquettes servent plutôt d'autres blocs (force / traction), pas le travail de rotation.",
  },
  {
    keys: ["volume", "+10", "10 %", "10%", "progression", "charge", "trop dur", "trop facile", "feedback", "easy", "hard"],
    answer:
      "Le volume monte ~+10 % max d'une semaine à l'autre. Après une semaine, le feedback (facile / ok / dur) ajuste les semaines futures encore vierges (borné). Une séance trop dure ? Dis-le dans le retour. Premium peut aussi micro-ajuster au premier feedback séance.",
  },
  {
    keys: ["affûtage", "affutage", "taper", "semaine test", "chrono", "décharge", "decharge"],
    answer:
      "Décharges ~toutes les 4 semaines. Semaines test : chronos 100/200/400 pour mesurer l'évolution. Affûtage avant l'échéance (1 sem. dès 6 sem. de plan, 2 dès 10) : volume ↓, touches vitesse. Semaine compétition : 1 séance (≤3×/sem) ou 2 (>3), volume très bas, rappels ≤12,5 m. Le travail est déjà fait.",
  },
  {
    keys: ["bassin", "25 m", "25m", "50 m", "50m", "longueur"],
    answer:
      "Les distances sont calées sur ton bassin (25 ou 50 m) : pas de séries Nx25 en bassin 50. En 50 m, certaines variantes vitesse = 25 à bloc + 25 relâché sur la même longueur.",
  },
];

const FALLBACK =
  `Pas de réponse auto pour celle-ci. Essaie une question courte (zones, allures, D…/R…, godilles, tarifs…) ou contacte l'équipe à ${SUPPORT_EMAIL}.`;

function stripAccents(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function matchFaq(text) {
  const q = stripAccents(text.toLowerCase());
  let best = null;
  let bestScore = 0;
  for (const rule of FAQ_RULES) {
    let score = 0;
    for (const key of rule.keys) {
      const k = stripAccents(key);
      if (!k || !q.includes(k)) continue;
      // Clés plus longues / spécifiques pèsent plus (évite que « plan » gagne sur « godilles »)
      score += 1 + Math.min(4, Math.floor(k.length / 3));
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  return bestScore > 0 ? best.answer : FALLBACK;
}

const WELCOME = {
  role: "bot",
  text: "Bonjour, assistance MySWYM. Questions produit ou natation (zones, allures, D…/R…, éducatifs…) : pose la tienne ou tape une suggestion.",
};

/**
 * Bulle support — FAQ autonome + contact équipe.
 * Visible sur l'app (au-dessus de la bottom nav).
 */
export default function SupportBubble({ aboveBottomNav = false }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home"); // home | chat | contact
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const listRef = useRef(null);
  const typingTimer = useRef(null);

  useEffect(() => {
    if (!open || view !== "chat") return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing, open, view]);

  useEffect(() => () => clearTimeout(typingTimer.current), []);

  const close = () => {
    setOpen(false);
    clearTimeout(typingTimer.current);
    setTyping(false);
  };

  const openPanel = () => {
    setView("home");
    setOpen(true);
  };

  const send = (raw) => {
    const text = (raw ?? input).trim();
    if (!text || typing) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text }]);
    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setMessages((m) => [...m, { role: "bot", text: matchFaq(text) }]);
      setTyping(false);
    }, 420);
  };

  const padBottom = aboveBottomNav
    ? "calc(var(--bottom-nav-h, 72px) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + var(--nav-lift, 0px) + 16px)"
    : "calc(16px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))";

  return (
    <>
      <button
        type="button"
        aria-label="Aide et support"
        onClick={openPanel}
        className={aboveBottomNav ? "support-fab" : "support-fab support-fab--bare"}
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "none",
          background: "#006bfd",
          color: "#fff",
          boxShadow: "0 8px 28px rgba(53,93,163,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MessageCircle size={24} color="#fff" />
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aide MySWYM"
          className="sheet-overlay"
          style={{
            zIndex: 250,
            padding: 16,
            paddingBottom: padBottom,
            alignItems: "center",
            justifyContent: "flex-end",
          }}
          onClick={close}
        >
          <div
            className="sheet-panel"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#06101f",
              borderRadius: 24,
              padding: view === "chat" ? "16px 16px 14px" : "22px 20px 20px",
              boxShadow: "0 20px 60px rgba(53,93,163,0.22)",
              fontFamily: FONT,
              display: "flex",
              flexDirection: "column",
              maxHeight: "min(78vh, 560px)",
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: view === "chat" ? 10 : 12, gap: 8 }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0 }}>
                {view !== "home" && (
                  <button
                    type="button"
                    aria-label="Retour"
                    onClick={() => setView("home")}
                    style={{ background: "#0a162c", border: "none", borderRadius: 10, width: 40, height: 40, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: 2 }}
                  >
                    <ArrowLeft size={17} color="#9bb0c8" />
                  </button>
                )}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#9bb0c8", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 6 }}>
                    Support
                  </div>
                  <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: "#f4f8fa", lineHeight: 1.2 }}>
                    {view === "chat" ? "Assistance rapide" : view === "contact" ? "Contacter l'équipe" : "Besoin d'aide ?"}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                aria-label="Fermer"
                onClick={close}
                style={{ background: "#0a162c", border: "none", borderRadius: 10, width: 44, height: 44, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
              >
                <X size={18} color="#9bb0c8" />
              </button>
            </div>

            {view === "home" && (
              <>
                <p style={{ fontSize: 15, color: "#9bb0c8", lineHeight: 1.55, margin: "0 0 18px" }}>
                  Questions produit ou vocabulaire natation : réponses immédiates, ou message direct à l'équipe.
                </p>

                <button
                  type="button"
                  onClick={() => setView("chat")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "14px 16px",
                    minHeight: 56,
                    borderRadius: 14,
                    background: "#006bfd",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT,
                    textAlign: "left",
                    marginBottom: 10,
                  }}
                >
                  <MessageCircle size={18} color="#fff" style={{ flexShrink: 0 }} />
                  <span>
                    Assistance rapide
                    <span style={{ display: "block", fontWeight: 500, fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                      Produit & natation · réponses instantanées
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setView("contact")}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    width: "100%",
                    padding: "14px 16px",
                    minHeight: 56,
                    borderRadius: 14,
                    background: "#0a162c",
                    color: "#f4f8fa",
                    fontWeight: 700,
                    fontSize: 15,
                    border: "none",
                    cursor: "pointer",
                    fontFamily: FONT,
                    textAlign: "left",
                  }}
                >
                  <Mail size={18} color="#006bfd" style={{ flexShrink: 0 }} />
                  <span>
                    Contacter l'équipe
                    <span style={{ display: "block", fontWeight: 500, fontSize: 12, color: "#9bb0c8", marginTop: 2 }}>
                      {SUPPORT_EMAIL}
                    </span>
                  </span>
                </button>
              </>
            )}

            {view === "contact" && (
              <>
                <p style={{ fontSize: 15, color: "#9bb0c8", lineHeight: 1.55, margin: "0 0 18px" }}>
                  Question sur une séance, suggestion ou souci technique. L'équipe répond sous 24-48 h ouvrées à {SUPPORT_EMAIL}.
                </p>
                <a
                  href={withLocalePrefix("/contact", getStoredLanguage())}
                  onClick={close}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    width: "100%",
                    padding: "14px 16px",
                    minHeight: 48,
                    borderRadius: 14,
                    background: "#006bfd",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 15,
                    textDecoration: "none",
                  }}
                >
                  <Mail size={18} color="#fff" />
                  Écrire via le formulaire
                </a>
              </>
            )}

            {view === "chat" && (
              <>
                <div
                  ref={listRef}
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    minHeight: 180,
                    maxHeight: 280,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    padding: "4px 2px 8px",
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  {messages.map((msg, i) => (
                    <div
                      key={`${msg.role}-${i}`}
                      style={{
                        alignSelf: msg.role === "user" ? "flex-end" : "flex-start",
                        maxWidth: "88%",
                        background: msg.role === "user" ? "#006bfd" : "#0a162c",
                        color: msg.role === "user" ? "#fff" : "#f4f8fa",
                        borderRadius: msg.role === "user" ? "14px 14px 4px 14px" : "14px 14px 14px 4px",
                        padding: "10px 13px",
                        fontSize: 14,
                        lineHeight: 1.5,
                        fontWeight: 500,
                      }}
                    >
                      {msg.text}
                    </div>
                  ))}
                  {typing && (
                    <div
                      style={{
                        alignSelf: "flex-start",
                        background: "#0a162c",
                        color: "#9bb0c8",
                        borderRadius: "14px 14px 14px 4px",
                        padding: "10px 14px",
                        fontSize: 13,
                        fontWeight: 600,
                        letterSpacing: "0.12em",
                      }}
                      aria-live="polite"
                    >
                      …
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={typing}
                      onClick={() => send(p)}
                      style={{
                        border: "1px solid rgba(53,93,163,0.22)",
                        background: "#06101f",
                        color: "#3d8fff",
                        borderRadius: 999,
                        padding: "7px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: typing ? "default" : "pointer",
                        fontFamily: FONT,
                        opacity: typing ? 0.55 : 1,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ta question…"
                    aria-label="Ta question"
                    disabled={typing}
                    style={{
                      flex: 1,
                      minHeight: 44,
                      borderRadius: 12,
                      border: "1.5px solid rgba(0,107,253,0.28)",
                      padding: "10px 14px",
                      fontSize: 15,
                      fontFamily: FONT,
                      color: "#f4f8fa",
                      outline: "none",
                      background: "#06101f",
                    }}
                  />
                  <button
                    type="submit"
                    aria-label="Envoyer"
                    disabled={typing || !input.trim()}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: "none",
                      background: input.trim() && !typing ? "#006bfd" : "rgba(0,107,253,0.22)",
                      color: "#fff",
                      cursor: input.trim() && !typing ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Send size={17} color="#fff" />
                  </button>
                </form>

                <button
                  type="button"
                  onClick={() => setView("contact")}
                  style={{
                    width: "100%",
                    marginTop: 8,
                    padding: "10px",
                    minHeight: 40,
                    background: "none",
                    border: "none",
                    color: "#006bfd",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    fontFamily: FONT,
                  }}
                >
                  Parler à l'équipe →
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
