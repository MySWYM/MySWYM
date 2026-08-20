import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import PublicNav from "./PublicNav.jsx";
import Footer from "./Footer.jsx";
import StickyCta from "./marketing/StickyCta.jsx";
import { usePageSeo } from "./lib/seo.js";

import { BRAND, FONT, FONT_DISPLAY, FONT_HREF } from "./theme/brand.js";
import "./theme/public.css";

const C = { ...BRAND };

function FontLoader() {
  useEffect(() => {
    const l = document.createElement("link");
    l.rel = "stylesheet";
    l.href = FONT_HREF;
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
  const navigate = useNavigate();
  const [open, setOpen] = useState(0);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle"); // idle | sending | ok | error
  const [errorMsg, setErrorMsg] = useState("");
  const isMobile = useIsMobile();

  usePageSeo({
    title: "Contact — MySWYM",
    description: "Une question sur ton plan natation ? Écris-nous — réponse sous 24–48 h ouvrées.",
    path: "/contact",
  });

  const sendContact = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    const payload = {
      name: name.trim(),
      email: email.trim(),
      subject: subject.trim(),
      message: message.trim(),
      company: "", // honeypot
    };
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Envoi impossible");
      }
      setStatus("ok");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
      navigate("/merci", { replace: true });
    } catch (err) {
      setStatus("error");
      setErrorMsg(
        err?.message ||
          "Envoi impossible. Réessaie ou écris à contact@myswym.app.",
      );
    }
  };

  return (
    <div className="ms-root" style={{ minHeight: "100vh", background: C.bg, color: C.ink, fontFamily: FONT }}>
      <FontLoader />
      <PublicNav />
      <main style={{ maxWidth: 1120, margin: "0 auto", padding: isMobile ? "88px 16px 44px" : "104px 20px 56px" }}>
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? 16 : 22, alignItems: "start" }}>
          <section>
            <div style={{ display: "inline-flex", alignItems: "center", background: C.primaryFix, borderRadius: 999, padding: "5px 12px", marginBottom: 12 }}>
              <span style={{ color: C.primary, fontSize: 11, fontWeight: 700, letterSpacing: "0.07em" }}>CONTACT</span>
            </div>
            <h1 style={{ margin: 0, color: C.ink, fontSize: "clamp(34px,5.2vw,56px)", fontWeight: 800, lineHeight: 1.02, letterSpacing: "-0.03em", fontFamily: FONT_DISPLAY, textTransform: "none" }}>
              Nous sommes à votre écoute !
            </h1>
            <p style={{ color: C.secondary, fontSize: isMobile ? 16 : 18, lineHeight: 1.65, marginTop: 14, maxWidth: 560 }}>
              Une suggestion d'amélioration ? Une question ? Écris-nous — on répond sous 24–48 h ouvrées.
            </p>
            <p style={{ color: C.secondary, fontSize: 14, marginTop: 10 }}>
              Direct : <a href="mailto:support@myswym.app" style={{ color: C.accentText, fontWeight: 700 }}>support@myswym.app</a>
            </p>

            <div style={{ marginTop: isMobile ? 24 : 34, background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 16 : 22, boxShadow: C.shadow }}>
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

          <section style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, padding: isMobile ? 16 : 24, boxShadow: C.shadowMd }}>
            <h2 style={{ margin: 0, color: C.ink, fontFamily: FONT_DISPLAY, fontSize: isMobile ? 34 : 42, fontWeight: 800, lineHeight: 1.05, textTransform: "none", letterSpacing: "-0.03em" }}>Parlons de votre entraînement</h2>
            <p style={{ color: C.secondary, fontSize: 16, lineHeight: 1.6, marginTop: 12 }}>
              Remplis le formulaire — ton message arrive directement dans notre boîte.
            </p>

            <form
                onSubmit={sendContact}
                style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}
              >
                {/* Honeypot — hidden from humans */}
                <input
                  type="text"
                  name="company"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  style={{ position: "absolute", left: "-9999px", height: 0, width: 0, opacity: 0 }}
                />
                <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2, minmax(180px, 1fr))", gap: 10 }}>
                  <Field label="Nom complet *" placeholder="Votre nom" value={name} onChange={(e) => setName(e.target.value)} required disabled={status === "sending"} />
                  <Field label="Email *" type="email" placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={status === "sending"} />
                </div>
                <Field label="Objet du message *" placeholder="Sujet" value={subject} onChange={(e) => setSubject(e.target.value)} required disabled={status === "sending"} />
                <Field label="Message *" as="textarea" placeholder="Explique-nous ton contexte ou ta question." value={message} onChange={(e) => setMessage(e.target.value)} required disabled={status === "sending"} />

                {status === "error" && (
                  <p style={{ margin: 0, color: "#b42318", fontSize: 13, lineHeight: 1.55, fontWeight: 600 }}>
                    {errorMsg}
                  </p>
                )}

                <p style={{ margin: 0, color: C.secondary, fontSize: 13, lineHeight: 1.55 }}>
                  Ton message est envoyé à contact@myswym.app. On ne le stocke pas dans l’app.
                </p>

                <button
                  type="submit"
                  disabled={status === "sending"}
                  style={{
                    marginTop: 2,
                    border: "none",
                    borderRadius: 999,
                    background: C.accent,
                    color: C.accentText,
                    cursor: status === "sending" ? "default" : "pointer",
                    fontWeight: 700,
                    fontFamily: FONT,
                    fontSize: 16,
                    padding: "13px 18px",
                    minHeight: 46,
                    opacity: status === "sending" ? 0.7 : 1,
                  }}
                >
                  {status === "sending" ? "Envoi…" : "Envoyer"}
                </button>
              </form>
          </section>
        </div>
      </main>
      <Footer />
      <StickyCta />
    </div>
  );
}

function Field({ label, as = "input", ...props }) {
  const common = {
    width: "100%",
    boxSizing: "border-box",
    border: `1px solid ${C.border}`,
    borderRadius: 10,
    background: C.cardAlt,
    color: C.ink,
    fontSize: 15,
    padding: as === "textarea" ? "12px 13px" : "11px 13px",
    minHeight: as === "textarea" ? 148 : 44,
    outline: "none",
    fontFamily: FONT,
  };

  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: C.secondary }}>
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
