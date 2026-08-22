import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LocalizedLink } from "../i18n/locale-routing.jsx";
import { usePublishedReviews } from "./usePublishedReviews.js";

function StarDisplay({ value, label }) {
  return (
    <div className="lp-reviews-stars" role="img" aria-label={label}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} size={18} fill={n <= value ? "#d4a017" : "none"} color="#d4a017" aria-hidden />
      ))}
    </div>
  );
}

function StarPicker({ value, onChange }) {
  const { t } = useTranslation("landing");
  return (
    <div className="lp-review-stars-picker" role="radiogroup" aria-label={t("reviewsPage.starAria")}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={t("reviewsPage.starValue", { n })}
          aria-checked={n === value}
          role="radio"
          className="lp-review-star-btn"
        >
          <Star size={22} fill={n <= value ? "#d4a017" : "none"} color="#d4a017" />
        </button>
      ))}
    </div>
  );
}

function ReviewForm() {
  const { t } = useTranslation("landing");
  const [name, setName] = useState("");
  const [rating, setRating] = useState(5);
  const [body, setBody] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (status === "sending") return;
    setStatus("sending");
    setErrorMsg("");
    const honey = e.currentTarget.elements.company?.value || "";
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "landing-review",
          name: name.trim(),
          rating,
          body: body.trim(),
          email: email.trim(),
          company: honey,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) throw new Error(data.error || "Envoi impossible");
      setStatus("ok");
      setName("");
      setBody("");
      setEmail("");
      setRating(5);
    } catch (err) {
      setStatus("error");
      setErrorMsg(err?.message || "Envoi impossible.");
    }
  };

  if (status === "ok") {
    return <p className="lp-review-thanks">{t("reviewsPage.thanks")}</p>;
  }

  return (
    <form className="lp-review-form" onSubmit={submit}>
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="lp-review-honey"
      />
      <label className="lp-review-field">
        <span>{t("reviewsPage.firstName")}</span>
        <input required value={name} onChange={(e) => setName(e.target.value)} maxLength={80} />
      </label>
      <div className="lp-review-field">
        <span>{t("reviewsPage.rating")}</span>
        <StarPicker value={rating} onChange={setRating} />
      </div>
      <label className="lp-review-field">
        <span>{t("reviewsPage.body")}</span>
        <textarea required value={body} onChange={(e) => setBody(e.target.value)} maxLength={800} rows={5} />
      </label>
      <label className="lp-review-field">
        <span>{t("reviewsPage.email")}</span>
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" spellCheck={false} />
      </label>
      {status === "error" ? <p className="lp-review-error">{errorMsg}</p> : null}
      <button type="submit" className="lp-btn lp-btn-lg" disabled={status === "sending"}>
        {status === "sending" ? t("reviewsPage.sending") : t("reviewsPage.send")}
      </button>
    </form>
  );
}

function ReviewsCarousel({ reviews }) {
  const { t } = useTranslation("landing");
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (index >= reviews.length) setIndex(0);
  }, [index, reviews.length]);

  if (reviews.length === 0) {
    return <p className="lp-reviews-empty">{t("reviewsPage.empty")}</p>;
  }

  const review = reviews[index] || reviews[0];
  const canNav = reviews.length > 1;
  const go = (dir) => {
    setIndex((current) => (current + dir + reviews.length) % reviews.length);
  };

  return (
    <div className="lp-reviews-carousel">
      <blockquote className="lp-reviews-quote">
        <p>{review.body}</p>
      </blockquote>
      <hr className="lp-reviews-rule" />
      <p className="lp-reviews-author">{review.authorName}</p>
      {canNav ? (
        <div className="lp-reviews-nav">
          <button
            type="button"
            className="lp-reviews-nav-btn"
            aria-label={t("reviewsPage.prev")}
            onClick={() => go(-1)}
          >
            <ChevronLeft size={20} />
          </button>
          <div className="lp-reviews-dots" role="tablist" aria-label={t("reviewsPage.label")}>
            {reviews.map((item, i) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={i === index}
                className={`lp-reviews-dot${i === index ? " is-active" : ""}`}
                aria-label={t("reviewsPage.goTo", { n: i + 1 })}
                onClick={() => setIndex(i)}
              />
            ))}
          </div>
          <button
            type="button"
            className="lp-reviews-nav-btn"
            aria-label={t("reviewsPage.next")}
            onClick={() => go(1)}
          >
            <ChevronRight size={20} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function LandingReviews({ asPage = false }) {
  const { t } = useTranslation("landing");
  const reviews = usePublishedReviews();
  const TitleTag = asPage ? "h1" : "h2";
  const avg = reviews.length
    ? Math.round(reviews.reduce((sum, item) => sum + Number(item.rating || 0), 0) / reviews.length)
    : 0;

  useEffect(() => {
    if (!asPage) return;
    if (window.location.hash !== "#write") return;
    requestAnimationFrame(() => {
      document.getElementById("write")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [asPage]);

  if (asPage) {
    return (
      <section id="avis" className="lp-section">
        <div className="lp-wrap lp-reviews-page">
          <p className="lp-kicker">{t("reviewsPage.label")}</p>
          <TitleTag className="lp-h2 lp-display">{t("reviewsPage.title")}</TitleTag>
          <p className="lp-lead" style={{ marginTop: 12 }}>{t("reviewsPage.subtitle")}</p>

          {reviews.length === 0 ? (
            <p className="lp-reviews-empty lp-reviews-empty-page">{t("reviewsPage.empty")}</p>
          ) : (
            <ul className="lp-reviews-list">
              {reviews.map((item) => (
                <li key={item.id}>
                  <article className="lp-reviews-card">
                    <StarDisplay value={item.rating} label={t("reviewsPage.starValue", { n: item.rating })} />
                    <p>{item.body}</p>
                    <p className="lp-reviews-author">{item.authorName}</p>
                  </article>
                </li>
              ))}
            </ul>
          )}

          <div id="write" className="lp-reviews-write">
            <h2 className="lp-h2 lp-display lp-reviews-write-title">{t("reviewsPage.write")}</h2>
            <ReviewForm />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="avis" className="lp-section">
      <div className="lp-wrap lp-reviews">
        <div className="lp-reviews-head">
          {reviews.length > 0 ? (
            <p className="lp-reviews-meta">
              <StarDisplay value={avg} label={t("reviewsPage.starAria")} />
              <span>{t("reviewsPage.count", { count: reviews.length })}</span>
            </p>
          ) : null}
          <TitleTag className="lp-h2 lp-display">{t("reviewsPage.title")}</TitleTag>
        </div>
        <ReviewsCarousel reviews={reviews} />
        <LocalizedLink to={{ pathname: "/avis", hash: "#write" }} className="lp-btn lp-reviews-add">
          {t("reviewsPage.add")}
        </LocalizedLink>
      </div>
    </section>
  );
}
