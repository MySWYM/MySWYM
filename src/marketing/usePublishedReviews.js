import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";

/** Avis landing publiés (status = published). Tableau vide si la table n’existe pas encore. */
export function usePublishedReviews() {
  const [reviews, setReviews] = useState([]);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("landing_reviews")
      .select("id, author_name, rating, body, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled || error) return;
        setReviews(
          (data || []).map((row) => ({
            id: row.id,
            authorName: row.author_name,
            rating: row.rating,
            body: row.body,
          })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return reviews;
}
