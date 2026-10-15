import { describe, expect, it } from "vitest";
import { layout } from "../src/spec/templates/lumaskin";

/** STANDARDS W18 (Felix 2026-10-15: «matrisene skal være like brede … passe fint høydemessig med kvitteringen …
    bredden på matrisen skal være statisk»). The board's geometry depends on n only, so checking it here keeps every
    future change honest — not a surprise from round to round. */
describe("lu-maskin board geometry (W18)", () => {
  for (const n of [2, 3, 4])
    for (const narrow of [false, true]) {
      const nOps = (n * (n - 1)) / 2;
      const L = layout(n, nOps, narrow);
      const [lbl, lbr, lbt, lbb] = L.lb;
      const tag = `${n}×${n} ${narrow ? "phone" : "wide"}`;

      it(`${tag}: the two matrices and the receipt are equally wide`, () => {
        expect(lbr - lbl).toBeCloseTo(L.br - L.bl, 6);
        expect(L.card.w).toBeCloseTo(L.br - L.bl, 6);
      });

      it(`${tag}: the receipt is exactly as tall as the matrices`, () => {
        expect(lbb - lbt).toBeCloseTo(L.bb - L.bt, 6);
        expect(L.card.h).toBeCloseTo(L.bb - L.bt, 6);
      });

      it(`${tag}: side-by-side blocks share top, bottom and label line`, () => {
        expect(L.card.y).toBeCloseTo(lbt, 6);
        expect(L.cardLabelY).toBeCloseTo(L.lLabelY, 6);
        if (!narrow) {
          expect(L.card.y).toBeCloseTo(L.bt, 6);
          expect(L.cardLabelY).toBeCloseTo(L.labelY, 6);
        }
      });

      it(`${tag}: blocks do not overlap and stay inside the board`, () => {
        if (!narrow) expect(L.br).toBeLessThan(L.card.x);
        expect(L.card.x + L.card.w).toBeLessThan(lbl);
        expect(L.arrowXl).toBeGreaterThanOrEqual(0);
        expect(L.card.x).toBeGreaterThanOrEqual(0);
        expect(lbr).toBeLessThanOrEqual(L.vw);
        expect(L.bb).toBeLessThan(L.h);
        expect(lbb).toBeLessThan(L.h);
      });

      it(`${tag}: receipt lines sit inside the card, level with the rows when they fit`, () => {
        expect(L.card.lineYs).toHaveLength(nOps);
        for (const y of L.card.lineYs) {
          expect(y).toBeGreaterThan(L.card.y);
          expect(y).toBeLessThan(L.card.y + L.card.h - 6);
        }
        if (nOps <= n) L.card.lineYs.forEach((y, j) => expect(y).toBeCloseTo(L.lys[j], 6));
      });

      it(`${tag}: matrix columns are evenly spaced at a fixed width`, () => {
        for (let c = 1; c < n; c++) {
          expect(L.xs[c] - L.xs[c - 1]).toBeCloseTo(L.cw, 6);
          expect(L.lxs[c] - L.lxs[c - 1]).toBeCloseTo(L.cw, 6);
        }
      });
    }
});
