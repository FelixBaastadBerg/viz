# @kateter/viz

Kateter's token-locked visualisation library. Components read every visual value from
the active theme (design directions are **data**: `src/theme/themes/*.json`); pages are
a few dozen lines of intent.

```
yarn install --ignore-engines
yarn dev        # gallery on :5175 (all components × all 3 themes, live knobs)
yarn test       # vitest: math + theme integrity (WCAG contrast is asserted in CI)
yarn build      # tsc + vite build (gallery + the three artifact pages)
yarn shoot      # headless screenshot verification per theme (system Chrome)
```

## Layout

- `src/theme/` — schema (`types.ts`), the three directions (`themes/*.json` — canonical
  since Phase 1; `demos/design/themes/` is the Phase-0 snapshot), `ThemeProvider`
  (scoped CSS-var injection, several themes per page), `cssVars`.
- `src/2d/` — Mafs layer: `KPlot`, `KCurve`, `KTangent`, `KVector`, `KArea`, `KLabel`,
  `KPoint` (Graphica's constraint-drag union: `"unrestricted" | "horizontal" |
  "vertical" | (x,y)⇒[x,y]`; keyboard: focus + arrows).
- `src/3d/` — r3f layer: `KScene3D` (flat tone mapping, token light rig, camera
  presets), `KAxes3D` (CM canvas text), `KSurface` (iso-parameter curves), `KRegionColumn`
  (translucency policy baked in).
- `src/chrome/` — `KPanel`, `KFormula` (KaTeX, html output only), `KReadout`, `KSlider`,
  `KCaption`.
- `src/quiz/` — `QuizCard`, `PredictReveal`, `useQuiz`, and the typed
  `QuizEvent` stream (`onQuizEvent`) the future game layer subscribes to.
- `src/math/` — smooth easing, Simpson 1D/2D, numeric derivative, sampling, `fmt`.
- `artifacts/` — the three Phase-0 artifacts rebuilt on the library
  (`?theme=arv|eigengrau|nordlys`).
- `gallery/` — the quality bar. `evidence/` — screenshot proof.

## Import discipline

2D-only pages import from `@kateter/viz/core`; only pages that render 3D import
`@kateter/viz` (or `…/3d`) — this keeps three.js (≈276 KB gz) out of 2D bundles.
Host apps import `mafs/core.css`, `katex/dist/katex.min.css`, `src/kviz.css`, and serve
`/fonts-cm` + `/fonts-ttf` (copied from KaTeX).

## Verified quality bar (2026-08-29)

30 unit tests green (incl. WCAG 1.4.3/1.4.11 per theme); all 9 artifact×theme pages
error-free headless; keyboard drag works (focus + arrow keys moves `KPoint`, readouts
update); 60 fps sustained on the 3D volume page during a slider sweep; 2D pages ship
without the three.js chunk. Screenshot testing uses puppeteer-core + system Chrome
(no browser-binary downloads) instead of Playwright — same coverage, zero setup.
