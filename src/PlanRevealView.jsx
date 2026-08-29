import { useEffect, useState } from "react";
import { CalendarDays, Target, Waves } from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { buildPlanRevealModel } from "./lib/plan-reveal.js";
import SessionHeroCard from "./SessionHeroCard.jsx";

const BUILD_LINES = [
  "Analyse de ton objectif…",
  "Calibrage du volume…",
  "Construction des phases…",
  "Personnalisation des séances…",
];

export default function PlanRevealView({
  phase = "building",
  plan = null,
  profile = null,
  colors: G,
  onContinue,
}) {
  const [lineIdx, setLineIdx] = useState(0);
  const model = phase === "ready" ? buildPlanRevealModel(plan, profile) : null;
  const onDark = G?.bg === "#000514" || G?.ink === "#f4f8fa";

  useEffect(() => {
    if (phase === "ready") return undefined;
    setLineIdx(0);
    const id = window.setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, BUILD_LINES.length - 1));
    }, 420);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div className="ms-plan-reveal">
      <div className="ms-plan-reveal-inner">
        <BrandLogo variant="wordmark" height={22} onDark={onDark} />

        {phase !== "ready" || !model ? (
          <div className="ms-plan-reveal-building">
            <div className="ms-plan-reveal-spin" aria-hidden />
            <h1 className="ms-plan-reveal-title">Préparation de ton plan</h1>
            <p className="ms-plan-reveal-sub">{BUILD_LINES[Math.min(lineIdx, BUILD_LINES.length - 1)]}</p>
          </div>
        ) : (
          <div className="ms-plan-reveal-ready">
            <p className="ms-plan-reveal-kicker">Plan prêt</p>
            <h1 className="ms-plan-reveal-title">Voici ton chemin.</h1>
            <p className="ms-plan-reveal-sub">
              {model.isLoop
                ? `${model.frequency > 0 ? `${model.frequency}× / semaine` : "Séance du jour"} · adapté à ton niveau`
                : `${model.weeks} semaine${model.weeks > 1 ? "s" : ""} · ${model.frequency}× / semaine · adapté à ton niveau`}
            </p>

            <div className="ms-plan-reveal-meta">
              <MetaRow colors={G} icon={<Target size={18} />} label="Objectif" value={model.goalLabel} />
              {model.levelLabel ? (
                <MetaRow colors={G} icon={<Waves size={18} />} label="Niveau" value={model.levelLabel} />
              ) : null}
              <MetaRow colors={G} icon={<CalendarDays size={18} />} label="Essai Premium" value="7 jours · sans carte" />
            </div>

            {model.barCount > 0 && (
              <div className="ms-plan-reveal-bars">
                <p className="ms-plan-reveal-bars-label">Aperçu</p>
                <div className="ms-plan-reveal-bars-row">
                  {Array.from({ length: model.barCount }, (_, i) => (
                    <div
                      key={i}
                      className="ms-plan-reveal-bar"
                      style={{
                        height: 28 + ((i * 17) % 36),
                        opacity: 0.35 + (i / Math.max(1, model.barCount)) * 0.65,
                      }}
                      title={`Semaine ${i + 1}`}
                    />
                  ))}
                </div>
                <div className="ms-plan-reveal-bars-cap">
                  <span>S1, base</span>
                  <span>Essai 7j</span>
                  <span>Suite · Premium</span>
                </div>
              </div>
            )}

            {model.session && (
              <SessionHeroCard preview={model.session} kicker={model.session.type} />
            )}

            <div className="ms-plan-reveal-cta">
              <button type="button" className="ms-plan-reveal-btn" onClick={onContinue} style={{ fontFamily: FONT }}>
                Voir ma première séance
              </button>
              <p className="ms-plan-reveal-foot">7 jours offerts sans carte. Ensuite les séances se mettent en pause.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function MetaRow({ colors: G, icon, label, value }) {
  return (
    <div className="ms-plan-reveal-row">
      <span className="ms-plan-reveal-row-icon" style={{ color: G.blue, background: G.blueLight }}>
        {icon}
      </span>
      <div>
        <p className="ms-plan-reveal-row-label">{label}</p>
        <p className="ms-plan-reveal-row-value" style={{ fontFamily: FONT_DISPLAY }}>{value}</p>
      </div>
    </div>
  );
}
