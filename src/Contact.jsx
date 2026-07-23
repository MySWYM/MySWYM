import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";

const C = {
  bg: "#f8f9fc",
  bgSoft: "#edeef1",
  card: "#ffffff",
  cardAlt: "#f2f3f6",
  border: "rgba(53,93,163,0.12)",
  ink: "#191c1e",
  inkSoft: "#434751",
  secondary: "#5d5e61",
  accent: "#8eb3ff",
  accentText: "#154388",
};

const FONT = "'Lexend', sans-serif";
const FONT_DISPLAY = "'Barlow Condensed', sans-serif";

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Lexend:wght@300;400;500;600;700;800;900&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
}

const FAQ_ITEMS = [
  { q: "Qu'est-ce que MySWYM ?", a: "MySWYM génère des plans natation structurés selon ton niveau, ton objectif et ta fréquence d'entraînement." },
  { q: "Comment fonctionne la personnalisation ?", a: "Tu renseignes ton profil sportif (objectif, niveau, disponibilité), puis le plan est ajusté automatiquement semaine par semaine." },
  { q: "Pour qui est fait MySWYM ?", a: "Débutants, nageurs loisirs, triathlètes et candidats aux diplômes aquatiques qui veulent un cadre clair et progressif." },
];

export default function ContactPage() {
  const [open, setOpen] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const isMobile = useIsMobile();

  const sendMailto = (e) => {
    e.preventDefault();
    const body = [
      `Nom : ${name.trim()}`,
      `Email : ${email.trim()}`,
      "",
      message.trim(),
    ].join("\n");
    const mailto = `mailto:contact@myswym.app?subject=${encodeURIComponent(subject.trim() || "Contact MySWYM")}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
  };

  return (
    <div style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: isMobile ? "88px 16px 44px" : "104px 20px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 22, alignItems: "start" }}>
          <section>
            <div style={{ display: "inline-flex", alignItems: "center", background: "#d8e2ff", borderRadius: 999, padding: "5px 12px", marginBottom: 12 }}>
              <span style={{ color: "#355da3", fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>CONTACT</span>
            </div>
            <h1 style={{ margin: 0, color: C.ink, fontSize: "clamp(34px,5.2vw,56px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.02em", fontFamily: FONT_DISPLAY, textTransform: "uppercase" }}>
              Nous sommes à votre écoute !
            </h1>
            <p style={{ color: C.secondary, fontSize: isMobile ? 16 : 18, lineHeight: 1.65, marginTop: 14, maxWidth: 560 }}>
              Une suggestion d'amélioration ? Une question ? Écris-nous — ton message s’ouvre dans ton appli mail (rien n’est stocké sur nos serveurs via ce formulaire).
            </p>
            <p style={{ color: C.secondary, fontSize: 14, marginTop: 10 }}>
              Direct : <a href="mailto:contact@myswym.app" style={{ color: C.accentText, fontWeight: 700 }}>contact@myswym.app</a>
              {" · "}
              <a href="mailto:support@myswym.app" style={{ color: C.accentText, fontWeight: 700 }}>support@myswym.app</a>
            </p>

            <div style={{ marginTop: isMobile ? 24 : 34, background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 16 : 22, boxShadow: "0 2px 12px rgba(142,179,255,0.10)" }}>
              <h2 style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: C.secondary, marginBottom: 12, fontFamily: FONT }}>
                FAQ
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {FAQ_ITEMS.map((item, i) => {
                  const isOpen = open === i;
                  return (
                    <div key={item.q} style={{ borderBottom: `1px solid ${C.border}` }}>
                      <button
                        onClick={() => setOpen(isOpen ? -1 : i)}
                        style={{
                          width: "100%",
                          border: "none",
                          background: "none",
                          color: C.ink,
                          cursor: "pointer",
                          padding: "14px 0",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          textAlign: "left",
                          fontSize: isMobile ? 17 : 20,
                          fontWeight: 700,
                        }}
                      >
                        <span>{item.q}</span>
                        <ChevronDown size={18} style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s ease" }} />
                      </button>
                      {isOpen && (
                        <p style={{ margin: "0 0 14px", color: C.secondary, lineHeight: 1.65 }}>
                          {item.a}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 16 : 24, boxShadow: "0 8px 24px rgba(142,179,255,0.18)" }}>
            <h2 style={{ margin: 0, color: C.ink, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 34 : 42, fontWeight: 800, lineHeight: 1.05, textTransform: "uppercase", letterSpacing: "0" }}>Parlons de votre entraînement</h2>
            <p style={{ color: C.secondary, fontSize: 16, lineHeight: 1.6, marginTop: 12 }}>
              Remplis le formulaire : ton client mail s’ouvre avec le message prêt à envoyer.
            </p>

            <form
              onSubmit={sendMailto}
              style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}
            >
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(180px, 1fr))", gap: 10 }}>
                <Field label="Nom complet *" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required />
                <Field label="Email *" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <Field label="Objet du message *" placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} required />
              <Field label="Message *" as="textarea" placeholder="Explique-nous ton contexte ou ta question." value={message} onChange={(e) => setMessage(e.target.value)} required />

              <p style={{ margin: 0, color: C.secondary, fontSize: 13, lineHeight: 1.55 }}>
                Aucune donnée n’est enregistrée sur nos serveurs via ce formulaire. L’envoi passe par ton adresse e-mail.
              </p>

              <button
                type="submit"
                style={{
                  marginTop: 2,
                  border: "none",
                  borderRadius: 999,
                  background: C.accent,
                  color: C.accentText,
                  cursor: "pointer",
                  fontWeight: 700,
                  fontFamily: FONT,
                  fontSize: 16,
                  padding: "13px 18px",
                  minHeight: 46,
                }}
              >
                Ouvrir mon e-mail
              </button>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Field({ label, as = "input", ...props }) {
  const common = {
    width: "100%",
    boxSizing: "border-box",
    border: "1px solid rgba(53,93,163,0.12)",
    borderRadius: 10,
    background: "#f2f3f6",
    color: "#191c1e",
    fontSize: 15,
    padding: as === "textarea" ? "12px 13px" : "11px 13px",
    minHeight: as === "textarea" ? 148 : 44,
    outline: "none",
    fontFamily: "'Lexend', sans-serif",
  };

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#5d5e61" }}>
        {label}
      </span>
      {as === "textarea" ? <textarea {...props} style={common} /> : <input {...props} style={common} />}
    </label>
  );
}

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < bp);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return mobile;
}
