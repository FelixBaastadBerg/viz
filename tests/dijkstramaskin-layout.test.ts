import { describe, expect, it } from "vitest";
import { dlayout } from "../src/spec/templates/dijkstramaskin";
import { NODES } from "../src/spec/templates/dijkstra";

/** STANDARDS W18: the graph and the distance card share top, bottom (side by side) and the label line; everything
    stays inside the board; the nodes stay inside the graph block. */
describe("dijkstra-maskin board geometry (W18)", () => {
  for (const narrow of [false, true]) {
    const L = dlayout(narrow);
    const tag = narrow ? "phone" : "wide";
    it(`${tag}: blocks inside the board`, () => {
      for (const b of [L.graph, L.card]) {
        expect(b.x).toBeGreaterThanOrEqual(0);
        expect(b.x + b.w).toBeLessThanOrEqual(L.vw);
        expect(b.y + b.h).toBeLessThan(L.h);
      }
    });
    if (!narrow)
      it("wide: side by side, same top, bottom and label line", () => {
        expect(L.card.y).toBeCloseTo(L.graph.y, 6);
        expect(L.card.h).toBeCloseTo(L.graph.h, 6);
        expect(L.cardLabelY).toBeCloseTo(L.labelY, 6);
        expect(L.graph.x + L.graph.w).toBeLessThan(L.card.x);
      });
    it(`${tag}: every node (with its ring) inside the graph block`, () => {
      const G = L.graph;
      for (const [x, y] of Object.values(NODES)) {
        const px = G.cx + x * G.s;
        const py = G.cy + y * G.s;
        expect(px - G.r).toBeGreaterThanOrEqual(G.x);
        expect(px + G.r).toBeLessThanOrEqual(G.x + G.w);
        expect(py - G.r).toBeGreaterThanOrEqual(G.y);
        expect(py + G.r).toBeLessThanOrEqual(G.y + G.h);
      }
    });
    it(`${tag}: the header and six rows fit the card`, () => {
      const C = L.card;
      expect(C.y0 + 6 * C.rowH + C.rowH / 2).toBeLessThanOrEqual(
        C.y + C.h + 1e-6,
      );
    });
  }
});
