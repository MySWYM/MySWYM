/**
 * Funnel avis : like/dislike → feedback Contact ou Store.
 */
import { Heart, MessageCircle, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import SoftMistSheet from "./SoftMistSheet.jsx";

export default function LoveReviewSheet({
  open,
  step = "ask", // ask | feedback | store
  onLoveYes,
  onLoveNo,
  onSnooze,
  onOpenContact,
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
        title={t("loveReview.feedbackTitle")}
        subtitle={t("loveReview.feedbackBody")}
        onClose={onOpenContact}
        footer={(
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button type="button" className="ms-pill-cta" onClick={onOpenContact}>
              {t("loveReview.feedbackCta")}
            </button>
          </div>
        )}
      >
        <div className="love-review-icon" aria-hidden>
          <MessageCircle size={28} color="currentColor" />
        </div>
      </SoftMistSheet>
    );
  }

  if (step === "store") {
    return (
      <SoftMistSheet
        open
        zIndex={570}
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
      >
        <div className="love-review-icon is-star" aria-hidden>
          <Star size={28} color="currentColor" />
        </div>
      </SoftMistSheet>
    );
  }

  return (
    <SoftMistSheet
      open
      zIndex={570}
      title={t("loveReview.title")}
      subtitle={t("loveReview.body")}
      onClose={onSnooze}
      footer={(
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button type="button" className="ms-pill-cta" onClick={onLoveYes}>
            {t("loveReview.yes")}
          </button>
          <button type="button" className="ms-pill-cta ms-pill-cta-secondary" onClick={onLoveNo}>
            {t("loveReview.no")}
          </button>
        </div>
      )}
    >
      <div className="love-review-icon is-heart" aria-hidden>
        <Heart size={28} color="currentColor" />
      </div>
    </SoftMistSheet>
  );
}
