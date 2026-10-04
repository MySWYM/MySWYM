import assert from "node:assert/strict";
import {
  LOVE_REVIEW_MAX_LATER,
  LOVE_REVIEW_MIN_USAGE_MS,
  LOVE_REVIEW_STORE_DELAY_MS,
  answerLoveNo,
  answerLoveYes,
  blankLoveReviewState,
  loveReviewBlocksSessionStoreAsk,
  loveStoreAskAtMs,
  shouldShowLovePrompt,
  shouldShowLoveStoreAsk,
  snoozeLovePrompt,
  completeLoveFunnel,
} from "./love-review-funnel.js";

const t0 = 1_700_000_000_000;

const baseState = {
  ...blankLoveReviewState(t0),
  firstOpenAt: t0,
};

assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS,
    finishedSessions: 1,
    state: baseState,
    storeAlreadyAsked: false,
  }),
  true,
  "eligible at J+7 with 1 session",
);

assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS - 1,
    finishedSessions: 3,
    state: baseState,
    storeAlreadyAsked: false,
  }),
  false,
  "not before 7 days",
);

assert.equal(
  shouldShowLovePrompt({
    isNative: false,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS,
    finishedSessions: 3,
    state: baseState,
    storeAlreadyAsked: false,
  }),
  false,
  "web ignored",
);

assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS,
    finishedSessions: 0,
    state: baseState,
    storeAlreadyAsked: false,
  }),
  false,
  "needs a session",
);

// answerLoveYes / store delay (sans localStorage : on passe l’état muté à la main)
const yesState = {
  ...baseState,
  answer: "yes",
  storeAskAt: t0 + LOVE_REVIEW_STORE_DELAY_MS,
};
assert.equal(
  shouldShowLoveStoreAsk({
    isNative: true,
    now: t0 + LOVE_REVIEW_STORE_DELAY_MS,
    state: yesState,
    storeAlreadyAsked: false,
  }),
  true,
  "store ask after 24h",
);
assert.equal(
  shouldShowLoveStoreAsk({
    isNative: true,
    now: t0 + LOVE_REVIEW_STORE_DELAY_MS - 1,
    state: yesState,
    storeAlreadyAsked: false,
  }),
  false,
  "store ask not before 24h",
);

assert.equal(loveReviewBlocksSessionStoreAsk({ ...baseState, answer: "no" }), true);
assert.equal(
  loveReviewBlocksSessionStoreAsk(yesState, t0 + 1000),
  true,
  "blocks session review while waiting 24h",
);
assert.equal(loveStoreAskAtMs(yesState), t0 + LOVE_REVIEW_STORE_DELAY_MS);

assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS,
    finishedSessions: 2,
    state: { ...baseState, answer: "yes" },
    storeAlreadyAsked: false,
  }),
  false,
  "no love prompt after yes",
);

// snooze / complete helpers need localStorage — smoke via pure shape
const snoozed = {
  ...baseState,
  laterCount: 1,
  laterUntil: t0 + LOVE_REVIEW_MIN_USAGE_MS + 1000,
};
assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS,
    finishedSessions: 2,
    state: snoozed,
    storeAlreadyAsked: false,
  }),
  false,
  "snoozed until laterUntil",
);

assert.equal(
  shouldShowLovePrompt({
    isNative: true,
    now: t0 + LOVE_REVIEW_MIN_USAGE_MS + 10_000,
    finishedSessions: 2,
    state: { ...baseState, laterCount: LOVE_REVIEW_MAX_LATER, laterUntil: null },
    storeAlreadyAsked: false,
  }),
  false,
  "stops after max snoozes",
);

assert.equal(typeof answerLoveYes, "function");
assert.equal(typeof answerLoveNo, "function");
assert.equal(typeof snoozeLovePrompt, "function");
assert.equal(typeof completeLoveFunnel, "function");

console.log("love-review-funnel.test.js: ok");
