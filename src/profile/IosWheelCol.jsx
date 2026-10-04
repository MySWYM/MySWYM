/**
 * Colonne de roue scroll (naissance, poids, taille).
 */
import { useEffect, useRef } from "react";

export const IOS_WHEEL_ITEM_H = 40;
export const IOS_WHEEL_VISIBLE = 5;
export const IOS_WHEEL_PAD = ((IOS_WHEEL_VISIBLE - 1) / 2) * IOS_WHEEL_ITEM_H;

export default function IosWheelCol({ options, value, onChange, itemHeight = IOS_WHEEL_ITEM_H }) {
  const ref = useRef(null);
  const timer = useRef(0);
  const h = Number(itemHeight) > 0 ? Number(itemHeight) : IOS_WHEEL_ITEM_H;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const i = Math.max(0, options.findIndex((o) => o.value === value));
    el.scrollTop = i * h;
  }, [options, value, h]);

  const commit = (el) => {
    const i = Math.round(el.scrollTop / h);
    const clamped = Math.max(0, Math.min(options.length - 1, i));
    el.scrollTo({ top: clamped * h, behavior: "smooth" });
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
        <div key={String(o.value)} className="ios-wheel-item">
          {o.label}
        </div>
      ))}
    </div>
  );
}
