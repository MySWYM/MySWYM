import { useEffect, useState } from "react";
import { animate, useReducedMotion } from "framer-motion";

const EASE = [0.22, 1, 0.36, 1];

export function CountUp({
  value,
  format = (n) => String(Math.round(n)),
  duration = 1.15,
  delay = 0,
}) {
  const reduced = useReducedMotion();
  const target = Number(value) || 0;
  const [shown, setShown] = useState(reduced ? target : 0);

  useEffect(() => {
    if (reduced) {
      setShown(target);
      return undefined;
    }
    setShown(0);
    const controls = animate(0, target, {
      duration,
      delay,
      ease: EASE,
      onUpdate: setShown,
    });
    return () => controls.stop();
  }, [target, duration, delay, reduced]);

  return format(shown);
}
