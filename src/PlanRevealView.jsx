import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { CalendarDays, Target, Waves } from "lucide-react";
import BrandLogo from "./BrandLogo.jsx";
import BootMark from "./app-shell/BootMark.jsx";
import { FONT, FONT_DISPLAY } from "./theme/brand.js";
import { buildPlanRevealModel } from "./lib/plan-reveal.js";
import { markBootWarm } from "./lib/boot-warm.js";
import SessionHeroCard from "./SessionHeroCard.jsx";
import { humanSessionType } from "./lib/home-week-sessions.js";

const BUILD_LINE_MS = 900;

function prefersReducedMotion() {
  return typeof window !== "undefined"
    && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export default function PlanRevealView({
  phase = "building",
  plan = null,
  profile = null,
  colors: G,
  onContinue,
}) {
  const { t } = useTranslation("app");
  const buildLines = [t("reveal.line0"), t("reveal.line1"), t("reveal.line2"), t("reveal.line3")];
  const [lineIdx, setLineIdx] = useState(0);
  const model = phase === "ready" ? buildPlanRevealModel(plan, profile) : null;
  const onDark = G?.bg === "#000514" || G?.ink === "#f4f8fa";

  useEffect(() => {
    if (phase === "ready") return undefined;
    markBootWarm();
    setLineIdx(0);
    if (prefersReducedMotion()) return undefined;
    const id = window.setInterval(() => {
      setLineIdx((i) => Math.min(i + 1, buildLines.length - 1));
    }, BUILD_LINE_MS);
    return () => window.clearInterval(id);
  }, [phase]);

  return (
    <div className={`ms-plan-reveal${phase === "ready" && model ? "" : " ms-plan-reveal--building"}`}>
      <div className="ms-plan-reveal-inner">
        {phase !== "ready" || !model ? (
          <div
            className="ms-plan-reveal-building"
            role="status"
            aria-live="polite"
            aria-busy="true"
            aria-labelledby="ms-plan-reveal-build-title"
          >
            <BootMark />
            <img
              className="myswym-boot-wordmark myswym-boot-wordmark--static"
              src="/logo-myswym-banner-blanc.png"
              alt=""
              height={22}
              width={95}
            />
            <h1 id="ms-plan-reveal-build-title" className="ms-plan-reveal-title">{t("reveal.title")}</h1>
            <p className="ms-plan-reveal-sub">
              {buildLines[Math.min(lineIdx, buildLines.length - 1)]}
            </p>
          </div>
        ) : (
          <div className="ms-plan-reveal-ready">
            <header className="ms-plan-reveal-head">
              <BrandLogo variant="wordmark" height={22} onDark={onDark} />
              <p className="ms-plan-reveal-kicker">{t("reveal.ready")}</p>
              <h1 className="ms-plan-reveal-title">{t("reveal.path")}</h1>
              <p className="ms-plan-reveal-sub">
                {model.isLoop
                  ? `${model.frequency > 0 ? t("reveal.perWeek", { count: model.frequency }) : t("live.ofDay")} · ${t("reveal.fitLevel")}`
                  : `${model.weeks > 1 ? t("reveal.weeksMany", { count: model.weeks }) : t("reveal.weeks", { count: model.weeks })} · ${t("reveal.perWeek", { count: model.frequency })} · ${t("reveal.fitLevel")}`}
              </p>
            </header>

            <div className="ms-plan-reveal-body">
              <div className="ms-plan-reveal-meta">
                <MetaRow colors={G} icon={<Target size={18} />} label={t("reveal.goal")} value={model.goalLabel} />
                {model.levelLabel ? (
                  <MetaRow colors={G} icon={<Waves size={18} />} label={t("reveal.level")} value={model.levelLabel} />
                ) : null}
                <MetaRow colors={G} icon={<CalendarDays size={18} />} label={t("reveal.trial")} value={t("reveal.trialValue")} />
              </div>

              {model.barCount > 0 && (
                <div className="ms-plan-reveal-bars">
                  <p className="ms-plan-reveal-bars-label">{t("reveal.preview")}</p>
                  <div className="ms-plan-reveal-bars-row">
                    {Array.from({ length: model.barCount }, (_, i) => (
                      <div
                        key={i}
                        className="ms-plan-reveal-bar"
                        style={{
                          height: 28 + ((i * 17) % 36),
                          opacity: 0.35 + (i / Math.max(1, model.barCount)) * 0.65,
                        }}
                        title={t("profile.weekN", { n: i + 1 })}
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
                <SessionHeroCard preview={model.session} kicker={humanSessionType(model.session.type)} />
              )}

              <div className="ms-plan-reveal-cta">
                <button type="button" className="ms-plan-reveal-btn" onClick={onContinue} style={{ fontFamily: FONT }}>
                  {t("reveal.seeFirst")}
                </button>
                <p className="ms-plan-reveal-foot">{t("reveal.foot")}</p>
              </div>
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
