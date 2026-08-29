/**
 * Tests pack partage + invite.
 * Usage: node src/lib/session-share-pack.test.js
 */
import {
  formatInviteBlock,
  formatSessionShareCaption,
  formatSessionClipboardText,
  buildSessionSharePack,
} from "./session-share-pack.js";

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

const invite = { code: "ABC123", shareUrl: "https://myswym.app/inscription?ref=ABC123" };
const session = {
  title: "Seuil progressif",
  type: "SEUIL",
  distance: "2200m",
  duration: 55,
  intensity: "Z3",
  details: ["400 m aisance", "8×100 m seuil", "200 m retour"],
};

const block = formatInviteBlock(invite);
assert(block.includes("ABC123"), "code");
assert(block.includes("inscription?ref=ABC123"), "url");
assert(block.includes("−20 %") || block.includes("-20"), "promo");

const caption = formatSessionShareCaption(session, invite, { badgeLabel: "Premier plongeon" });
assert(caption.includes("Seuil progressif"), "titre caption");
assert(caption.includes("Badge"), "badge");
assert(caption.includes("ABC123"), "caption invite");

const clip = formatSessionClipboardText(session, invite);
assert(clip.includes("Échauffement") || clip.includes("Corps") || clip.includes("400 m"), "détail");
assert(clip.includes("ABC123"), "clip invite");
assert(!clip.includes(",  MySWYM · myswym.app") || clip.includes("Rejoins"), "invite instead of bare brand");

const pack = buildSessionSharePack(session, invite);
assert(pack.caption && pack.clipboardText, "pack");

assert(formatInviteBlock({}).includes("myswym.app"), "fallback");

console.log("session-share-pack.test.js OK");
