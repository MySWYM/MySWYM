import assert from "node:assert/strict";
import { restoreBackdropFilter } from "./vite-backdrop-filter-fix.mjs";

const a = restoreBackdropFilter(".b{-webkit-backdrop-filter:blur(24px)saturate(1.2)!important;background:#fff}");
assert.equal(a, ".b{-webkit-backdrop-filter:blur(24px)saturate(1.2)!important;backdrop-filter:blur(24px)saturate(1.2)!important;background:#fff}");
const b = ".c{-webkit-backdrop-filter:blur(10px);backdrop-filter:blur(10px)}";
assert.equal(restoreBackdropFilter(b), b, "déjà présent : inchangé");
const c = restoreBackdropFilter(".d{color:red;-webkit-backdrop-filter:none!important}");
assert.equal(c, ".d{color:red;-webkit-backdrop-filter:none!important;backdrop-filter:none!important}");
console.log("vite-backdrop-filter-fix ok");
