/**
 * Roue date de naissance : jour / mois / année, Annuler / OK.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { BIRTH_MONTH_OPTIONS, daysInBirthMonth } from "../lib/swimmer-profile.js";

const ITEM_H = 40;
const VISIBLE = 5;
const PAD = ((VISIBLE - 1) / 2) * ITEM_H;

const MONTHS = BIRTH_MONTH_OPTIONS.map((m) => ({ value: m.value, label: m.label }));

function WheelCol({ options, value, onChange }) {
  const ref = useRef(null);
  const timer = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    el.scrollTop = i * ITEM_H;
  }, [options, value]);

  const commit = (el) => {
    const i = Math.round(el.scrollTop / ITEM_H);
    const clamped = Math.max(0, Math.min(options.length - 1, i));
    el.scrollTo({ top: clamped * ITEM_H, behavior: "smooth" });
    const next = options[clamped]?.value;
    if (next != null && next !== value) onChange(next);
  };

  return (
    <div
      ref={ref}
      className="ios-wheel-col"
      onScroll={(e) => {
        const el = e.currentTarget;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => commit(el), 90);
      }}
    >
      {options.map((o) => (
        <div key={o.value} className="ios-wheel-item">
          {o.label}
        </div>
      ))}
    </div>
  );
}

export default function IosBirthWheelSheet({ open, day, month, year, onClose, onConfirm }) {
  const nowY = new Date().getFullYear();
  const [d, setD] = useState(day || 1);
  const [m, setM] = useState(month || 1);
  const [y, setY] = useState(year || 1990);

  useEffect(() => {
    if (!open) return;
    setD(day || 1);
    setM(month || 1);
    setY(year || 1990);
  }, [open, day, month, year]);

  const dim = daysInBirthMonth(m, y);
  const days = useMemo(
    () => Array.from({ length: dim }, (_, i) => ({ value: i + 1, label: String(i + 1) })),
    [dim],
  );
  const years = useMemo(() => {
    const out = [];
    for (let n = nowY; n >= 1900; n--) out.push({ value: n, label: String(n) });
    return out;
  }, [nowY]);

  useEffect(() => {
    if (d > dim) setD(dim);
  }, [d, dim]);

  return (
    <SoftMistSheet
      open={open}
      title="Date de naissance"
      onClose={onClose}
      footer={(
        <div className="ios-wheel-actions">
          <button type="button" className="ms-pill-cta ms-pill-cta-secondary" onClick={onClose}>
            Annuler
          </button>
          <button
            type="button"
            className="ms-pill-cta"
            onClick={() => onConfirm?.({ day: d, month: m, year: y })}
          >
            OK
          </button>
        </div>
      )}
    >
      <div className="ios-wheel" style={{ "--ios-wheel-item": `${ITEM_H}px`, "--ios-wheel-pad": `${PAD}px` }}>
        <WheelCol options={days} value={Math.min(d, dim)} onChange={setD} />
        <WheelCol options={MONTHS} value={m} onChange={setM} />
        <WheelCol options={years} value={y} onChange={setY} />
      </div>
    </SoftMistSheet>
  );
}
