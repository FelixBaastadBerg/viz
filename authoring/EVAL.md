# Authoring eval — first-try success (2026-08-29)

**Result: 10/10 first-try, target ≥ 8/10 met.**

## Setup

- Generator: Claude (Fable 5) following `system-prompt.md` *only*, one attempt
  per snippet, no retries used.
- Inputs: the 10 snippets in `snippets.md` (1T/R1/R2/S1), rubric frozen before
  generation.
- Stage 1 (automated, in CI): `tests/authoring.test.ts` — JSON parses,
  `validateSpec` clean on attempt 1, template matches rubric, no colour words
  in student text. 30/30 assertions green.
- Stage 2 (automated): `scripts/eval-authoring.mjs` — every spec rendered
  headless via `spec-preview.html`; zero console/page errors. 10/10.
- Stage 3 (rubric, manual): screenshots in `eval/renders/` checked against the
  frozen rubric — template fit, visible mathematical point, sensible view
  windows. 10/10. Interactive check: spec-05's quiz goal (drag to 210°)
  verified by simulated drag → correct-state + events.

| # | Snippet | Template chosen | Valid 1st try | Renders clean | Rubric |
|---|---|---|---|---|---|
| 01 | Momentan vekstfart (1T) | funksjon-tangent | ✓ | ✓ | ✓ |
| 02 | Grafisk likning + quiz (1T) | likning-grafisk | ✓ | ✓ | ✓ (begge skjæringer synlige, expr-zero-quiz) |
| 03 | Verditap 12 % (1T) | eksponentiell-vekst | ✓ | ✓ | ✓ (k=0.88, halveringstid 5.42 synlig) |
| 04 | Fortegnet til f′ (R1) | derivert-graf | ✓ | ✓ | ✓ |
| 05 | Enhetssirkel 210° + quiz (R1) | enhetssirkel | ✓ | ✓ | ✓ (drag-sim → correct) |
| 06 | Parallellogrammetoden (R1) | vektorer | ✓ | ✓ | ✓ |
| 07 | Bestemt integral (R2) | areal-under-kurve | ✓ | ✓ | ✓ |
| 08 | Geometrisk rekke (R2) | foelge-rekke | ✓ | ✓ | ✓ (Sₙ → 3) |
| 09 | Binomisk n=12 p=1/6 (S1) | binomisk-fordeling | ✓ | ✓ | ✓ |
| 10 | Havnivå-modell (R2) | trig-funksjon | ✓ | ✓ | ✓ |

## Why it works (design, not luck)

- The AI writes **specs, not code** — the search space per snippet is one
  template id + a handful of typed params.
- Validation errors are written for the model (`missing required param "f"
  (funksjonen…)`) so the retry loop converges; it was not needed here.
- The colour rule (no colour words; `touchNameNb` belongs to the theme) keeps
  specs theme-portable.

## Honest limitations / follow-ups

1. Generator, snippets and rubric come from the same session (rubric frozen
   first). Next hardening: run the identical prompt through a fresh model
   instance API-side, and have Felix mark 10 new snippets blind.
2. Snippets are textbook-shaped; real inputs will be messier (scanned exam
   text, long transcripts). The Phase-2 loop contract (validate → feed errors
   back once) is built for that.
3. Readout decimals currently render with "." — bokmål convention is ","
   (open question for Felix in PROGRESS.md).
