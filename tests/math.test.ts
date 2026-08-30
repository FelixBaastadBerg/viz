import { describe, expect, it } from "vitest";
import { smooth, ddx, simpson, simpson2d, sample, fmt, clamp } from "../src/math";

describe("smooth (Manim smootherstep)", () => {
  it("fixes endpoints and midpoint", () => {
    expect(smooth(0)).toBe(0);
    expect(smooth(1)).toBe(1);
    expect(smooth(0.5)).toBeCloseTo(0.5, 12);
  });
  it("clamps outside [0,1]", () => {
    expect(smooth(-2)).toBe(0);
    expect(smooth(3)).toBe(1);
  });
  it("has zero first and second derivative at endpoints (C² easing)", () => {
    const h = 1e-4;
    expect((smooth(h) - smooth(0)) / h).toBeCloseTo(0, 6);
    expect((smooth(1) - smooth(1 - h)) / h).toBeCloseTo(0, 6);
  });
});

describe("ddx", () => {
  it("differentiates polynomials", () => {
    const f = (x: number) => 0.1 * x ** 3 - x + 1;
    expect(ddx(f, 2)).toBeCloseTo(0.3 * 4 - 1, 6);
  });
  it("differentiates sin", () => {
    expect(ddx(Math.sin, 0)).toBeCloseTo(1, 6);
    expect(ddx(Math.sin, Math.PI / 2)).toBeCloseTo(0, 6);
  });
});

describe("simpson", () => {
  it("is exact for cubics", () => {
    const f = (x: number) => x ** 3 - 2 * x + 1;
    // ∫₀² = 4 - 4 + 2 = 2
    expect(simpson(f, 0, 2, 2)).toBeCloseTo(2, 12);
  });
  it("converges for sin", () => {
    expect(simpson(Math.sin, 0, Math.PI, 64)).toBeCloseTo(2, 6);
  });
});

describe("simpson2d", () => {
  it("matches the closed form of the volume artifact integrand", () => {
    const f = (x: number, y: number) => 2 + Math.sin(x) * Math.cos(y);
    const analytic = (a: number, b: number, c: number, d: number) =>
      2 * (b - a) * (d - c) +
      (Math.cos(a) - Math.cos(b)) * (Math.sin(d) - Math.sin(c));
    expect(simpson2d(f, -2, 1.5, -1.5, 2)).toBeCloseTo(analytic(-2, 1.5, -1.5, 2), 6);
  });
});

describe("sample", () => {
  it("includes both endpoints", () => {
    const pts = sample((x) => x * x, -1, 1, 4);
    expect(pts).toHaveLength(5);
    expect(pts[0]).toEqual([-1, 1]);
    expect(pts[4]).toEqual([1, 1]);
  });
});

describe("fmt", () => {
  it("uses the proper minus sign", () => {
    expect(fmt(-1.5)).toBe("−1.50");
    expect(fmt(1.5)).toBe("1.50");
  });
  it("never renders −0.00", () => {
    expect(fmt(-0.0001)).toBe("0.00");
  });
});

describe("clamp", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 1)).toBe(1);
    expect(clamp(-5, 0, 1)).toBe(0);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });
});
