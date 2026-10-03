import { useEffect, useRef, useState } from "react";
import { Undo2 } from "lucide-react";
import { AnimatePresence, motion, MotionConfig, useReducedMotion } from "framer-motion";
import { useTranslation } from "react-i18next";

/**
 * CTA danger pleine largeur (style ms-pill-cta).
 * Tap → compte à rebours + Annuler. À 0 → onCommit.
 * blocked → onBlocked (pas de décompte).
 */
export default function TimedUndoAction({
  initialSeconds = 10,
  deleteLabel,
  undoLabel,
  busyLabel,
  disabled = false,
  busy = false,
  blocked = false,
  onBlocked,
  onCommit,
  icon,
  className = "",
}) {
  const { t } = useTranslation("app");
  const resolvedDelete = deleteLabel ?? t("settings.deleteAccount");
  const resolvedUndo = undoLabel ?? t("settings.deleteUndo");
  const resolvedBusy = busyLabel ?? t("settings.deleteBusy");
  const reduced = useReducedMotion();
  const [isDeleting, setIsDeleting] = useState(false);
  const [countDown, setCountDown] = useState(initialSeconds);
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

  const armed = isDeleting && !busy;
  const label = busy ? resolvedBusy : armed ? resolvedUndo : resolvedDelete;
  const ariaLabel = busy
    ? resolvedBusy
    : armed
      ? `${resolvedUndo}, ${countDown} s`
      : resolvedDelete;

  const spring = reduced
    ? { duration: 0 }
    : { type: "spring", stiffness: 280, damping: 24 };

  return (
    <MotionConfig transition={spring}>
      <motion.button
        type="button"
        disabled={disabled || busy}
        aria-label={ariaLabel}
        aria-busy={busy || undefined}
        className={`ms-timed-undo${armed || busy ? " is-armed" : ""}${className ? ` ${className}` : ""}`}
        onClick={handleClick}
        whileTap={disabled || busy ? undefined : { scale: 0.985 }}
      >
        <span className="ms-timed-undo-inner">
          <AnimatePresence mode="popLayout" initial={false}>
            {armed ? (
              <motion.span
                key="undo-icon"
                className="ms-timed-undo-chip"
                initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
                aria-hidden
              >
                {icon ?? <Undo2 size={18} strokeWidth={2.4} color="#fff" />}
              </motion.span>
            ) : null}
          </AnimatePresence>

          <span className="ms-timed-undo-label">
            {reduced || busy ? (
              label
            ) : (
              <AnimatedText text={label} />
            )}
          </span>

          <AnimatePresence mode="popLayout" initial={false}>
            {armed ? (
              <motion.span
                key="countdown"
                className="ms-timed-undo-chip ms-timed-undo-count"
                initial={reduced ? false : { opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduced ? undefined : { opacity: 0, scale: 0.85 }}
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.span
                    key={countDown}
                    initial={reduced ? false : { opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduced ? undefined : { opacity: 0, y: 10 }}
                    transition={
                      reduced
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 320, damping: 22 }
                    }
                  >
                    {countDown}
                  </motion.span>
                </AnimatePresence>
              </motion.span>
            ) : null}
          </AnimatePresence>
        </span>
      </motion.button>
    </MotionConfig>
  );
}

function AnimatedText({ text, delayStep = 0.012 }) {
  const chars = text.split("");

  return (
    <span style={{ display: "inline-flex" }}>
      <AnimatePresence mode="popLayout" initial={false}>
        <motion.span
          key={text}
          style={{ display: "inline-flex" }}
        >
          {chars.map((char, i) => (
            <motion.span
              key={`${text}-${i}`}
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -8, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 320,
                damping: 22,
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
