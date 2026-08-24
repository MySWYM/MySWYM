import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Mail, MessageCircle, Send, X } from "lucide-react";
import { withLocalePrefix } from "./i18n/locale-path.js";
import { getStoredLanguage } from "./i18n/index.js";
import { PRICING_SUMMARY_FR } from "./lib/pricing.js";
import { closeSupportLive, fetchSupportThread, sendSupportLive } from "./lib/support-api.js";

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
      `À la création du compte : essai Premium ${TRIAL_DAYS} jours sans carte. Ensuite tes séances se mettent en pause jusqu'à l'abonnement. ${PRICING_SUMMARY_FR}. Détails sur la page Tarifs.`,
  },
  {
    keys: ["annul", "résili", "resili", "stop", "désabon", "desabon", "rembours"],
    answer:
      `L'essai 7 jours ne demande pas de carte : il s'arrête tout seul et tes séances se mettent en pause. Ensuite : ${PRICING_SUMMARY_FR}. L'annuel est un prépaiement : pas de remboursement une fois facturé (hors cas légaux).`,
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
      "Les allures cibles partent de ton seul T100 (meilleur 100 m, départ dans l'eau), plus de T400. Pendant l'essai et en Premium : @mm:ss à côté des zones. Après l'essai sans abo, tes séances sont en pause. Les coefficients s'adaptent : plus tu es rapide, plus les bandes aérobie sont calibrées.",
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
  "Pas de réponse auto pour celle-ci. J’envoie ça à Arthur — il te répond ici.";

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
  text: "Bonjour, assistance MySWYM. Questions produit ou natation (zones, allures, D…/R…, éducatifs…) : pose la tienne ou tape une suggestion. Pour un souci perso, écris à Arthur ici — la conversation reste ouverte tant que tu ne la clôtures pas.",
};

function wantsHuman(text) {
  return /\b(parler\s+(à|a)\s+|contacter\s+(l['’]?équipe|arthur)|un\s+humain|l['’]équipe|aide\s+humaine)\b/i.test(
    String(text || ""),
  );
}

function toBubbleMessages(rows) {
  return (rows || []).map((m) => ({
    id: m.id,
    role: m.role === "assistant" ? "bot" : m.role,
    text: m.body || m.text || "",
  }));
}

function seenStorageKey(userId) {
  return `myswym_support_seen_${userId || "anon"}`;
}

function readSeenId(userId) {
  try {
    return localStorage.getItem(seenStorageKey(userId)) || "";
  } catch {
    return "";
  }
}

function writeSeenId(userId, messageId) {
  if (!messageId) return;
  try {
    localStorage.setItem(seenStorageKey(userId), messageId);
  } catch {
    /* ignore */
  }
}

function lastAgentId(messages) {
  const agents = (messages || []).filter((m) => m.role === "agent");
  return agents.length ? agents[agents.length - 1].id : "";
}

function bubbleAlign(role) {
  if (role === "user") return "flex-end";
  if (role === "system") return "center";
  return "flex-start";
}

function bubbleColors(role) {
  if (role === "user") return { background: "#006bfd", color: "#fff" };
  if (role === "agent") return { background: "#12325c", color: "#f4f8fa" };
  if (role === "system") return { background: "transparent", color: "#9bb0c8" };
  return { background: "#0a162c", color: "#f4f8fa" };
}

function roleLabel(role) {
  if (role === "agent") return "Arthur";
  if (role === "bot") return "Assistance";
  return "";
}

/**
 * Bulle support — FAQ instantanée, puis fil persisté avec Arthur (Telegram).
 */
export default function SupportBubble({ aboveBottomNav = false, user = null }) {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState("home"); // home | chat | contact
  const [faqMessages, setFaqMessages] = useState([WELCOME]);
  const [thread, setThread] = useState({ conversation: null, messages: [] });
  const [startFresh, setStartFresh] = useState(false);
  const [forceLive, setForceLive] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(false);
  const listRef = useRef(null);
  const typingTimer = useRef(null);
  const userId = user?.id || null;

  const conversation = thread.conversation;
  const liveOpen = conversation?.status === "open";
  const showClosed = conversation?.status === "closed" && !startFresh;
  const liveMode = liveOpen || showClosed;
  const messages = liveMode ? toBubbleMessages(thread.messages) : faqMessages;

  const applyThread = (json, { markSeen = false } = {}) => {
    if (!json?.ok) return;
    const nextMessages = json.messages || [];
    setThread({
      conversation: json.conversation || null,
      messages: nextMessages,
    });
    const agentId = lastAgentId(nextMessages);
    if (markSeen) {
      writeSeenId(userId, agentId);
      setUnread(false);
    } else if (agentId && agentId !== readSeenId(userId)) {
      setUnread(true);
    } else {
      setUnread(false);
    }
  };

  const refreshThread = async ({ markSeen = false } = {}) => {
    const json = await fetchSupportThread();
    applyThread(json, { markSeen });
    return json;
  };

  useEffect(() => {
    if (!userId) return undefined;
    let cancelled = false;
    fetchSupportThread().then((json) => {
      if (!cancelled) applyThread(json, { markSeen: false });
    });
    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || open) return undefined;
    const interval = window.setInterval(() => {
      fetchSupportThread().then((json) => applyThread(json, { markSeen: false }));
    }, 20000);
    return () => window.clearInterval(interval);
  }, [userId, open]);

  useEffect(() => {
    if (!open || view !== "chat") return undefined;
    refreshThread({ markSeen: true });
    const interval = window.setInterval(() => {
      refreshThread({ markSeen: true });
    }, liveOpen ? 4000 : 12000);
    return () => window.clearInterval(interval);
  }, [open, view, liveOpen, userId]);

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
    setError("");
  };

  const openChat = (opts = {}) => {
    setView("chat");
    setError("");
    if (opts.fresh) setStartFresh(true);
    if (opts.live) setForceLive(true);
  };

  const escalate = async (text, prior) => {
    setSending(true);
    setError("");
    try {
      const json = await sendSupportLive(text, prior);
      if (!json.ok) {
        setInput(text);
        setError(json.error || "Impossible d’envoyer. Réessaie ou écris à contact@myswym.app.");
        return false;
      }
      setStartFresh(false);
      setForceLive(false);
      applyThread(json, { markSeen: true });
      return true;
    } catch {
      setInput(text);
      setError("Impossible d’envoyer. Réessaie ou écris à contact@myswym.app.");
      return false;
    } finally {
      setSending(false);
    }
  };

  const send = async (raw) => {
    const text = (raw ?? input).trim();
    if (!text || typing || sending) return;
    setInput("");

    if (liveOpen) {
      await escalate(text);
      return;
    }

    if (showClosed) {
      setError("Cette conversation est clôturée. Ouvre-en une nouvelle pour écrire à Arthur.");
      return;
    }

    const prior = faqMessages.map((m) => ({
      role: m.role,
      text: m.text,
    }));
    const goLive = forceLive || wantsHuman(text) || matchFaq(text) === FALLBACK;

    setFaqMessages((m) => [...m, { role: "user", text }]);

    if (goLive) {
      const ok = await escalate(text, prior);
      if (!ok) {
        setFaqMessages((m) => [...m, { role: "bot", text: FALLBACK }]);
      }
      return;
    }

    setTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      setFaqMessages((m) => [...m, { role: "bot", text: matchFaq(text) }]);
      setTyping(false);
    }, 420);
  };

  const closeThread = async () => {
    if (!conversation?.id || !liveOpen) return;
    setSending(true);
    const json = await closeSupportLive(conversation.id);
    setSending(false);
    if (json.ok) applyThread(json, { markSeen: true });
    else setError(json.error || "Impossible de clôturer.");
  };

  const padBottom = aboveBottomNav
    ? "calc(var(--bottom-nav-h, 72px) + var(--safe-bottom, env(safe-area-inset-bottom, 0px)) + var(--nav-lift, 0px) + 16px)"
    : "calc(16px + var(--safe-bottom, env(safe-area-inset-bottom, 0px)))";

  const chatTitle = liveOpen
    ? "Conversation avec Arthur"
    : showClosed
      ? "Conversation clôturée"
      : "Assistance rapide";

  const busy = typing || sending;


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
          position: "relative",
        }}
      >
        <MessageCircle size={24} color="#fff" />
        {unread ? (
          <span
            aria-label="Nouveau message"
            style={{
              position: "absolute",
              top: 8,
              right: 8,
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "#ff5a3d",
              border: "2px solid #006bfd",
            }}
          />
        ) : null}
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
                    {view === "chat" ? chatTitle : view === "contact" ? "Contacter l'équipe" : "Besoin d'aide ?"}
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
                  Questions produit ou vocabulaire natation : réponses immédiates. Pour un souci perso, écris à Arthur — le fil reste ouvert jusqu’à clôture.
                </p>

                <button
                  type="button"
                  onClick={() => openChat({ fresh: false })}
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
                    {liveOpen ? "Continuer la conversation" : "Assistance rapide"}
                    <span style={{ display: "block", fontWeight: 500, fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                      {liveOpen ? "Arthur te répond ici" : "Produit & natation · réponses instantanées"}
                    </span>
                  </span>
                </button>

                {!liveOpen ? (
                <button
                  type="button"
                  onClick={() => openChat({ fresh: showClosed, live: true })}
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
                    marginBottom: 10,
                  }}
                >
                  <MessageCircle size={18} color="#006bfd" style={{ flexShrink: 0 }} />
                  <span>
                    Écrire à Arthur
                    <span style={{ display: "block", fontWeight: 500, fontSize: 12, color: "#9bb0c8", marginTop: 2 }}>
                      Conversation longue, réponse en live
                    </span>
                  </span>
                </button>
                ) : null}

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
                  {messages.map((msg, i) => {
                    const colors = bubbleColors(msg.role);
                    const label = roleLabel(msg.role);
                    return (
                      <div
                        key={msg.id || `${msg.role}-${i}`}
                        style={{
                          alignSelf: bubbleAlign(msg.role),
                          maxWidth: msg.role === "system" ? "100%" : "88%",
                          background: colors.background,
                          color: colors.color,
                          borderRadius:
                            msg.role === "user"
                              ? "14px 14px 4px 14px"
                              : msg.role === "system"
                                ? 0
                                : "14px 14px 14px 4px",
                          padding: msg.role === "system" ? "4px 6px" : "10px 13px",
                          fontSize: msg.role === "system" ? 12 : 14,
                          lineHeight: 1.5,
                          fontWeight: 500,
                          textAlign: msg.role === "system" ? "center" : "left",
                        }}
                      >
                        {label ? (
                          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", opacity: 0.7, marginBottom: 4 }}>
                            {label}
                          </div>
                        ) : null}
                        {msg.text}
                      </div>
                    );
                  })}
                  {(typing || sending) && (
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

                {error ? (
                  <p style={{ color: "#ff8a75", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>{error}</p>
                ) : null}

                {!liveMode && !forceLive ? (
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {QUICK_PROMPTS.map((p) => (
                    <button
                      key={p}
                      type="button"
                      disabled={busy}
                      onClick={() => send(p)}
                      style={{
                        border: "1px solid rgba(53,93,163,0.22)",
                        background: "#06101f",
                        color: "#3d8fff",
                        borderRadius: 999,
                        padding: "7px 12px",
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: busy ? "default" : "pointer",
                        fontFamily: FONT,
                        opacity: busy ? 0.55 : 1,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
                ) : null}

                {showClosed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStartFresh(true);
                      setFaqMessages([WELCOME]);
                      setError("");
                    }}
                    style={{
                      width: "100%",
                      marginBottom: 8,
                      padding: "12px 14px",
                      minHeight: 44,
                      borderRadius: 12,
                      border: "none",
                      background: "#006bfd",
                      color: "#fff",
                      fontWeight: 700,
                      fontSize: 14,
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Nouvelle conversation
                  </button>
                ) : (
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
                    placeholder={liveOpen || forceLive ? "Écrire à Arthur…" : "Ta question…"}
                    aria-label={liveOpen || forceLive ? "Écrire à Arthur" : "Ta question"}
                    disabled={busy}
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
                    disabled={busy || !input.trim()}
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      border: "none",
                      background: input.trim() && !busy ? "#006bfd" : "rgba(0,107,253,0.22)",
                      color: "#fff",
                      cursor: input.trim() && !busy ? "pointer" : "default",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <Send size={17} color="#fff" />
                  </button>
                </form>
                )}

                {liveOpen ? (
                  <button
                    type="button"
                    onClick={closeThread}
                    disabled={busy}
                    style={{
                      width: "100%",
                      marginTop: 8,
                      padding: "10px",
                      minHeight: 40,
                      background: "none",
                      border: "none",
                      color: "#9bb0c8",
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Clôturer la conversation
                  </button>
                ) : showClosed ? null : (
                <button
                  type="button"
                  onClick={() => send("Je voudrais parler à l’équipe")}
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
                  Écrire à Arthur →
                </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
