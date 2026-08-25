const REF_STORAGE_KEY = "myswym_ref";

export const captureReferralFromUrl = () => {
  try {
    const ref = new URLSearchParams(window.location.search).get("ref");
    if (ref?.trim()) localStorage.setItem(REF_STORAGE_KEY, ref.trim().toUpperCase());
  } catch { /* ignore */ }
};

export const getStoredReferralCode = () => {
  try { return (localStorage.getItem(REF_STORAGE_KEY) || "").toUpperCase(); } catch { return ""; }
};

export const resolveReferralCode = (user) => {
  const fromMeta = String(user?.user_metadata?.referred_by || "").toUpperCase();
  return fromMeta || getStoredReferralCode() || undefined;
};
