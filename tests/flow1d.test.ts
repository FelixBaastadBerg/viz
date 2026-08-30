import { describe, expect, it } from "vitest";
import { buildFlow1D, gauss, mixture } from "../src/math/flow1d";

const p0 = gauss(0, 1);
const target = mixture([
  { w: 0.45, mu: -1.6, sigma: 0.35 },
  { w: 0.2, mu: 0.2, sigma: 0.25 },
  { w: 0.35, mu: 1.5, sigma: 0.5 },
]);
const flow = buildFlow1D(p0, target);

function integrate(y: Float64Array, p: Float64Array): number {
  let s = 0;
  for (let i = 1; i < y.length; i++) s += ((p[i - 1] + p[i]) / 2) * (y[i] - y[i - 1]);
  return s;
}

describe("buildFlow1D", () => {
  it("T is monotone increasing", () => {
    for (let i = 1; i < flow.T.length; i++) {
      expect(flow.T[i]).toBeGreaterThanOrEqual(flow.T[i - 1]);
    }
  });

  it("T_0 is the identity", () => {
    for (let i = 0; i < flow.xs.length; i += 97) {
      expect(flow.mapAt(0, i)).toBeCloseTo(flow.xs[i], 12);
    }
  });

  it("every intermediate density integrates to 1", () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const { y, p } = flow.curve(t);
      expect(integrate(y, p)).toBeCloseTo(1, 2);
    }
  });

  it("p_1 matches the target density pointwise", () => {
    for (const x of [-1.6, -0.5, 0.2, 1.0, 1.5]) {
      expect(flow.densityAt(1, x)).toBeCloseTo(target(x), 1);
    }
  });

  it("KL decreases from start to finish, ending ≈ 0", () => {
    const k0 = flow.kl(0);
    const k1 = flow.kl(1);
    expect(k0).toBeGreaterThan(0.1);
    expect(k1).toBeLessThan(0.01);
    expect(k1).toBeLessThan(k0);
  });

  it("KL(0) equals the direct KL(p0‖q) quadrature", () => {
    let s = 0;
    const N = 4001;
    const lo = -4.5, hi = 4.5, h = (hi - lo) / (N - 1);
    let prev = 0;
    for (let i = 0; i < N; i++) {
      const x = lo + i * h;
      const pv = p0(x);
      const term = pv > 1e-14 ? pv * Math.log(pv / Math.max(target(x), 1e-300)) : 0;
      if (i > 0) s += ((prev + term) / 2) * h;
      prev = term;
    }
    expect(flow.kl(0)).toBeCloseTo(s, 2);
  });
});
