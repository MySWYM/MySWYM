import { useEffect, useState } from "react";
import { supabase } from "../supabase.js";

/** Session marketing (nav / CTA). `user === undefined` = pas encore hydraté. */
export function useAuthSession() {
  const [user, setUser] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    supabase.auth.getSession().then(({ data }) => {
      if (!cancelled) setUser(data.session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return {
    user,
    loading: user === undefined,
    isLoggedIn: Boolean(user),
  };
}

/** CTA public : quiz si anonyme (inscription à la fin du questionnaire), app si déjà connecté. */
export function usePublicCta() {
  const { isLoggedIn } = useAuthSession();
  if (isLoggedIn) {
    return { href: "/app", labelKey: "nav.openApp", shortKey: "nav.openAppShort" };
  }
  return { href: "/app", labelKey: "nav.cta", shortKey: "nav.ctaShort" };
}
