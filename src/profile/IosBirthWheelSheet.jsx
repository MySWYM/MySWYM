/**
 * Roue date de naissance : jour / mois / année, Annuler / OK.
 */
import { useEffect, useMemo, useState } from "react";
import SoftMistSheet from "../sheets/SoftMistSheet.jsx";
import { BIRTH_MONTH_OPTIONS, daysInBirthMonth } from "../lib/swimmer-profile.js";
import IosWheelCol, { IOS_WHEEL_ITEM_H, IOS_WHEEL_PAD } from "./IosWheelCol.jsx";

const MONTHS = BIRTH_MONTH_OPTIONS.map((m) => ({ value: m.value, label: m.label }));

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
      <div
        className="ios-wheel is-cols-3"
        style={{ "--ios-wheel-item": `${IOS_WHEEL_ITEM_H}px`, "--ios-wheel-pad": `${IOS_WHEEL_PAD}px` }}
      >
        <IosWheelCol options={days} value={Math.min(d, dim)} onChange={setD} />
        <IosWheelCol options={MONTHS} value={m} onChange={setM} />
        <IosWheelCol options={years} value={y} onChange={setY} />
      </div>
    </SoftMistSheet>
  );
}
