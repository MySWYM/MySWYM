# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary user: a swimmer who already knows how to swim lengths and wants a clear, structured training plan without hiring an in-person coach. Situations include regular pool progression, triathlon swim prep, and open-water distance bands. Job: stop improvising sessions, know what to do before entering the water.

Secondary: Premium subscribers who may message Arthur via in-app chat for human support (not the core product job).

## Product Purpose

MySWYM delivers a personalized swim training plan from a short questionnaire (goal, level, frequency, and related preferences). Success: the swimmer opens a readable session (warm-up, main set, cool-down, coach tip), follows it in the lane, and can progress or adapt over weeks without guessing.

## Positioning

Structured coaching from explicit training rules, catalogues, Soft Sheet plans (01–13), and a validated composer + quality gate. Not a free-form LLM that invents sessions. Soft Sheet or composer + validation is required before a session is published to a swimmer. Differentiation: local, reproducible plan generation with coach-grade session structure, plus optional human chat with Arthur for Premium.

## Operating Context

- Pool training (25 m / 50 m), optional equipment, French-first product copy.
- Onboarding questionnaire → plan → week sessions → feedback / adaptation for future weeks.
- Access: one-time 7-day Premium trial without card; then sessions pause until a paid subscription.
- Pricing (product fact): ~€9.99/mo flex, ~€4.99/mo 12-month commit, ~€52.99/year prepaid (Stripe).
- Support: Premium chat answered by Arthur in person when available; landing must not claim AI bot support for that channel.
- Staging at staging.myswym.app; production merge is human-owned (`staging` → `main`).

## Capabilities and Constraints

Confirmed:

- Soft plans **01–13** = Google Sheet as visible source (Nager / triathlon / open water). Diplomas and other non-Soft paths = `composeSession` + quality gate.
- Never silently regenerate weeks of an existing user plan; preserve progress (`shouldPreserveWeek` / `mergePreservingProgress`). `PLAN_VERSION` is metadata only.
- Auth routes: `/connexion`, `/inscription` (legacy `?auth=` redirects).
- Global footer on public pages; FR typography: no em/en dashes in product copy (see project typo rules).
- i18n: FR primary, EN present for landing/marketing surfaces.
- Stack (incumbent): React + Vite SPA, Vercel API routes, Supabase, Stripe, Resend, PostHog.

Undecided / open:

- Broader accessibility standard beyond sensible web defaults (no WCAG target locked in PRODUCT.md yet).

## Brand Commitments

- Name: **MySWYM**.
- Voice: direct, coach-like French, second person “tu”, concrete pool language.
- Personality assets: otter mascot (chat / empty states), coach Arthur Noël (photo, Instagram, human support).
- Incumbent type pair used in product UI: Geist + Space Grotesk (do not treat as a redesign brief here).
- Night-pool dark marketing DA on landing (`#000514`, blue `#006bfd`) is incumbent visual evidence, not a PRODUCT visual recipe.

## Evidence on Hand

- Landing and marketing copy: `src/i18n/locales/fr/landing.json` (and `en/`).
- Natation truth docs: `docs/natation-source-de-verite.md`, `docs/natation-regles-actives.md`, `docs/natation-validation-seances.md`, `docs/natation-historique.md`.
- Public assets: `public/` (logo, hero, objective media, phone mockups, coach photo).
- Published reviews mechanism on landing (do not invent testimonials).
- Do not fabricate customers, benchmarks, or legal claims beyond code/docs.

## Product Principles

1. **Clarity before the water** — every session must be scannable in the lane (structure + tip).
2. **Rules over freeform AI** — published sessions come from Sheet Soft or composer + validation, never ungoverned LLM output.
3. **Preserve swimmer progress** — never silently rewrite weeks already started.
4. **Honest access** — trial then pause is explicit; Premium unlocks full plans and human chat.
5. **Human support when promised** — chat support is Arthur, not a bot; do not blur that in marketing.

## Accessibility & Inclusion

No product-specific standard locked yet. Default expectation: usable on mobile and desktop, visible focus, readable contrast on the dark marketing surfaces, and keyboard access to interactive landing controls.
