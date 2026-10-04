/**
 * Funnel avis : like/dislike → feedback Contact ou Store.
 * Icône au-dessus du titre ; feedback fermable sans forcer Contact.
 */
import { Heart, MessageCircle, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import SoftMistSheet from "./SoftMistSheet.jsx";

function ReviewIcon({ kind }) {
  if (kind === "message") {
    return (
      <div className="love-review-icon" aria-hidden>
        <MessageCircle size={28} color="currentColor" />
      </div>
    );
  }
  if (kind === "star") {
    return (
      <div className="love-review-icon is-star" aria-hidden>
        <Star size={28} color="currentColor" />
      </div>
    );
  }
  return (
    <div className="love-review-icon is-heart" aria-hidden>
      <Heart size={28} color="currentColor" />
    </div>
  );
}

export default function LoveReviewSheet({
  open,
  step = "ask", // ask | feedback | store
  onLoveYes,
  onLoveNo,
  onSnooze,
  onOpenContact,
  onDismissFeedback,
  onRateStore,
  onSkipStore,
}) {
  const { t } = useTranslation("app");

  if (!open || !step) return null;

  if (step === "feedback") {
    return (
      <SoftMistSheet
        open
        zIndex={570}
        icon={<ReviewIcon kind="message" />}
        title={t("loveReview.feedbackTitle")}
        subtitle={t("loveReview.feedbackBody")}
        onClose={onDismissFeedback || onSnooze}
        footer={(
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="ms-pill-cta" onClick={onOpenContact}>
              {t("loveReview.feedbackCta")}
            </button>
            <button type="button" className="ms-pill-cta ms-pill-cta-secondary" onClick={onDismissFeedback || onSnooze}>
              {t("loveReview.storeSkip")}
            </button>
          </div>
        )}
      />
    );
  }

  if (step === "store") {
    return (
      <SoftMistSheet
        open
        zIndex={570}
        icon={<ReviewIcon kind="star" />}
        title={t("loveReview.storeTitle")}
        subtitle={t("loveReview.storeBody")}
        onClose={onSkipStore}
        footer={(
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="ms-pill-cta" onClick={onRateStore}>
              {t("loveReview.storeCta")}
            </button>
            <button type="button" className="ms-pill-cta ms-pill-cta-secondary" onClick={onSkipStore}>
              {t("loveReview.storeSkip")}
            </button>
          </div>
        )}
      />
    );
  }

  return (
    <SoftMistSheet
      open
      zIndex={570}
      icon={<ReviewIcon kind="heart" />}
      title={t("loveReview.title")}
      subtitle={t("loveReview.body")}
      onClose={onSnooze}
      footer={(
        <div className="love-review-actions">
          <button type="button" className="ms-pill-cta" onClick={onLoveYes}>
            {t("loveReview.yes")}
          </button>
          <button type="button" className="ms-pill-cta ms-pill-cta-secondary" onClick={onLoveNo}>
            {t("loveReview.no")}
          </button>
        </div>
      )}
    />
  );
}
