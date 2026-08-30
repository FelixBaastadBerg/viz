/**
 * Authoring eval, stage 1: every generated spec must validate first try, and
 * its template choice must match the frozen rubric in authoring/snippets.md.
 * (Stage 2 — clean headless render — runs in scripts/eval-authoring.mjs.)
 */
import { readFileSync } from "fs";
import { describe, expect, it } from "vitest";
import { validateSpec } from "../src/spec/registry";
import type { WidgetSpec } from "../src/spec/types";
// side effect: register the catalogue
import "../src/spec/SpecRenderer";

const RUBRIC_TEMPLATE: Record<string, string> = {
  "spec-01": "funksjon-tangent",
  "spec-02": "likning-grafisk",
  "spec-03": "eksponentiell-vekst",
  "spec-04": "derivert-graf",
  "spec-05": "enhetssirkel",
  "spec-06": "vektorer",
  "spec-07": "areal-under-kurve",
  "spec-08": "foelge-rekke",
  "spec-09": "binomisk-fordeling",
  "spec-10": "trig-funksjon",
};

describe.each(Object.entries(RUBRIC_TEMPLATE))("%s", (name, expectedTemplate) => {
  const spec = JSON.parse(
    readFileSync(new URL(`../authoring/eval/${name}.json`, import.meta.url), "utf8")
  ) as WidgetSpec;

  it("chooses the rubric template", () => {
    expect(spec.template).toBe(expectedTemplate);
  });

  it("validates first try", () => {
    const v = validateSpec(spec);
    expect(v.errors).toEqual([]);
    expect(v.ok).toBe(true);
  });

  it("student-facing text is colour-word free (theme decides colour)", () => {
    const text = JSON.stringify([spec.title, spec.quiz ?? {}]);
    expect(text).not.toMatch(/gul|oransje|gyllen|blå/i);
  });
});
