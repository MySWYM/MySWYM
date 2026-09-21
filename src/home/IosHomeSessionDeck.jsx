import { useEffect, useRef, useState } from "react";
import { Check } from "lucide-react";
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

export default function IosHomeSessionDeck({ cards, onOpen }) {
  const scrollerRef = useRef(null);
  const dragRef = useRef({ x: 0, moved: false });
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
    <div className="ios-home-deck-wrap">
      <div
        ref={scrollerRef}
        className="ios-home-deck"
        onScroll={syncActive}
      >
        {cards.map((card) => (
          <button
            key={card.key}
            type="button"
            className={`ios-home-deck-card${card.resolved ? " is-done" : ""}`}
            aria-label={card.line ? `${card.title}, ${card.line}` : card.title}
            onPointerDown={(e) => {
              dragRef.current = { x: e.clientX, moved: false };
            }}
            onPointerMove={(e) => {
              if (Math.abs(e.clientX - dragRef.current.x) > 10) dragRef.current.moved = true;
            }}
            onClick={() => {
              if (dragRef.current.moved) return;
              playUiSound("soft");
              onOpen?.(card);
            }}
          >
            <img src={card.cover} alt="" decoding="async" />
            <span className="ios-home-deck-scrim" aria-hidden />
            {card.resolved ? (
              <span className="ios-home-deck-done" aria-hidden>
                <Check size={16} color={G.mint} strokeWidth={2.6} />
              </span>
            ) : null}
            <span className="ios-home-deck-copy">
              <span className="ios-home-deck-title">{card.title}</span>
              {card.line ? <span className="ios-home-deck-line">{card.line}</span> : null}
            </span>
          </button>
        ))}
      </div>
      {cards.length > 1 ? (
        <div className="ios-home-deck-dots" role="tablist" aria-label="Séances de la semaine">
          {cards.map((card, i) => (
            <button
              key={card.key}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`ios-home-deck-dot${i === active ? " is-on" : ""}`}
              aria-label={card.title}
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
