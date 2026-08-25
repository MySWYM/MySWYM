import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  normalizeAvatarUrl,
  withAvatarCacheBust,
  resolveAvatarUrl,
} from "./avatar-url.js";

describe("avatar helpers", () => {
  it("normalizeAvatarUrl rejects data URLs and empty", () => {
    assert.equal(normalizeAvatarUrl(""), null);
    assert.equal(normalizeAvatarUrl("  "), null);
    assert.equal(normalizeAvatarUrl("data:image/png;base64,abc"), null);
    assert.equal(normalizeAvatarUrl(null), null);
  });

  it("normalizeAvatarUrl keeps https", () => {
    const u = "https://x.supabase.co/storage/v1/object/public/avatars/u/avatar.jpg";
    assert.equal(normalizeAvatarUrl(u), u);
    assert.equal(normalizeAvatarUrl(` ${u}?t=1 `), `${u}?t=1`);
  });

  it("withAvatarCacheBust strips prior query", () => {
    const base = "https://example.com/avatars/u/avatar.jpg";
    const out = withAvatarCacheBust(`${base}?t=1`);
    assert.ok(out.startsWith(`${base}?t=`));
    assert.notEqual(out, `${base}?t=1`);
  });

  it("resolveAvatarUrl prefers metadata over empty", () => {
    const url = "https://example.com/a.jpg";
    assert.equal(
      resolveAvatarUrl({ id: "u1", user_metadata: { avatar_url: url } }),
      url,
    );
    assert.equal(
      resolveAvatarUrl({ id: "u1", user_metadata: { avatar_url: "" } }),
      null,
    );
  });
});
