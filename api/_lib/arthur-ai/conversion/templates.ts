/**
 * Templates de relance F2 — courts, non spammy, orientés MySWYM.
 */
import type { FollowupTemplateKey } from "./policy.js";

const APP_URL = () =>
  (process.env.APP_URL || "https://myswym.app").replace(/\/$/, "");

export function renderFollowupMessage(
  key: FollowupTemplateKey,
  ctx: { goal?: string | null; firstName?: string | null } = {},
): string {
  const link = APP_URL();
  const goal = ctx.goal ? ` pour ton objectif ${ctx.goal}` : "";

  switch (key) {
    case "convert_hot":
      return (
        `Tu étais motivé(e) pour un plan${goal}. ` +
        `Sur MySWYM tu peux le générer en quelques minutes : ${link}/inscription — ` +
        `dis-moi si tu préfères qu’on clarifie ton niveau d’abord.`
      );
    case "plan_nudge":
      return (
        `Petit rappel : on peut cadrer ton plan${goal} sur MySWYM. ` +
        `Quand tu veux : ${link} — une question, je suis là.`
      );
    case "nurture_warm":
      return (
        `Je reprends notre échange : tu vises quoi en ce moment (distance, date, niveau) ? ` +
        `Ensuite je te guide vers le bon parcours MySWYM : ${link}`
      );
    case "reengage_cold":
      return (
        `Salut — tu avais contacté Arthur au sujet de la natation. ` +
        `Toujours d’actualité ? Une phrase suffit, sinon on laisse tranquille.`
      );
    case "signup_to_premium":
      return (
        `Tu as un compte MySWYM — l’essai Premium débloque plans complets + adaptation. ` +
        `Si tu veux tester : ${link}/fr/tarifs — sinon dis-moi ce qui bloque.`
      );
    default:
      return `Reprise douce côté MySWYM : ${link}`;
  }
}
