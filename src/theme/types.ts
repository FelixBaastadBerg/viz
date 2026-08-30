/** Kateter theme schema v0.3 — one JSON per design direction, themes are data. */

export interface KtAccent {
  /** For graphics (curves, points, fills) — ≥ 3:1 on the theme's stage. */
  stroke: string;
  /** For text — ≥ 4.5:1 on the theme's stage. Dark themes: ink == stroke. */
  ink: string;
}

export interface KtTheme {
  name: string;
  label: string;
  mode: "light" | "dark" | string;
  case: string;
  /** Bokmål name of the touch colour, for student-facing copy. */
  touchNameNb: string;
  stage: {
    canvas: string;
    panel: string;
    panelRaised: string;
    border: string;
    panelBlur: number;
    shadow: string;
  };
  structure: { grid: string; gridDots: string; axis: string };
  text: { primary: string; muted: string };
  accents: {
    object: KtAccent;
    touch: KtAccent;
    right: KtAccent;
    wrong: KtAccent;
    alt: KtAccent;
    alt2: KtAccent;
  };
  typography: {
    ui: string;
    display: string;
    displayWeight: number;
    fontPackages: string[];
    sizes: {
      base: number;
      readout: number;
      formula: number;
      question: number;
      caption: number;
      axisCanvas: number;
      axisLetter: number;
    };
  };
  stroke: {
    curvePrimary: number;
    curveSecondary: number;
    tangent: number;
    axis: number;
    grid: number;
  };
  point: { radius: number; haloRadius: number; haloOpacity: number };
  fill: { areaOpacity: number };
  motion: {
    easeSmooth: string;
    easeRushInto: string;
    easeRushFrom: string;
    durDraw: number;
    durFade: number;
    durFeedback: number;
    stagger: number;
  };
  effects: { glow: boolean; glowBlur: number };
  scene3d: {
    surfaceOpacity: number;
    surfaceRoughness: number;
    coordCurveOpacity: number;
    columnOpacity: number;
    regionFillOpacity: number;
    ambient: number;
    key: number;
    fill: number;
    emissive: number;
  };
  manim: Record<string, string>;
}

/** Semantic accent roles — components reference these, never colour names. */
export type KtRole = "object" | "touch" | "right" | "wrong" | "alt" | "alt2";
