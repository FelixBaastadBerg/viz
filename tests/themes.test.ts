/**
 * Theme integrity tests: every design direction must satisfy the schema AND
 * WCAG contrast on its own stage — the accessibility promise is executable.
 */
import { describe, expect, it } from "vitest";
import { themes } from "../src/theme/themes";
import { cssVars } from "../src/theme/cssVars";
import type { KtRole } from "../src/theme/types";

function srgb(c: number): number {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
}
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.2126 * srgb(r) + 0.7152 * srgb(g) + 0.0722 * srgb(b);
}
function contrast(a: string, b: string): number {
  const [lo, hi] = [luminance(a), luminance(b)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}

const ROLES: KtRole[] = ["object", "touch", "right", "wrong", "alt", "alt2"];

describe.each(Object.values(themes))("theme $name", (t) => {
  it("passes WCAG 1.4.3 for text on its stage", () => {
    expect(contrast(t.stage.canvas, t.text.primary)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(t.stage.canvas, t.text.muted)).toBeGreaterThanOrEqual(4.5);
  });

  it("passes WCAG 1.4.11 (≥3:1) for axis and every accent stroke", () => {
    expect(contrast(t.stage.canvas, t.structure.axis)).toBeGreaterThanOrEqual(3);
    for (const role of ROLES) {
      expect
        .soft(contrast(t.stage.canvas, t.accents[role].stroke), `${role}.stroke`)
        .toBeGreaterThanOrEqual(3);
    }
  });

  it("passes WCAG 1.4.3 (≥4.5:1) for every accent ink", () => {
    for (const role of ROLES) {
      expect
        .soft(contrast(t.stage.canvas, t.accents[role].ink), `${role}.ink`)
        .toBeGreaterThanOrEqual(4.5);
    }
  });

  it("keeps cross-theme semantic conventions", () => {
    // touch is warm (red channel dominates blue), right is green-dominant,
    // wrong is red-dominant — muscle memory across directions.
    const ch = (hex: string, i: number) =>
      parseInt(hex.replace("#", "").slice(i * 2, i * 2 + 2), 16);
    expect(ch(t.accents.touch.stroke, 0)).toBeGreaterThan(ch(t.accents.touch.stroke, 2));
    expect(ch(t.accents.right.stroke, 1)).toBeGreaterThan(ch(t.accents.right.stroke, 2));
    expect(ch(t.accents.wrong.stroke, 0)).toBeGreaterThan(ch(t.accents.wrong.stroke, 1));
  });

  it("carries a complete Manim mapping", () => {
    expect(t.manim.background_color).toBe(t.stage.canvas);
    expect(t.manim.kt_object).toBe(t.accents.object.stroke);
    expect(t.manim.kt_touch).toBe(t.accents.touch.stroke);
  });

  it("flattens to CSS vars with all semantic roles", () => {
    const v = cssVars(t);
    for (const key of [
      "--kt-bg", "--kt-object", "--kt-object-ink", "--kt-touch", "--kt-touch-ink",
      "--kt-correct", "--kt-wrong", "--kt-alt", "--kt-alt2",
      "--kt-dur-draw", "--kt-ease-smooth", "--kt-font-ui",
    ]) {
      expect(v[key], key).toBeTruthy();
    }
  });
});
