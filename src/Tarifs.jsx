import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BadgeCheck,
  Check,
  Clock3,
  ShieldCheck,
  Sparkles,
  TrendingUp,
  Waves,
  X,
} from "lucide-react";
import { supabase } from "./supabase.js";
import { trackEvent } from "./lib/analytics.js";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import BrandLogo from "./BrandLogo.jsx";

const C = {
  bg: "#f8f9fc",
  bgSoft: "#edeef1",
  bgCard: "#f2f3f6",
  ink: "#191c1e",
  secondary: "#5d5e61",
  primary: "#355da3",
  primaryDeep: "#154388",
  primaryFix: "#d8e2ff",
  outlineVar: "#c3c6d2",
  white: "#ffffff",
  accent: "#8eb3ff",
  accentText: "#154388",
  border: "rgba(53,93,163,0.08)",
  shadow: "0 2px 12px rgba(142,179,255,0.10)",
  shadowLg: "0 20px 60px rgba(12,26,46,0.18)",
  night: "#0c1a2e",
};

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href =
      "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(
    () => typeof window !== "undefined" && window.innerWidth < bp,
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}

function SectionEyebrow({ children, dark = false }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 14px",
        borderRadius: 999,
        background: dark ? "rgba(142,179,255,0.14)" : C.primaryFix,
        color: dark ? C.accent : C.primary,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "0.08em",
        fontFamily: FONT,
      }}
    >
      {children}
    </div>
  );
}

function CheckItem({ children, dark = false }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
      <Check
        size={16}
        color={dark ? C.accent : C.primary}
        style={{ marginTop: 2, flexShrink: 0 }}
      />
      <span
        style={{
          color: dark ? "rgba(255,255,255,0.86)" : C.secondary,
          fontSize: 14,
          lineHeight: 1.55,
          fontFamily: FONT,
        }}
      >
        {children}
      </span>
    </div>
  );
}

function FeatureCell({ value, premium = false }) {
  if (value === false) {
    return <X size={16} color="rgba(93,94,97,0.55)" aria-hidden />;
  }
  if (value === true) {
    return <Check size={16} color={premium ? C.primaryDeep : C.primary} aria-hidden />;
  }
  return (
    <span
      style={{
        color: premium ? C.ink : C.secondary,
        fontSize: 14,
        lineHeight: 1.45,
        fontWeight: premium ? 700 : 500,
        fontFamily: FONT,
      }}
    >
      {value}
    </span>
  );
}

function CompactTableValue({ value, premium = false }) {
  const positive = value === "Oui" || value === "Complet" || value === "Jusqu'à 52 semaines";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "8px 10px",
        borderRadius: 12,
        background: premium
          ? "rgba(53,93,163,0.10)"
          : positive
            ? "rgba(53,93,163,0.08)"
            : "#f4f5f7",
        color: premium ? C.primaryDeep : C.ink,
        fontSize: 13,
        lineHeight: 1.3,
        fontWeight: premium ? 800 : 600,
        fontFamily: FONT,
        textAlign: "center",
      }}
    >
      {value}
    </span>
  );
}

export default function TarifsPage() {
  const isMobile = useIsMobile();
  const [openFaq, setOpenFaq] = useState(0);

  useEffect(() => {
    document.title = "Tarifs MySWYM";
    window.scrollTo(0, 0);
  }, []);

  const handlePremium = async (priceId) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      try {
        const ref = new URLSearchParams(window.location.search).get("ref");
        if (ref?.trim()) localStorage.setItem("myswym_ref", ref.trim().toUpperCase());
      } catch {
        /* ignore */
      }
      trackEvent("signup_started", { source: "pricing_page" }, { essential: true });
      window.location.href = "/inscription";
      return;
    }
    try {
      trackEvent("checkout_started", { source: "pricing_page", price_id: priceId }, { essential: true });
      let referralCode;
      try {
        referralCode =
          (
            session.user?.user_metadata?.referred_by ||
            localStorage.getItem("myswym_ref") ||
            ""
          ).toUpperCase() || undefined;
      } catch {
        referralCode = undefined;
      }
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ priceId, ...(referralCode ? { referralCode } : {}) }),
        },
      );
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error || "Impossible d'ouvrir le paiement. Reessaie.");
    } catch {
      alert("Impossible d'ouvrir le paiement. Reessaie.");
    }
  };

  const PRICE_MONTHLY = "price_1TPjyPAS4mfgF2Twx3Zh4zrJ";
  const PRICE_ANNUAL = "price_1TudyVAS4mfgF2TwHiSo3Vrg";
  const PRICE_MONTHLY_LABEL = "4,99€";
  const PRICE_ANNUAL_LABEL = "39,99€";
  const annualSavings = (4.99 * 12 - 39.99).toFixed(2).replace(".", ",");

  const trialHighlights = [
    "Acces Premium complet pendant 7 jours.",
    "Carte requise · annule avant la fin = 0€.",
    "Puis 4,99€/mois sans engagement.",
  ];

  const annualHighlights = [
    "Coach personnel et programme adaptatif jusqu'au jour J.",
    "Analyses completes, recommandations et suivi avance.",
    "Strava, badges, defis et adaptation continue apres chaque seance.",
    "39,99€/an · pas de remboursement (hors cas legaux).",
  ];

  const monthlyHighlights = [
    "Acces Premium complet.",
    "Essai 7 jours · carte requise · puis 4,99€/mois.",
    "Sans engagement — annule pendant l'essai = 0€.",
  ];

  const comparisonRows = [
    ["Generation de programme", "Pendant l'essai", "Oui, a tout moment"],
    ["Consultation des seances existantes", "Oui", "Oui"],
    ["Historique", "Oui", "Oui"],
    ["Statistiques", "Completes pendant l'essai", "Statistiques avancees"],
    ["Coach personnel", true, true],
    ["Programme adaptatif", true, true],
    ["Analyses completes", true, true],
    ["Prediction des chronos", true, true],
    ["Gestion automatique de la fatigue", true, true],
    ["Adaptation apres chaque seance", true, true],
    ["Bibliotheque complete", true, true],
    ["Defis et badges", "Complet pendant l'essai", "Complet"],
    ["Synchronisation Strava", "Complete pendant l'essai", "Complete"],
    ["Nouveautes futures", true, true],
  ];

  const premiumBenefits = [
    {
      icon: TrendingUp,
      title: "Progresser plus vite",
      text: "Le Premium t'aide a t'entrainer avec des allures plus precises, des reperes plus clairs et une progression visible semaine apres semaine.",
    },
    {
      icon: Clock3,
      title: "Gagner du temps",
      text: "Tu arretes d'improviser tes contenus de seances. Tout est deja structure, lisible et pret a etre nage.",
    },
    {
      icon: Waves,
      title: "Preparer un vrai objectif",
      text: "Triathlon, eau libre, remise en forme ou performance: tu suis un plan complet, coherent, construit jusqu'au jour J.",
    },
    {
      icon: Sparkles,
      title: "Rester motive",
      text: "Historique, badges, progression et suivi de tes efforts rendent l'entrainement beaucoup plus engageant dans la duree.",
    },
  ];

  const faqItems = [
    {
      q: "Puis-je annuler a tout moment ?",
      a: "Pendant l'essai 7 jours (carte requise) : oui, tu annules depuis Stripe et tu n'es pas preleve. Ensuite le mensuel (4,99€) reste sans engagement. L'annuel (39,99€) est un prepaiement : pas de remboursement une fois facture, hors cas legaux.",
    },
    {
      q: "Puis-je commencer gratuitement ?",
      a: "Tu demarres par le questionnaire et un compte, puis un essai Premium de 7 jours avec carte (0€ pendant l'essai). Sans abo apres, tu gardes l'historique en lecture seule — pas de generation de nouveau plan.",
    },
    {
      q: "Que se passe-t-il si j'arrete mon abonnement ?",
      a: "Ton compte reste conserve. Tu gardes ton historique, ton profil et tes seances existantes, mais les fonctions Premium se verrouillent a la fin de la periode active.",
    },
    {
      q: "Puis-je synchroniser Strava plus tard ?",
      a: "Oui. La connexion Strava peut etre activee plus tard depuis ton compte, quand tu es pret.",
    },
    {
      q: "Mes donnees sont-elles conservees ?",
      a: "Oui. Tes donnees de compte, ton historique et tes preferences restent conservees selon les regles de confidentialite du service.",
    },
  ];

  return (
    <div style={{ background: C.bg, minHeight: "100vh", fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />

      <section
        style={{
          position: "relative",
          overflow: "hidden",
          padding: isMobile ? "96px 16px 48px" : "112px 20px 72px",
          background: `
            linear-gradient(180deg, rgba(12,26,46,0.96) 0%, rgba(21,67,136,0.92) 44%, rgba(248,249,252,1) 100%),
            linear-gradient(140deg, #0c1a2e 0%, #154388 46%, #8eb3ff 100%)
          `,
        }}
      >
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 20% 20%, rgba(142,179,255,0.28), transparent 35%), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.12), transparent 30%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 1120, margin: "0 auto", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1.05fr) minmax(340px, 0.95fr)",
              gap: isMobile ? 24 : 28,
              alignItems: "center",
            }}
          >
            <div>
              <div style={{ marginBottom: 18 }}>
                <BrandLogo variant="wordmark" height={isMobile ? 30 : 36} onDark />
              </div>
              <SectionEyebrow dark>PAGE TARIFS</SectionEyebrow>
              <h1
                style={{
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(40px, 6vw, 68px)",
                  lineHeight: 0.95,
                  fontWeight: 800,
                  color: C.white,
                  margin: "18px 0 16px",
                  textTransform: "uppercase",
                }}
              >
                Le Premium transforme
                <br />
                ton envie de nager
                <br />
                en vraie progression.
              </h1>
              <p
                style={{
                  color: "rgba(255,255,255,0.74)",
                  fontSize: isMobile ? 16 : 18,
                  lineHeight: 1.65,
                  margin: "0 0 24px",
                  maxWidth: 580,
                  fontFamily: FONT,
                }}
              >
                Découvre MySWYM avec l’essai 7 jours (carte requise). Le Premium te donne un
                plan complet pour progresser sérieusement, suivre
                précisément tes performances et rester régulier.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 18 }}>
                <button
                  type="button"
                  onClick={() => handlePremium(PRICE_ANNUAL)}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    minHeight: 50,
                    padding: "14px 24px",
                    borderRadius: 16,
                    border: "none",
                    background: C.accent,
                    color: C.accentText,
                    fontWeight: 800,
                    fontSize: 16,
                    fontFamily: FONT,
                    cursor: "pointer",
                    boxShadow: "0 10px 30px rgba(142,179,255,0.35)",
                  }}
                >
                  Passer Premium <ArrowRight size={16} />
                </button>
                <Link
                  to="/inscription"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 50,
                    padding: "14px 22px",
                    borderRadius: 16,
                    textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: C.white,
                    background: "rgba(255,255,255,0.08)",
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: FONT,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Essai 7 jours
                </Link>
                <Link
                  to="/inscription"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    minHeight: 50,
                    padding: "14px 22px",
                    borderRadius: 16,
                    textDecoration: "none",
                    border: "1px solid rgba(255,255,255,0.18)",
                    color: C.white,
                    background: "rgba(255,255,255,0.08)",
                    fontWeight: 700,
                    fontSize: 15,
                    fontFamily: FONT,
                    backdropFilter: "blur(10px)",
                  }}
                >
                  Creer mon compte
                </Link>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                {[
                  "Essai 7 jours · carte requise",
                  "Mensuel sans engagement",
                  `Économise ${annualSavings}€ avec l'annuel`,
                ].map((item) => (
                  <span
                    key={item}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      borderRadius: 999,
                      padding: "10px 14px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.12)",
                      color: "rgba(255,255,255,0.82)",
                      fontSize: 13,
                      fontWeight: 600,
                      fontFamily: FONT,
                    }}
                  >
                    <BadgeCheck size={14} color={C.accent} />
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.14)",
                borderRadius: 28,
                padding: isMobile ? 22 : 28,
                boxShadow: C.shadowLg,
                backdropFilter: "blur(18px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 12,
                  flexWrap: "wrap",
                  marginBottom: 18,
                }}
              >
                <div>
                  <div
                    style={{
                      color: "rgba(255,255,255,0.52)",
                      fontSize: 12,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      fontFamily: FONT,
                    }}
                  >
                    PREMIUM ANNUEL
                  </div>
                  <div
                    style={{
                      color: C.white,
                      fontSize: 28,
                      fontWeight: 800,
                      fontFamily: FONT_DISPLAY,
                      textTransform: "uppercase",
                      lineHeight: 1,
                      marginTop: 6,
                    }}
                  >
                    Le meilleur rapport qualite/prix
                  </div>
                </div>
                <div
                  style={{
                    borderRadius: 999,
                    padding: "8px 12px",
                    background: C.accent,
                    color: C.accentText,
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    fontFamily: FONT,
                    whiteSpace: "nowrap",
                  }}
                >
                  Le plus populaire
                </div>
              </div>

              <div
                style={{
                  background: "rgba(12,26,46,0.45)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 24,
                  padding: isMobile ? 18 : 20,
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
                  <span
                    style={{
                      fontSize: 60,
                      lineHeight: 0.95,
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 800,
                      color: C.white,
                    }}
                  >
                    3,33€
                  </span>
                  <span
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 15,
                      marginBottom: 10,
                      fontFamily: FONT,
                    }}
                  >
                    /mois
                  </span>
                </div>
                <p
                  style={{
                    margin: "10px 0 0",
                    color: "rgba(255,255,255,0.72)",
                    fontSize: 14,
                    lineHeight: 1.55,
                    fontFamily: FONT,
                  }}
                >
                  Paiement annuel a {PRICE_ANNUAL_LABEL} · pas de remboursement. Au lieu de 12 mois a{" "}
                  {PRICE_MONTHLY_LABEL}, tu économises {annualSavings}€ par an.
                </p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
                {annualHighlights.map((item) => (
                  <CheckItem key={item} dark>
                    {item}
                  </CheckItem>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "12px 16px 32px" : "0 20px 40px", marginTop: isMobile ? -18 : -44 }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, minmax(0, 1fr))",
            gap: 16,
            alignItems: "stretch",
          }}
        >
          <div
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 28,
              padding: isMobile ? 22 : 28,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 12, color: C.secondary, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>
              ESSAI
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: FONT_DISPLAY, textTransform: "uppercase", marginTop: 8 }}>
              7 jours Premium
            </div>
            <div style={{ fontSize: 54, lineHeight: 1, color: C.ink, fontWeight: 800, fontFamily: FONT_DISPLAY, marginTop: 16 }}>
                7j
            </div>
            <div style={{ marginTop: 6, color: C.secondary, fontSize: 14, fontFamily: FONT }}>
              Carte requise · puis 4,99€/mois · annule = 0€
            </div>
            <Link
              to="/inscription"
              style={{
                display: "block",
                textAlign: "center",
                marginTop: 22,
                padding: "14px 18px",
                borderRadius: 16,
                textDecoration: "none",
                background: C.bgCard,
                border: `1px solid ${C.outlineVar}`,
                color: C.ink,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: FONT,
              }}
            >
              Demarrer l'essai
            </Link>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
              {trialHighlights.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </div>
          </div>

          <div
            style={{
              position: "relative",
              background: C.night,
              borderRadius: 28,
              padding: isMobile ? 24 : 30,
              boxShadow: C.shadowLg,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "radial-gradient(circle at top right, rgba(142,179,255,0.28), transparent 32%), linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0))",
              }}
            />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  borderRadius: 999,
                  background: C.accent,
                  color: C.accentText,
                  fontSize: 12,
                  fontWeight: 800,
                  fontFamily: FONT,
                  marginBottom: 16,
                }}
              >
                Le plus populaire
              </div>
              <div style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>
                PREMIUM ANNUEL
              </div>
              <div style={{ fontSize: 30, fontWeight: 800, color: C.white, fontFamily: FONT_DISPLAY, textTransform: "uppercase", marginTop: 8, lineHeight: 1 }}>
                Le meilleur choix pour progresser
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 16 }}>
                <span style={{ fontSize: 60, lineHeight: 0.95, color: C.white, fontWeight: 800, fontFamily: FONT_DISPLAY }}>
                  3,33€
                </span>
                <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 15, marginBottom: 10, fontFamily: FONT }}>
                  /mois
                </span>
              </div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.72)", fontSize: 14, lineHeight: 1.55, fontFamily: FONT }}>
                {PRICE_ANNUAL_LABEL}/an · pas de remboursement. Tu économises {annualSavings}€ vs le mensuel.
              </div>
              <button
                type="button"
                onClick={() => handlePremium(PRICE_ANNUAL)}
                style={{
                  display: "inline-flex",
                  width: "100%",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 22,
                  minHeight: 52,
                  padding: "14px 18px",
                  borderRadius: 16,
                  border: "none",
                  background: C.accent,
                  color: C.accentText,
                  fontSize: 16,
                  fontWeight: 800,
                  fontFamily: FONT,
                  cursor: "pointer",
                }}
              >
                Choisir l'annuel <ArrowRight size={16} />
              </button>
              <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
                {annualHighlights.map((item) => (
                  <CheckItem key={item} dark>
                    {item}
                  </CheckItem>
                ))}
              </div>
            </div>
          </div>

          <div
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 28,
              padding: isMobile ? 22 : 28,
              boxShadow: C.shadow,
            }}
          >
            <div style={{ fontSize: 12, color: C.secondary, fontWeight: 700, letterSpacing: "0.08em", fontFamily: FONT }}>
              PREMIUM MENSUEL
            </div>
            <div style={{ fontSize: 28, fontWeight: 800, color: C.ink, fontFamily: FONT_DISPLAY, textTransform: "uppercase", marginTop: 8 }}>
              Flexible
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8, marginTop: 16 }}>
              <span style={{ fontSize: 54, lineHeight: 1, color: C.ink, fontWeight: 800, fontFamily: FONT_DISPLAY }}>
                4,99€
              </span>
              <span style={{ color: C.secondary, fontSize: 15, marginBottom: 10, fontFamily: FONT }}>
                /mois
              </span>
            </div>
            <div style={{ marginTop: 6, color: C.secondary, fontSize: 14, lineHeight: 1.55, fontFamily: FONT }}>
              Essai 7 jours avec carte, puis 4,99€/mois sans engagement.
            </div>
            <button
              type="button"
              onClick={() => handlePremium(PRICE_MONTHLY)}
              style={{
                display: "block",
                width: "100%",
                marginTop: 22,
                minHeight: 52,
                padding: "14px 18px",
                borderRadius: 16,
                border: `1px solid ${C.outlineVar}`,
                background: C.bgCard,
                color: C.ink,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: FONT,
                cursor: "pointer",
              }}
            >
              Choisir le mensuel
            </button>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 22 }}>
              {monthlyHighlights.map((item) => (
                <CheckItem key={item}>{item}</CheckItem>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "0 16px 40px" : "0 20px 44px", background: C.bg }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 24,
            boxShadow: C.shadow,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: isMobile ? "18px 16px" : "18px 22px",
              background: C.bgSoft,
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ color: C.ink, fontSize: 18, fontWeight: 800, fontFamily: FONT }}>
              Comparatif rapide
            </div>
            <div style={{ color: C.secondary, fontSize: 14, lineHeight: 1.55, marginTop: 4, fontFamily: FONT }}>
              En 10 secondes, tu comprends pourquoi le Premium change vraiment l'expérience.
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1.2fr 0.9fr 0.95fr" : "1.5fr 0.9fr 1fr",
              gap: 10,
              padding: isMobile ? "14px 16px" : "14px 22px",
              background: "#fbfcff",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ color: C.ink, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
              Fonctionnalite
            </div>
            <div style={{ color: C.secondary, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
              Essai / apres
            </div>
            <div style={{ color: C.primaryDeep, fontSize: 13, fontWeight: 800, fontFamily: FONT }}>
              Premium
            </div>
          </div>

          {[
            ["Génération de programme", "Oui pendant l'essai", "Oui"],
            ["Coach et adaptation", "Oui pendant l'essai", "Oui"],
            ["Stats et historique", "Complet pendant l'essai", "Complet"],
            ["Strava", "Complet pendant l'essai", "Complet"],
          ].map(([label, freeValue, premiumValue], index) => (
            <div
              key={label}
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1.2fr 0.9fr 0.95fr" : "1.5fr 0.9fr 1fr",
                gap: 10,
                padding: isMobile ? "14px 16px" : "15px 22px",
                alignItems: "center",
                borderBottom: index === 3 ? "none" : `1px solid ${C.border}`,
                background: premiumValue === "Oui" || premiumValue === "Complet" || premiumValue === "Jusqu'à 52 semaines"
                  ? "linear-gradient(90deg, #ffffff 0%, #ffffff 66%, rgba(216,226,255,0.32) 100%)"
                  : C.white,
              }}
            >
              <div style={{ color: C.ink, fontSize: 14, fontWeight: 600, lineHeight: 1.4, fontFamily: FONT }}>
                {label}
              </div>
              <div>
                <CompactTableValue value={freeValue} />
              </div>
              <div>
                <CompactTableValue value={premiumValue} premium />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section style={{ padding: isMobile ? "16px 16px 48px" : "24px 20px 64px", background: C.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <SectionEyebrow>COMPARAISON</SectionEyebrow>
            <h2
              style={{
                margin: "16px 0 10px",
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(34px, 5vw, 54px)",
                fontWeight: 800,
                textTransform: "uppercase",
                lineHeight: 0.98,
                color: C.ink,
              }}
            >
              L’essai 7 jours te fait découvrir.
              <br />
              Le Premium te fait progresser.
            </h2>
            <p style={{ margin: 0, color: C.secondary, fontSize: 16, lineHeight: 1.65, fontFamily: FONT, maxWidth: 760, marginInline: "auto" }}>
              La comparaison doit être évidente : l’essai (carte requise) ouvre tout Premium pendant 7 jours,
              puis le mensuel ou l’annuel devient le choix logique pour un vrai
              suivi, un plan durable et des données utiles pour t’améliorer.
            </p>
          </div>

          <div
            style={{
              background: C.white,
              border: `1px solid ${C.border}`,
              borderRadius: 28,
              overflow: "hidden",
              boxShadow: C.shadow,
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1.2fr 1fr 1fr" : "1.6fr 1fr 1.15fr",
                padding: isMobile ? "18px 14px" : "20px 24px",
                background: C.bgSoft,
                borderBottom: `1px solid ${C.border}`,
                gap: 12,
              }}
            >
              <div style={{ color: C.ink, fontWeight: 800, fontSize: isMobile ? 13 : 15, fontFamily: FONT }}>
                Fonctionnalite
              </div>
              <div style={{ color: C.secondary, fontWeight: 800, fontSize: isMobile ? 13 : 15, fontFamily: FONT }}>
                Essai
              </div>
              <div style={{ color: C.primaryDeep, fontWeight: 800, fontSize: isMobile ? 13 : 15, fontFamily: FONT }}>
                Premium
              </div>
            </div>
            {comparisonRows.map(([label, freeValue, premiumValue], index) => (
              <div
                key={label}
                style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1.2fr 1fr 1fr" : "1.6fr 1fr 1.15fr",
                  padding: isMobile ? "16px 14px" : "18px 24px",
                  gap: 12,
                  alignItems: "center",
                  background: index % 2 === 0 ? C.white : "#fbfcff",
                  borderBottom:
                    index === comparisonRows.length - 1 ? "none" : `1px solid ${C.border}`,
                }}
              >
                <div style={{ color: C.ink, fontSize: isMobile ? 13 : 15, lineHeight: 1.45, fontWeight: 600, fontFamily: FONT }}>
                  {label}
                </div>
                <FeatureCell value={freeValue} />
                <FeatureCell value={premiumValue} premium />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "8px 16px 48px" : "0 20px 72px", background: C.bg }}>
        <div style={{ maxWidth: 1120, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 28 }}>
            <SectionEyebrow>POURQUOI PASSER PREMIUM</SectionEyebrow>
            <h2
              style={{
                margin: "16px 0 10px",
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(34px, 5vw, 52px)",
                fontWeight: 800,
                textTransform: "uppercase",
                lineHeight: 0.98,
                color: C.ink,
              }}
            >
              Un investissement rentable
              <br />
              pour mieux nager.
            </h2>
            <p style={{ margin: 0, color: C.secondary, fontSize: 16, lineHeight: 1.65, fontFamily: FONT, maxWidth: 720, marginInline: "auto" }}>
              Le Premium n'est pas une simple option payante. C'est la version qui te
              permet de suivre un vrai plan personnalise, d'analyser tes progres et de
              rester engage jusqu'a ton objectif.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(0, 1fr))",
              gap: 16,
            }}
          >
            {premiumBenefits.map((item) => (
              <div
                key={item.title}
                style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 24,
                  padding: isMobile ? 22 : 24,
                  boxShadow: C.shadow,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: 16,
                    background: C.primaryFix,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 16,
                  }}
                >
                  <item.icon size={20} color={C.primaryDeep} />
                </div>
                <h3 style={{ margin: "0 0 8px", color: C.ink, fontSize: 20, fontWeight: 700, fontFamily: FONT }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, color: C.secondary, fontSize: 15, lineHeight: 1.65, fontFamily: FONT }}>
                  {item.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "0 16px 48px" : "0 20px 72px", background: C.bg }}>
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            background: C.white,
            border: `1px solid ${C.border}`,
            borderRadius: 28,
            padding: isMobile ? 24 : 32,
            boxShadow: C.shadow,
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "minmax(0, 1fr) auto",
              gap: 18,
              alignItems: "center",
            }}
          >
            <div>
              <SectionEyebrow>REASSURANCE</SectionEyebrow>
              <h2
                style={{
                  margin: "16px 0 10px",
                  fontFamily: FONT_DISPLAY,
                  fontSize: "clamp(30px, 4.6vw, 48px)",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  lineHeight: 0.98,
                  color: C.ink,
                }}
              >
                Tu peux commencer sans risque.
              </h2>
              <p style={{ margin: 0, color: C.secondary, fontSize: 15, lineHeight: 1.65, fontFamily: FONT, maxWidth: 640 }}>
                Decouvre MySWYM avec l'essai 7 jours (carte requise), choisis le
                mensuel si tu veux de la flexibilite ou l'annuel si tu veux la meilleure
                valeur sur la duree.
              </p>
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 10,
                minWidth: isMobile ? "auto" : 260,
              }}
            >
              {[
                "Essai 7 jours · carte",
                "Paiement sécurisé",
                "Données conservées",
              ].map((item) => (
                <div
                  key={item}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    borderRadius: 16,
                    background: C.bgSoft,
                    color: C.ink,
                    fontSize: 14,
                    fontWeight: 600,
                    fontFamily: FONT,
                  }}
                >
                  <ShieldCheck size={16} color={C.primaryDeep} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section style={{ padding: isMobile ? "0 16px 56px" : "0 20px 80px", background: C.bg }}>
        <div style={{ maxWidth: 860, margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <SectionEyebrow>FAQ</SectionEyebrow>
            <h2
              style={{
                margin: "16px 0 10px",
                fontFamily: FONT_DISPLAY,
                fontSize: "clamp(32px, 5vw, 50px)",
                fontWeight: 800,
                textTransform: "uppercase",
                lineHeight: 0.98,
                color: C.ink,
              }}
            >
              Questions frequentes
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {faqItems.map((item, index) => {
              const isOpen = openFaq === index;
              return (
                <div
                  key={item.q}
                  style={{
                    background: isOpen ? C.bgSoft : C.white,
                    border: `1px solid ${isOpen ? `${C.primary}33` : C.border}`,
                    borderRadius: 20,
                    boxShadow: isOpen ? C.shadow : "none",
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaq(isOpen ? -1 : index)}
                    aria-expanded={isOpen}
                    style={{
                      width: "100%",
                      padding: "18px 20px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 14,
                      background: "transparent",
                      border: "none",
                      textAlign: "left",
                      cursor: "pointer",
                      fontFamily: FONT,
                    }}
                  >
                    <span style={{ color: C.ink, fontSize: 15, fontWeight: 700, lineHeight: 1.45 }}>
                      {item.q}
                    </span>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        background: isOpen ? C.primaryFix : C.bgCard,
                        color: isOpen ? C.primaryDeep : C.secondary,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 18,
                        flexShrink: 0,
                      }}
                    >
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  {isOpen && (
                    <div style={{ padding: "0 20px 20px", color: C.secondary, fontSize: 14, lineHeight: 1.7, fontFamily: FONT }}>
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section style={{ background: C.night, padding: isMobile ? "48px 16px 56px" : "64px 20px 80px" }}>
        <div style={{ maxWidth: 820, margin: "0 auto", textAlign: "center" }}>
          <SectionEyebrow dark>DERNIER PAS</SectionEyebrow>
          <h2
            style={{
              margin: "18px 0 14px",
              fontFamily: FONT_DISPLAY,
              fontSize: "clamp(36px, 5vw, 58px)",
              fontWeight: 800,
              textTransform: "uppercase",
              lineHeight: 0.95,
              color: C.white,
            }}
          >
            Démarre avec l'essai.
            <br />
            Garde Premium pour aller plus loin.
          </h2>
          <p style={{ margin: "0 auto 24px", color: "rgba(255,255,255,0.68)", fontSize: 16, lineHeight: 1.65, fontFamily: FONT, maxWidth: 620 }}>
            Active l’essai 7 jours (carte requise) pour découvrir MySWYM. Pour
            vraiment progresser avec un plan personnalisé et un vrai suivi, garde Premium ensuite.
          </p>
          <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: 12 }}>
            <button
              type="button"
              onClick={() => handlePremium(PRICE_ANNUAL)}
              style={{
                minHeight: 50,
                padding: "14px 22px",
                borderRadius: 16,
                border: "none",
                background: C.accent,
                color: C.accentText,
                fontSize: 16,
                fontWeight: 800,
                fontFamily: FONT,
                cursor: "pointer",
              }}
            >
              Choisir Premium annuel
            </button>
            <Link
              to="/inscription"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                minHeight: 50,
                padding: "14px 22px",
                borderRadius: 16,
                textDecoration: "none",
                border: "1px solid rgba(255,255,255,0.18)",
                background: "rgba(255,255,255,0.08)",
                color: C.white,
                fontSize: 15,
                fontWeight: 700,
                fontFamily: FONT,
              }}
            >
              Creer mon compte
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
