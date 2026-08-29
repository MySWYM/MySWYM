/**
 * Pack de partage séance, caption + texte presse-papiers + invite parrainage.
 * Pattern type Strava : preuve sociale + légende prête avec lien d’invitation.
 */

import { formatSessionPlainText as formatSessionBody } from "./session-export.js";

function formatDurationLabel(duration) {
  if (duration == null || duration === "") return "";
  if (typeof duration === "number") return `${duration} min`;
  return String(duration);
}

/**
 * Bloc invite collé en bas des textes / captions.
 * @param {{ code?: string|null, shareUrl?: string|null }} invite
 */
export function formatInviteBlock(invite = {}) {
  const code = invite?.code ? String(invite.code).toUpperCase() : "";
  const shareUrl = invite?.shareUrl ? String(invite.shareUrl).trim() : "";
  if (!code && !shareUrl) {
    return "Rejoins MySWYM → https://www.myswym.app";
  }
  const lines = ["Rejoins-moi sur MySWYM"];
  if (shareUrl) lines.push(shareUrl);
  if (code) lines.push(`Code parrain : ${code} (−20 % sur la 1re facture)`);
  return lines.join("\n");
}

/**
 * Légende courte (Stories / native share / Strava activity description teaser).
 */
export function formatSessionShareCaption(session, invite = {}, { badgeLabel = null } = {}) {
  if (!session) return formatInviteBlock(invite);
  const head = [
    session.title || "Séance",
    [session.distance, formatDurationLabel(session.duration)].filter(Boolean).join(" · "),
  ]
    .filter(Boolean)
    .join(", ");
  const lines = [head];
  if (session.type) lines.push(String(session.type));
  if (badgeLabel) lines.push(`Badge : ${badgeLabel}`);
  lines.push("", "Coaché avec MySWYM", "", formatInviteBlock(invite));
  return lines.join("\n");
}

/**
 * Texte long pour coller dans Strava / WhatsApp (détail séance + invite).
 */
export function formatSessionClipboardText(session, invite = {}) {
  const body = formatSessionBody(session, { withBrandFooter: false });
  return `${body}\n\n${formatInviteBlock(invite)}`.trim();
}

/**
 * Pack unique pour tous les canaux.
 */
export function buildSessionSharePack(session, invite = {}, opts = {}) {
  return {
    caption: formatSessionShareCaption(session, invite, opts),
    clipboardText: formatSessionClipboardText(session, invite),
    inviteBlock: formatInviteBlock(invite),
    code: invite?.code || null,
    shareUrl: invite?.shareUrl || null,
  };
}
