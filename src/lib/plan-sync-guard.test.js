import assert from "node:assert/strict";
import { shouldApplyRemotePlanSync } from "./plan-sync-guard.js";

assert.equal(
  shouldApplyRemotePlanSync({
    localTime: 200,
    remoteTime: 100,
    currentProgress: 1,
    mergedProgress: 1,
  }),
  false,
  "local newer → keep memory",
);

assert.equal(
  shouldApplyRemotePlanSync({
    localTime: 100,
    remoteTime: 200,
    currentProgress: 5,
    mergedProgress: 2,
  }),
  false,
  "local more progress → keep memory",
);

assert.equal(
  shouldApplyRemotePlanSync({
    localTime: 100,
    remoteTime: 200,
    currentProgress: 2,
    mergedProgress: 5,
  }),
  true,
  "remote ahead → apply",
);

assert.equal(
  shouldApplyRemotePlanSync({
    localTime: 100,
    remoteTime: 100,
    currentProgress: 2,
    mergedProgress: 2,
  }),
  true,
  "tie timestamps + progress → allow merge path",
);

console.log("plan-sync-guard PASS");
