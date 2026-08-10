/**
 * API /api/app-version — smoke test (no Vercel runtime).
 * Usage : node --experimental-strip-types api/app-version.test.ts
 *   or : npx tsx api/app-version.test.ts
 */
import handler from "./app-version.ts";

function mockRes() {
  const headers = {};
  return {
    statusCode: 200,
    body: null,
    headers,
    setHeader(k, v) {
      headers[k] = v;
    },
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
    end() {
      return this;
    },
  };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

process.env.MIN_SUPPORTED_APP_VERSION = "1.1.0";
process.env.LATEST_APP_VERSION = "1.1.0";
process.env.FORCE_UPDATE_MESSAGE = "Update now";

const res = mockRes();
handler({ method: "GET" }, res);
assert(res.statusCode === 200, "200");
assert(res.body.minSupportedAppVersion === "1.1.0", "min from env");
assert(res.body.latestAppVersion === "1.1.0", "latest from env");
assert(res.body.message === "Update now", "message");
assert(String(res.headers["Cache-Control"]).includes("no-store"), "no-store");

const res405 = mockRes();
handler({ method: "POST" }, res405);
assert(res405.statusCode === 405, "405 on POST");

console.log("✅ api/app-version.test.ts OK");
