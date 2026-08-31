import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";

/** Avis landing publiés (status = published). Tableau vide si la table n’existe pas encore. */
export function usePublishedReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    supabase
      .from("landing_reviews")
      .select("id, author_name, rating, body, created_at")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          // Table absente / RLS / 404 PostgREST : pas d’avis, pas de surface d’erreur.
          setReviews([]);
        } else {
          setReviews(
            (data || []).map((row) => ({
              id: row.id,
              authorName: row.author_name,
              rating: row.rating,
              body: row.body,
            })),
          );
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) {
          setReviews([]);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return { reviews, loading };
}
