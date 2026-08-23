import assert from "node:assert/strict";
import { BUILTIN_ARTHUR_ADMIN_EMAILS } from "./admin-auth.js";

assert.deepEqual(BUILTIN_ARTHUR_ADMIN_EMAILS, ["admin@myswym.app"]);
console.log("admin-auth builtins ok");
