import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "fs";
import { validateSpec } from "./spec/registry";
import "./spec/templates/diverse";
import "./spec/templates/funksjoner";
import "./spec/templates/geometri";
import "./spec/templates/data";
import "./spec/templates/vekst";
import "./spec/templates/riemann";
import "./spec/templates/omdreining3d";
import "./spec/templates/parametrisk";
import "./spec/templates/dijkstra";

const P = "/private/tmp/claude-501/-Users-fb-Documents-Kateter/187840b9-90b7-4062-9c7d-95f521b5bf0c/scratchpad/plans";
const H = "/private/tmp/claude-501/-Users-fb-Documents-Kateter/187840b9-90b7-4062-9c7d-95f521b5bf0c/scratchpad/harvest";

const plans = readdirSync(P).filter((f) => f.endsWith(".json"));

describe("chapter plans", () => {
  it("has 8 plans", () => expect(plans.length).toBe(8));
  for (const f of plans) {
    describe(f, () => {
      const plan = JSON.parse(readFileSync(`${P}/${f}`, "utf8"));
      it("schema basics", () => {
        expect(plan.modul_url).toBe(f.replace(".json", ""));
        expect(plan.sections.length).toBeGreaterThan(2);
        expect(plan.chapter_test.length).toBeGreaterThanOrEqual(4);
      });
      for (const s of plan.sections) {
        it(`section ${s.url}`, () => {
          expect(s.title.length).toBeLessThanOrEqual(50);
          expect(s.url).toMatch(/^[a-z0-9-]+$/);
          if (s.source) expect(existsSync(`${H}/${s.source}`), `missing ${s.source}`).toBe(true);
          else expect((s.outline ?? []).length).toBeGreaterThanOrEqual(3);
          for (const w of s.widgets ?? []) {
            const res = validateSpec(w.spec);
            expect(res.ok, `${s.url} widget: ${res.errors?.join("; ")}`).toBe(true);
          }
          if (s.video && s.video.exists) expect(s.video.source).toBeTruthy();
        });
      }
      for (const [i, q] of plan.chapter_test.entries()) {
        it(`test q${i + 1}`, () => {
          expect(q.alternatives.filter((a: any) => a.correct).length).toBe(1);
          expect(q.alternatives.length).toBeGreaterThanOrEqual(3);
          if (q.solution_widget) {
            const res = validateSpec(q.solution_widget);
            expect(res.ok, `q${i + 1}: ${res.errors?.join("; ")}`).toBe(true);
          }
        });
      }
    });
  }
});
