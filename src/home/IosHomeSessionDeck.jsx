import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSessionText } from "../i18n/useSessionText.js";
import { Check, Lock } from "lucide-react";
import { G } from "../theme/palette.js";
import { playUiSound } from "../lib/ui-sounds.js";
import { initialWeekCardIndex } from "../lib/home-week-sessions.js";
import "./ios-home-deck.css";

function scrollCardIntoView(root, index, behavior = "auto") {
  const node = root?.children[index];
  if (!root || !node) return;
  const left = node.offsetLeft - (root.clientWidth - node.clientWidth) / 2;
  root.scrollTo({ left: Math.max(0, left), behavior });
}

export default function IosHomeSessionDeck({ cards, onOpen, locked = false }) {
  const { t } = useTranslation("app");
  const tSwim = useSessionText();
  const scrollerRef = useRef(null);
  /** Ignore le click seulement si le carrousel a vraiment bougé en horizontal. */
  const gestureRef = useRef({ scrollLeft: 0 });
  const [active, setActive] = useState(() => initialWeekCardIndex(cards));

  useEffect(() => {
    const idx = initialWeekCardIndex(cards);
    setActive(idx);
    scrollCardIntoView(scrollerRef.current, idx, "auto");
  }, [cards]);

  const syncActive = () => {
    const root = scrollerRef.current;
    if (!root) return;
    const box = root.getBoundingClientRect();
    const mid = box.left + box.width / 2;
    let best = 0;
    let dist = Infinity;
    [...root.children].forEach((node, i) => {
      const r = node.getBoundingClientRect();
      const d = Math.abs(r.left + r.width / 2 - mid);
      if (d < dist) {
        dist = d;
        best = i;
      }
    });
    setActive(best);
  };

  if (!cards?.length) return null;

  return (
    <div className={`ios-home-deck-wrap${locked ? " is-locked" : ""}`}>
      <div
        ref={scrollerRef}
        className="ios-home-deck"
        onScroll={syncActive}
      >
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`ios-home-deck-card${card.resolved ? " is-done" : ""}${locked ? " is-locked" : ""}`}
            aria-label={
              locked
                ? `${t("home.lockedSession")}, ${tSwim(card.title)}`
                : (card.line ? `${tSwim(card.title)}, ${tSwim(card.line)}` : tSwim(card.title))
            }
            onPointerDown={() => {
              gestureRef.current = {
                scrollLeft: scrollerRef.current?.scrollLeft ?? 0,
              };
            }}
            onClick={() => {
              const start = gestureRef.current.scrollLeft ?? 0;
              const now = scrollerRef.current?.scrollLeft ?? 0;
              if (Math.abs(now - start) > 8) return;
              playUiSound(locked ? "tap" : "soft");
              // Après le geste : sinon le sheet peut se fermer tout de suite (iOS).
              const target = card;
              window.setTimeout(() => onOpen?.(target), 0);
            }}
          >
            <img
              src={card.cover}
              alt=""
              draggable={false}
              decoding="async"
              onError={(e) => {
                if (e.currentTarget.dataset.fallback === "1") return;
                e.currentTarget.dataset.fallback = "1";
                e.currentTarget.src = "/hero-pool.webp";
              }}
            />
            <span className="ios-home-deck-scrim" aria-hidden />
            {locked ? (
              <span className="ios-home-deck-lock" aria-hidden>
                <Lock size={16} color="#fff" strokeWidth={2.4} />
              </span>
            ) : card.resolved ? (
              <span className="ios-home-deck-done" aria-hidden>
                <Check size={16} color={G.mint} strokeWidth={2.6} />
              </span>
            ) : null}
            <span className="ios-home-deck-copy">
              <span className="ios-home-deck-title">{tSwim(card.title)}</span>
              {card.line ? <span className="ios-home-deck-line">{tSwim(card.line)}</span> : null}
              {locked ? (
                <span className="ios-home-deck-locked-label">{t("home.lockedSession")}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>
      {cards.length > 1 ? (
        <div className="ios-home-deck-dots" role="tablist" aria-label={t("home.weekAria")}>
          {cards.map((card, i) => (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`ios-home-deck-dot${i === active ? " is-on" : ""}`}
              aria-label={tSwim(card.title)}
              onClick={() => {
                playUiSound("soft");
                scrollCardIntoView(scrollerRef.current, i, "smooth");
                setActive(i);
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
