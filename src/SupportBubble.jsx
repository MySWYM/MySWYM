import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ChevronDown, ChevronRight, CircleHelp, Home, MessageCircle, Send, X } from "lucide-react";
import { PRICING_SUMMARY_FR } from "./lib/pricing.js";
import { closeSupportLive, fetchSupportThread, sendSupportLive } from "./lib/support-api.js";

const FONT = "Geist, ui-sans-serif, system-ui, sans-serif";
const TRIAL_DAYS = 7;
const BLUE = "#006bfd";
/** Thème clair du widget — contraste avec le fond sombre de l’app. */
const INK = "#0b1526";
const MUTED = "#5c6b7e";
const LINE = "rgba(11, 21, 38, 0.1)";
const SURFACE = "#ffffff";
const PAGE = "#f3f6fa";
const BUBBLE = "#e8eef5";
const ARTHUR_PHOTO = "/coach.webp";

/** FAQ rule-based — produit + vocabulaire / méthode natation MySWYM. */
const FAQ_RULES = [
  // ── Produit ──────────────────────────────────────────────
  {
    keys: ["gratuit", "free", "prix", "tarif", "coût", "cout", "abonnement", "premium", "payer", "paiement", "stripe", "combien"],
    answer:
      `À la création du compte : essai Premium ${TRIAL_DAYS} jours sans carte. Ensuite tes séances se mettent en pause jusqu'à l'abonnement. ${PRICING_SUMMARY_FR}. Détails sur la page Tarifs.`,
  },
  {
    keys: [
      "annuler abonnement",
      "se désabonner",
      "se desabonner",
      "désabonner",
      "desabonner",
      "désabonnement",
      "desabonnement",
      "gérer mon abonnement",
      "gerer mon abonnement",
      "annuler l'abonnement",
      "annuler l’abonnement",
      "annulation",
      "annuler",
      "résilier",
      "resilier",
      "résiliation",
      "resiliation",
      "rembours",
    ],
    answer:
      "Pour te désabonner : dans l’app, ouvre Profil (icône en bas) → le menu Paramètres → « Gérer mon abonnement ». Tu arrives sur Stripe : choisis Annuler l’abonnement. Tu restes Premium jusqu’à la fin de la période déjà payée, puis tes séances se mettent en pause (plus de prélèvement). Essai 7 jours sans carte : rien à résilier, ça s’arrête tout seul. Offre 4,99€/mois : engagement 12 mois. Annuel 52,99€ : déjà payé pour l’année, pas de remboursement au prorata (hors cas légaux). Supprimer le compte ne coupe pas l’abonnement : passe d’abord par « Gérer mon abonnement ».",
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
    keys: ["contact", "humain", "équipe", "equipe", "écrire", "ecrire", "mail", "email", "support", "arthur"],
    answer:
      "Pour une question perso ou un souci sur une séance, écris ici. Arthur te répond dans cette conversation.",
  },
  {
    keys: ["compte", "connexion", "mot de passe", "inscription", "supprimer"],
    answer:
      "Connexion et inscription via /connexion et /inscription. Pour supprimer ton compte : Profil → Paramètres → « Supprimer mon compte ». Un souci ? Écris ici, Arthur te répond dans cette conversation.",
  },

  // ── Natation / méthode ───────────────────────────────────
  {
    keys: ["zone", "z1", "z2", "z3", "z4", "intensité", "intensite", "filière", "filiere"],
    answer:
      "Les zones guident l'effort : Z1 = aisance / récup active, Z2 = endurance aéro, Z3 = seuil (soutenu mais régulier), Z4 = vitesse / VO2.",
  },
  {
    keys: ["allure", "t100", "temps 100", "pace", "@", "mm:ss", "chron"],
    answer:
      "Les allures cibles partent de ton seul T100 (meilleur 100 m, départ dans l'eau). Pendant l'essai et en Premium : @mm:ss à côté des zones. Plus tu es rapide, plus les bandes aérobie sont calibrées.",
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
      "Les godilles (sculling) : petits mouvements de main pour sentir l'appui et l'eau.",
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
      score += 1 + Math.min(4, Math.floor(k.length / 3));
    }
    if (score > bestScore) {
      bestScore = score;
      best = rule;
    }
  }
  return bestScore > 0 ? best.answer : FALLBACK;
}

const HELP_ARTICLES = [
  { title: "Essai, prix et abonnement", q: "prix abonnement" },
  { title: "Annuler ou se désabonner", q: "se désabonner" },
  { title: "Comment ça marche ?", q: "comment ça marche" },
  { title: "Zones Z1 à Z4", q: "zones z1 z2" },
  { title: "Allures et T100", q: "allure t100" },
  { title: "D… ou R… ?", q: "départ chronométré repos" },
  { title: "Godilles", q: "godilles" },
  { title: "Changer d’objectif", q: "changer objectif onboarding" },
].map((a) => ({ title: a.title, answer: matchFaq(a.q) }));

const WELCOME = {
  role: "bot",
  text: "Salut ! Tu parles à l’assistance MySWYM. Je peux t’aider sur le produit et la natation. Tu peux demander l’équipe à tout moment — Arthur te répond ici.",
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

function lastPreview(messages) {
  const rows = messages || [];
  for (let i = rows.length - 1; i >= 0; i -= 1) {
    const t = (rows[i].body || rows[i].text || "").trim();
    if (t) return t;
  }
  return "";
}

function bubbleAlign(role) {
  if (role === "user") return "flex-end";
  if (role === "system") return "center";
  return "flex-start";
}

function bubbleColors(role) {
  if (role === "user") return { background: BLUE, color: "#fff", border: "none" };
  if (role === "agent") return { background: BUBBLE, color: INK, border: "none" };
  if (role === "system") return { background: "transparent", color: MUTED, border: "none" };
  return { background: BUBBLE, color: INK, border: "none" };
}

function roleLabel(role) {
  if (role === "agent") return "Arthur";
  if (role === "bot") return "Assistance";
  return "";
}

function firstNameOf(user) {
  const raw = user?.user_metadata?.firstname || user?.user_metadata?.first_name || "";
  return String(raw).trim();
}

function formatConvWhen(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const date = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date} · ${time}`;
}

function ArthurAvatar({ size = 44, radius = 12 }) {
  return (
    <img
      src={ARTHUR_PHOTO}
      alt=""
      width={size}
      height={size}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        objectFit: "cover",
        objectPosition: "center 20%",
        display: "block",
        flexShrink: 0,
        background: BLUE,
      }}
    />
  );
}

const iconBtn = {
  width: 36,
  height: 36,
  border: "none",
  background: "transparent",
  borderRadius: 10,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

/**
 * Widget support type Intercom : Accueil / Aide / Messages, chat persisté vers Arthur.
 */
export default function SupportBubble({ aboveBottomNav = false, user = null }) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState("messages");
  const [view, setView] = useState("tabs");
  const [faqMessages, setFaqMessages] = useState([WELCOME]);
  const [thread, setThread] = useState({ conversation: null, messages: [] });
  const [conversations, setConversations] = useState([]);
  const [startFresh, setStartFresh] = useState(false);
  const [forceLive, setForceLive] = useState(false);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(false);
  const [helpOpen, setHelpOpen] = useState(null);
  const listRef = useRef(null);
  const typingTimer = useRef(null);
  const activeIdRef = useRef(null);
  const startFreshRef = useRef(false);
  const fetchGen = useRef(0);
  const userId = user?.id || null;
  const firstName = firstNameOf(user);

  const conversation = thread.conversation;
  const liveOpen = conversation?.status === "open";
  const showClosed = conversation?.status === "closed" && !startFresh;
  const liveMode = liveOpen || showClosed;
  const messages = liveMode ? toBubbleMessages(thread.messages) : faqMessages;
  const history = conversations.length ? conversations : (thread.conversation ? [thread.conversation] : []);
  const hasHistory = history.length > 0;
  const openConversation = history.find((c) => c.status === "open") || null;
  const busy = typing || sending;

  const applyThread = (json, { markSeen = false, pin = false } = {}) => {
    if (!json?.ok) return;
    const incoming = json.conversation || null;
    const nextMessages = json.messages || [];
    const nextList = json.conversations || [];
    if (Array.isArray(json.conversations)) setConversations(nextList);
    if (!pin && startFreshRef.current) return;
    if (!pin && activeIdRef.current && incoming?.id && incoming.id !== activeIdRef.current) {
      return;
    }
    setThread({
      conversation: incoming,
      messages: nextMessages,
    });
    if (incoming?.id) activeIdRef.current = incoming.id;
    const agentId =
      lastAgentId(nextMessages) ||
      nextList.find((c) => c.last_role === "agent")?.last_message_id ||
      "";
    if (markSeen) {
      writeSeenId(userId, agentId);
      setUnread(false);
    } else if (agentId && agentId !== readSeenId(userId)) {
      setUnread(true);
    } else {
      setUnread(false);
    }
  };

  const refreshThread = async ({ markSeen = false, conversationId } = {}) => {
    if (startFreshRef.current && !conversationId) return null;
    const gen = ++fetchGen.current;
    const id = conversationId ?? activeIdRef.current;
    const json = await fetchSupportThread(id || undefined);
    if (gen !== fetchGen.current) return json;
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
    if (!open || view !== "chat" || startFresh) return undefined;
    refreshThread({ markSeen: true });
    const interval = window.setInterval(() => {
      refreshThread({ markSeen: true });
    }, liveOpen ? 4000 : 12000);
    return () => window.clearInterval(interval);
  }, [open, view, liveOpen, userId, startFresh]);

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
    if (open) {
      close();
      return;
    }
    setView("tabs");
    setTab("messages");
    setOpen(true);
    setError("");
  };

  const beginFresh = () => {
    fetchGen.current += 1;
    startFreshRef.current = true;
    setStartFresh(true);
    setForceLive(false);
    setFaqMessages([WELCOME]);
    setError("");
    activeIdRef.current = null;
    setThread({ conversation: null, messages: [] });
  };

  const openChat = (opts = {}) => {
    setView("chat");
    setError("");
    if (opts.fresh) beginFresh();
    if (opts.live) setForceLive(true);
  };

  const openHistory = (conv) => {
    if (!conv?.id) {
      openChat({ fresh: true });
      return;
    }
    fetchGen.current += 1;
    startFreshRef.current = false;
    setStartFresh(false);
    setForceLive(false);
    setError("");
    activeIdRef.current = conv.id;
    setView("chat");
    fetchSupportThread(conv.id).then((json) => applyThread(json, { markSeen: true, pin: true }));
  };

  const backToTabs = () => {
    setView("tabs");
    setTab("messages");
    setForceLive(false);
    setError("");
  };

  const escalate = async (text, prior) => {
    setSending(true);
    setError("");
    try {
      const json = await sendSupportLive(text, prior);
      if (!json.ok) {
        setInput(text);
        setError(json.error || "Impossible d’envoyer. Réessaie dans un instant.");
        return false;
      }
      fetchGen.current += 1;
      if (json.conversation?.id) activeIdRef.current = json.conversation.id;
      startFreshRef.current = false;
      setStartFresh(false);
      setForceLive(false);
      applyThread(json, { markSeen: true, pin: true });
      if (!Array.isArray(json.conversations)) {
        await refreshThread({ markSeen: true, conversationId: json.conversation?.id });
      }
      return true;
    } catch {
      setInput(text);
      setError("Impossible d’envoyer. Réessaie dans un instant.");
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
      setError("Cette conversation est clôturée. Ouvre-en une nouvelle.");
      return;
    }

    const prior = faqMessages.map((m) => ({ role: m.role, text: m.text }));
    const goLive = forceLive || wantsHuman(text) || matchFaq(text) === FALLBACK;
    setFaqMessages((m) => [...m, { role: "user", text }]);

    if (goLive) {
      const ok = await escalate(text, prior);
      if (!ok) setFaqMessages((m) => [...m, { role: "bot", text: FALLBACK }]);
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
    if (json.ok) {
      applyThread(json, { markSeen: true });
      if (!Array.isArray(json.conversations)) {
        await refreshThread({ markSeen: true, conversationId: conversation.id });
      }
    } else setError(json.error || "Impossible de clôturer.");
  };

  const askQuestion = () => {
    if (openConversation) openHistory(openConversation);
    else openChat({ fresh: true });
  };

  const tabBtn = (id, label, Icon) => {
    const active = tab === id;
    return (
      <button
        key={id}
        type="button"
        onClick={() => setTab(id)}
        aria-current={active ? "page" : undefined}
        style={{
          flex: 1,
          minHeight: 56,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: active ? BLUE : MUTED,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 4,
          fontFamily: FONT,
          fontSize: 11,
          fontWeight: 600,
        }}
      >
        <span style={{ position: "relative", display: "inline-flex" }}>
          <Icon size={20} color={active ? BLUE : MUTED} />
          {id === "messages" && unread ? (
            <span
              aria-hidden
              style={{
                position: "absolute",
                top: -2,
                right: -4,
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ff5a3d",
              }}
            />
          ) : null}
        </span>
        {label}
      </button>
    );
  };

  const AskButton = ({ label = "Poser une question" }) => (
    <button
      type="button"
      onClick={askQuestion}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 44,
        padding: "10px 18px",
        borderRadius: 999,
        border: "none",
        background: BLUE,
        color: "#fff",
        fontWeight: 700,
        fontSize: 14,
        cursor: "pointer",
        fontFamily: FONT,
      }}
    >
      {label}
      <MessageCircle size={16} color="#fff" />
    </button>
  );

  return (
    <>
      <button
        type="button"
        aria-label={open ? "Fermer l’aide" : "Aide et support"}
        aria-expanded={open}
        onClick={openPanel}
        className={aboveBottomNav ? "support-fab" : "support-fab support-fab--bare"}
        style={{
          width: 54,
          height: 54,
          borderRadius: "50%",
          border: "none",
          background: BLUE,
          color: "#fff",
          boxShadow: "0 8px 28px rgba(53,93,163,0.35)",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {open ? <ChevronDown size={26} color="#fff" /> : <MessageCircle size={24} color="#fff" />}
        {!open && unread ? (
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
              border: `2px solid ${BLUE}`,
            }}
          />
        ) : null}
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Aide MySWYM"
          className={aboveBottomNav ? "support-widget" : "support-widget support-widget--bare"}
          style={{ fontFamily: FONT, color: INK }}
        >
          {view === "chat" ? (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "10px 8px 10px 4px",
                  borderBottom: `1px solid ${LINE}`,
                  background: SURFACE,
                }}
              >
                <button type="button" aria-label="Retour" onClick={backToTabs} style={iconBtn}>
                  <ArrowLeft size={18} color={MUTED} />
                </button>
                <ArthurAvatar size={32} radius={8} />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 800, fontSize: 15, lineHeight: 1.2 }}>
                    Arthur
                  </div>
                  <div style={{ fontSize: 12, color: MUTED, marginTop: 1 }}>
                    L’équipe peut aussi aider
                  </div>
                </div>
                <button type="button" aria-label="Fermer" onClick={close} style={iconBtn}>
                  <X size={18} color={MUTED} />
                </button>
              </div>

              <div
                ref={listRef}
                style={{
                  flex: 1,
                  overflowY: "auto",
                  minHeight: 0,
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: "14px 14px 8px",
                  background: PAGE,
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
                        border: colors.border,
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
                        <div
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            letterSpacing: "0.06em",
                            textTransform: "uppercase",
                            color: MUTED,
                            marginBottom: 4,
                          }}
                        >
                          {label}
                        </div>
                      ) : null}
                      {msg.text}
                    </div>
                  );
                })}
                {busy ? (
                  <div
                    style={{
                      alignSelf: "flex-start",
                      background: BUBBLE,
                      border: "none",
                      color: MUTED,
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
                ) : null}
              </div>

              <div style={{ padding: "10px 12px 12px", background: SURFACE, borderTop: `1px solid ${LINE}` }}>
                {error ? (
                  <p style={{ color: "#c2410c", fontSize: 12, fontWeight: 600, margin: "0 0 8px" }}>{error}</p>
                ) : null}
                {showClosed ? (
                  <button
                    type="button"
                    onClick={() => beginFresh()}
                    style={{
                      width: "100%",
                      minHeight: 44,
                      borderRadius: 12,
                      border: "none",
                      background: BLUE,
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
                      placeholder="Poser une question…"
                      aria-label="Poser une question"
                      disabled={busy}
                      style={{
                        flex: 1,
                        minHeight: 44,
                        borderRadius: 12,
                        border: `1px solid ${LINE}`,
                        padding: "10px 14px",
                        fontSize: 15,
                        fontFamily: FONT,
                        color: INK,
                        outline: "none",
                        background: PAGE,
                      }}
                    />
                    <button
                      type="submit"
                      aria-label="Envoyer"
                      disabled={busy || !input.trim()}
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: "50%",
                        border: "none",
                        background: input.trim() && !busy ? BLUE : "#c5ced9",
                        color: "#fff",
                        cursor: input.trim() && !busy ? "pointer" : "default",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Send size={16} color="#fff" />
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
                      marginTop: 6,
                      padding: "8px",
                      minHeight: 40,
                      background: "none",
                      border: "none",
                      color: MUTED,
                      fontSize: 13,
                      fontWeight: 600,
                      cursor: busy ? "default" : "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    Clôturer la conversation
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "12px 10px 10px 16px",
                  borderBottom: `1px solid ${LINE}`,
                  background: SURFACE,
                }}
              >
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>
                  {tab === "home" ? "Accueil" : tab === "help" ? "Aide" : "Messages"}
                </h3>
                <button type="button" aria-label="Fermer" onClick={close} style={iconBtn}>
                  <X size={18} color={MUTED} />
                </button>
              </div>

              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflowY: "auto",
                  WebkitOverflowScrolling: "touch",
                  background: PAGE,
                }}
              >
                {tab === "home" && (
                  <div style={{ padding: "22px 18px 18px" }}>
                    <div aria-hidden style={{ marginBottom: 14 }}>
                      <ArthurAvatar size={44} radius={12} />
                    </div>
                    <h4 style={{ margin: "0 0 6px", fontSize: 22, fontWeight: 800, lineHeight: 1.2 }}>
                      {firstName ? `Salut ${firstName}` : "Salut"}
                    </h4>
                    <p style={{ margin: "0 0 18px", fontSize: 14, color: MUTED, lineHeight: 1.5 }}>
                      Comment on peut t’aider ?
                    </p>
                    {hasHistory ? (
                      <button
                        type="button"
                        onClick={() => openHistory(history[0])}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          width: "100%",
                          textAlign: "left",
                          padding: "12px 14px",
                          minHeight: 64,
                          borderRadius: 12,
                          border: `1px solid ${LINE}`,
                          background: SURFACE,
                          cursor: "pointer",
                          fontFamily: FONT,
                          marginBottom: 16,
                        }}
                      >
                        <span style={{ minWidth: 0, flex: 1 }}>
                          <span style={{ display: "block", fontWeight: 700, fontSize: 14, color: INK }}>
                            {formatConvWhen(history[0]?.updated_at) || "Dernière conversation"}
                          </span>
                          <span
                            style={{
                              display: "block",
                              fontSize: 12,
                              color: MUTED,
                              marginTop: 3,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {history[0]?.last_body || lastPreview(thread.messages) || "Continuer"}
                          </span>
                        </span>
                        <ChevronRight size={16} color={MUTED} />
                      </button>
                    ) : null}
                    <AskButton />
                  </div>
                )}

                {tab === "help" && (
                  <div style={{ padding: "8px 0 16px" }}>
                    {HELP_ARTICLES.map((article, i) => {
                      const openArticle = helpOpen === i;
                      return (
                        <div key={article.title} style={{ borderBottom: `1px solid ${LINE}` }}>
                          <button
                            type="button"
                            onClick={() => setHelpOpen(openArticle ? null : i)}
                            style={{
                              width: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              gap: 12,
                              padding: "14px 16px",
                              minHeight: 48,
                              border: "none",
                              background: "transparent",
                              cursor: "pointer",
                              fontFamily: FONT,
                              textAlign: "left",
                              color: INK,
                              fontSize: 14,
                              fontWeight: 600,
                            }}
                          >
                            {article.title}
                            <ChevronRight
                              size={16}
                              color={MUTED}
                              style={{
                                transform: openArticle ? "rotate(90deg)" : "none",
                                transition: "transform 150ms ease",
                                flexShrink: 0,
                              }}
                            />
                          </button>
                          {openArticle ? (
                            <p
                              style={{
                                margin: "0 16px 14px",
                                fontSize: 14,
                                lineHeight: 1.55,
                                color: MUTED,
                              }}
                            >
                              {article.answer}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                    <div style={{ padding: "18px 16px 4px", textAlign: "center" }}>
                      <p style={{ margin: "0 0 10px", fontSize: 13, color: MUTED }}>
                        Tu ne trouves pas ? Écris-nous.
                      </p>
                      <AskButton />
                    </div>
                  </div>
                )}

                {tab === "messages" && (
                  <div
                    style={{
                      minHeight: "100%",
                      display: "flex",
                      flexDirection: "column",
                      padding: "12px 16px 18px",
                    }}
                  >
                    {hasHistory ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                        {history.map((conv) => {
                          const preview = conv.last_body || (conv.id === conversation?.id ? lastPreview(thread.messages) : "");
                          const isOpen = conv.status === "open";
                          return (
                            <button
                              key={conv.id}
                              type="button"
                              onClick={() => openHistory(conv)}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                gap: 12,
                                width: "100%",
                                textAlign: "left",
                                padding: "14px",
                                minHeight: 72,
                                borderRadius: 12,
                                border: `1px solid ${LINE}`,
                                background: SURFACE,
                                cursor: "pointer",
                                fontFamily: FONT,
                              }}
                            >
                              <span style={{ minWidth: 0, flex: 1 }}>
                                <span style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
                                  <span style={{ fontWeight: 700, fontSize: 14, color: INK }}>
                                    {formatConvWhen(conv.updated_at)}
                                  </span>
                                  {isOpen ? (
                                    <span style={{ fontSize: 11, fontWeight: 600, color: BLUE, flexShrink: 0 }}>
                                      Ouverte
                                    </span>
                                  ) : null}
                                </span>
                                <span
                                  style={{
                                    display: "block",
                                    fontSize: 13,
                                    color: MUTED,
                                    marginTop: 3,
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {preview || (isOpen ? "Conversation en cours" : "Conversation clôturée")}
                                </span>
                              </span>
                              {unread && isOpen ? (
                                <span
                                  aria-label="Non lu"
                                  style={{
                                    width: 10,
                                    height: 10,
                                    borderRadius: "50%",
                                    background: BLUE,
                                    flexShrink: 0,
                                  }}
                                />
                              ) : (
                                <ChevronRight size={16} color={MUTED} />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div
                        style={{
                          flex: 1,
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          textAlign: "center",
                          padding: "24px 8px",
                          gap: 8,
                        }}
                      >
                        <MessageCircle size={36} color="#9aa8b6" />
                        <div style={{ fontWeight: 800, fontSize: 16, marginTop: 8 }}>Aucun message</div>
                        <p style={{ margin: "0 0 16px", fontSize: 13, color: MUTED, lineHeight: 1.5 }}>
                          Les messages de l’équipe s’affichent ici
                        </p>
                        <AskButton />
                      </div>
                    )}
                    {hasHistory && !openConversation ? (
                      <div style={{ marginTop: "auto", paddingTop: 18, textAlign: "center" }}>
                        <AskButton />
                      </div>
                    ) : null}
                  </div>
                )}
              </div>

              <nav
                aria-label="Support"
                style={{
                  display: "flex",
                  borderTop: `1px solid ${LINE}`,
                  background: SURFACE,
                }}
              >
                {tabBtn("home", "Accueil", Home)}
                {tabBtn("help", "Aide", CircleHelp)}
                {tabBtn("messages", "Messages", MessageCircle)}
              </nav>
            </>
          )}
        </div>
      )}
    </>
  );
}
