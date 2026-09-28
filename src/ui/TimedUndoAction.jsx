import { useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import useMeasure from "react-use-measure";
import { G } from "../theme/palette.js";

/**
 * Bouton danger avec compte à rebours + annulation.
 * À 0 → appelle onCommit (suppression réelle). Nouveau tap pendant le décompte = annuler.
 */
export default function TimedUndoAction({
  initialSeconds = 10,
  deleteLabel = "Supprimer mon compte",
  undoLabel = "Annuler",
  busyLabel = "Suppression…",
  disabled = false,
  busy = false,
  /** Si true : le tap n’arme pas le décompte, appelle onBlocked. */
  blocked = false,
  onBlocked,
  onCommit,
  icon,
  className = "",
}) {
  const reduced = useReducedMotion();
  const [isDeleting, setIsDeleting] = useState(false);
  const [countDown, setCountDown] = useState(initialSeconds);
  const [ref, bounds] = useMeasure({ offsetSize: true });
  const committedRef = useRef(false);

  useEffect(() => {
    if (disabled || busy || blocked) {
      setIsDeleting(false);
      setCountDown(initialSeconds);
      committedRef.current = false;
    }
  }, [disabled, busy, blocked, initialSeconds]);

  useEffect(() => {
    if (!isDeleting || disabled || busy || blocked) return undefined;

    const interval = setInterval(() => {
      setCountDown((prev) => {
        if (prev <= 1) {
          if (!committedRef.current) {
            committedRef.current = true;
            queueMicrotask(() => {
              setIsDeleting(false);
              onCommit?.();
            });
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isDeleting, disabled, busy, blocked, onCommit]);

  const handleClick = () => {
    if (disabled || busy) return;
    if (blocked) {
      onBlocked?.();
      return;
    }
    setIsDeleting((prev) => {
      const next = !prev;
      if (next) {
        committedRef.current = false;
        setCountDown(initialSeconds);
      }
      return next;
    });
  };

  const label = busy ? busyLabel : isDeleting ? undoLabel : deleteLabel;
  const ariaLabel = busy
    ? busyLabel
    : isDeleting
      ? `${undoLabel}, ${countDown} s restantes`
      : deleteLabel;

  const spring = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 250, damping: 22 };

  return (
    <div className={`flex w-full items-center justify-center ${className}`.trim()}>
      <MotionConfig transition={spring}>
        <motion.button
          type="button"
          disabled={disabled || busy}
          aria-label={ariaLabel}
          aria-busy={busy || undefined}
          className="relative flex cursor-pointer items-center justify-start overflow-hidden rounded-full transition-colors duration-300 disabled:cursor-not-allowed disabled:opacity-50"
          style={{
            background: isDeleting || busy ? "rgba(232, 90, 104, 0.14)" : G.coral,
            border: "none",
            font: "inherit",
            padding: 0,
            maxWidth: "100%",
          }}
          animate={{
            width: bounds.width > 0 ? bounds.width : "auto",
          }}
          onClick={handleClick}
        >
          <div
            ref={ref}
            className={`flex items-center justify-center gap-2 ${
              isDeleting && !busy ? "px-3 py-2.5" : "px-6 py-3"
            }`}
          >
            <AnimatePresence mode="popLayout">
              {isDeleting && !busy && (
                <motion.div
                  className="rounded-full p-2"
                  style={{ background: G.coral }}
                  initial={reduced ? false : { opacity: 0, filter: "blur(2px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={reduced ? undefined : { opacity: 0, filter: "blur(2px)" }}
                >
                  {icon ?? <Undo2 className="size-5" style={{ color: "#fff" }} />}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-center justify-center gap-2">
              {reduced || busy ? (
                <span
                  className="z-10 text-base font-semibold"
                  style={{ color: isDeleting || busy ? G.coral : "#fff" }}
                >
                  {label}
                </span>
              ) : (
                <AnimatedText
                  text={label}
                  className="z-10 text-base font-semibold"
                  style={{ color: isDeleting ? G.coral : "#fff" }}
                />
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {isDeleting && !busy && (
                <motion.div
                  className="flex items-center justify-center rounded-full px-3 py-1 tabular-nums"
                  style={{ background: G.coral, color: "#fff" }}
                  initial={reduced ? false : { opacity: 0, filter: "blur(2px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  exit={reduced ? undefined : { opacity: 0, filter: "blur(2px)" }}
                >
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={countDown}
                      className="text-base font-semibold"
                      initial={
                        reduced
                          ? false
                          : { opacity: 0, y: -20, filter: "blur(2px)", scale: 0.5 }
                      }
                      animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
                      exit={
                        reduced
                          ? undefined
                          : { opacity: 0, y: 20, filter: "blur(2px)", scale: 0.5 }
                      }
                      transition={
                        reduced
                          ? { duration: 0 }
                          : { type: "spring", stiffness: 240, damping: 20, mass: 1 }
                      }
                    >
                      {countDown}
                    </motion.span>
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.button>
      </MotionConfig>
    </div>
  );
}

function AnimatedText({ text, className, style, delayStep = 0.014 }) {
  const chars = text.split("");

  return (
    <span className={className} style={{ ...style, display: "inline-flex" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          style={{ display: "inline-flex", willChange: "transform" }}
        >
          {chars.map((char, i) => (
            <motion.span
              key={`${text}-${i}`}
              initial={{ y: 10, opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              animate={{ y: 0, opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ y: -10, opacity: 0, scale: 0.5, filter: "blur(2px)" }}
              transition={{
                type: "spring",
                stiffness: 240,
                damping: 16,
                mass: 1.2,
                delay: i * delayStep,
              }}
              style={{
                display: "inline-block",
                whiteSpace: char === " " ? "pre" : undefined,
              }}
            >
              {char}
            </motion.span>
          ))}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
