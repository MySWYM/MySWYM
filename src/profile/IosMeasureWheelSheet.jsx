/**
 * Mini-fenêtre poids / taille ancrée sur le champ (Poids / Taille), pas centrée écran.
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check, X } from "lucide-react";
import {
  BODY_UNITS_IMPERIAL,
  cmToFeetInches,
  feetInchesToCm,
  isImperialBodyUnits,
  kgToWeightDisplay,
  weightDisplayToKg,
} from "../lib/body-units.js";
import IosWheelCol from "./IosWheelCol.jsx";

const COMPACT_ITEM = 36;
const COMPACT_VISIBLE = 3;
const COMPACT_PAD = ((COMPACT_VISIBLE - 1) / 2) * COMPACT_ITEM;
const VIEW_PAD = 8;

function rangeOptions(from, to, step = 1) {
  const out = [];
  for (let n = from; n <= to + 1e-9; n = Math.round((n + step) * 1000) / 1000) {
    const v = step < 1 ? Math.round(n * 10) / 10 : Math.round(n);
    out.push({ value: v, label: String(v) });
  }
  return out;
}

function nearestOption(options, value, fallback) {
  if (!options.length) return fallback;
  const n = Number(value);
  if (!Number.isFinite(n)) {
    const hit = options.find((o) => o.value === fallback);
    return hit ? hit.value : options[Math.floor(options.length / 2)].value;
  }
  let best = options[0].value;
  let bestD = Math.abs(options[0].value - n);
  for (const o of options) {
    const d = Math.abs(o.value - n);
    if (d < bestD) {
      best = o.value;
      bestD = d;
    }
  }
  return best;
}

function resolveAnchorEl(anchorRef) {
  const node = anchorRef?.current;
  if (!node) return null;
  if (typeof node.getBoundingClientRect === "function") return node;
  return null;
}

/** Positionne la carte sur le champ (même colonne / top), clamp viewport. */
function computeAnchorStyle(anchorEl, cardEl) {
  if (!anchorEl) return null;
  const rect = anchorEl.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(
    Math.max(rect.width, 148),
    vw - VIEW_PAD * 2,
  );
  const cardH = cardEl?.offsetHeight || 260;

  let left = rect.left + (rect.width - width) / 2;
  if (left + width > vw - VIEW_PAD) left = vw - VIEW_PAD - width;
  if (left < VIEW_PAD) left = VIEW_PAD;

  // Aligné en haut du champ ; si ça déborde en bas, remonte.
  let top = rect.top;
  if (top + cardH > vh - VIEW_PAD) {
    top = Math.max(VIEW_PAD, vh - VIEW_PAD - cardH);
  }
  if (top < VIEW_PAD) top = VIEW_PAD;

  return {
    position: "fixed",
    top: Math.round(top),
    left: Math.round(left),
    width: Math.round(width),
    maxWidth: "none",
  };
}

export default function IosMeasureWheelSheet({
  open,
  kind = "weight",
  units = "metric",
  weightKg = "",
  heightCm = "",
  title,
  cancelLabel = "Annuler",
  okLabel = "OK",
  unitKgLabel = "kg",
  unitLbLabel = "lb",
  unitCmLabel = "cm",
  unitFtLabel = "ft",
  unitInLabel = "in",
  anchorRef = null,
  onClose,
  onConfirm,
}) {
  const imperial = isImperialBodyUnits(units);
  const isWeight = kind === "weight";
  const cardRef = useRef(null);
  const [pos, setPos] = useState(null);

  const weightOpts = useMemo(
    () => (imperial ? rangeOptions(66, 440, 1) : rangeOptions(30, 200, 1)),
    [imperial],
  );
  const cmOpts = useMemo(() => rangeOptions(120, 220, 1), []);
  const ftOpts = useMemo(() => rangeOptions(3, 7, 1), []);
  const inOpts = useMemo(() => rangeOptions(0, 11, 1), []);

  const [w, setW] = useState(70);
  const [cm, setCm] = useState(175);
  const [ft, setFt] = useState(5);
  const [inch, setInch] = useState(9);

  useEffect(() => {
    if (!open) return;
    if (isWeight) {
      const display = kgToWeightDisplay(weightKg === "" ? 70 : weightKg, units);
      setW(nearestOption(weightOpts, display, imperial ? 154 : 70));
      return;
    }
    if (imperial) {
      const fi = cmToFeetInches(heightCm === "" ? 175 : heightCm);
      setFt(nearestOption(ftOpts, fi.feet, 5));
      setInch(nearestOption(inOpts, fi.inches, 9));
      return;
    }
    setCm(nearestOption(cmOpts, heightCm === "" ? 175 : heightCm, 175));
  }, [open, isWeight, imperial, weightKg, heightCm, units, weightOpts, cmOpts, ftOpts, inOpts]);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return undefined;
    }
    const place = () => {
      const anchor = resolveAnchorEl(anchorRef);
      setPos(computeAnchorStyle(anchor, cardRef.current));
    };
    place();
    // 2e passe après layout de la carte (hauteur réelle).
    const t = window.requestAnimationFrame(place);
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.cancelAnimationFrame(t);
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open, anchorRef, imperial, isWeight]);

  useEffect(() => {
    if (!open || !onClose) return undefined;
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.preventDefault();
      onClose();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;

  const colsClass = isWeight || !imperial ? "is-cols-1" : "is-cols-2";

  const handleOk = () => {
    if (isWeight) {
      const kg = weightDisplayToKg(w, imperial ? BODY_UNITS_IMPERIAL : "metric");
      onConfirm?.({ weightKg: kg === "" ? "" : Number(kg) });
      return;
    }
    if (imperial) {
      const nextCm = feetInchesToCm(ft, inch);
      onConfirm?.({ heightCm: nextCm === "" ? "" : Number(nextCm) });
      return;
    }
    onConfirm?.({ heightCm: Number(cm) });
  };

  const unitHint = isWeight
    ? (imperial ? unitLbLabel : unitKgLabel)
    : (imperial ? `${unitFtLabel} / ${unitInLabel}` : unitCmLabel);

  return createPortal(
    <div
      className="ios-measure-overlay is-anchored"
      role="dialog"
      aria-modal="true"
      aria-label={title || "Mesure"}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <div
        ref={cardRef}
        className="ios-measure-card scale-in"
        style={pos || { visibility: "hidden" }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="ios-measure-card-head">
          <h3 className="ios-measure-card-title">{title}</h3>
          <p className="ios-measure-card-unit">{unitHint}</p>
        </div>
        <div
          className={`ios-wheel ios-wheel--compact ${colsClass}`}
          style={{
            "--ios-wheel-item": `${COMPACT_ITEM}px`,
            "--ios-wheel-pad": `${COMPACT_PAD}px`,
          }}
        >
          {isWeight ? (
            <IosWheelCol options={weightOpts} value={w} onChange={setW} itemHeight={COMPACT_ITEM} />
          ) : imperial ? (
            <>
              <IosWheelCol options={ftOpts} value={ft} onChange={setFt} itemHeight={COMPACT_ITEM} />
              <IosWheelCol options={inOpts} value={inch} onChange={setInch} itemHeight={COMPACT_ITEM} />
            </>
          ) : (
            <IosWheelCol options={cmOpts} value={cm} onChange={setCm} itemHeight={COMPACT_ITEM} />
          )}
        </div>
        <div className="ios-measure-card-actions">
          <button
            type="button"
            className="ios-measure-icon-btn is-cancel"
            aria-label={cancelLabel}
            onClick={onClose}
          >
            <X size={20} strokeWidth={2.5} />
          </button>
          <button
            type="button"
            className="ios-measure-icon-btn is-ok"
            aria-label={okLabel}
            onClick={handleOk}
          >
            <Check size={22} strokeWidth={2.75} />
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
