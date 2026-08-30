import type { KtTheme } from "./types";

/**
 * Flatten a theme into --kt-* custom properties. Applied on the ThemeProvider
 * wrapper (NOT :root) so multiple themes can coexist on one page (gallery,
 * comparison views). Every visual value a component needs is either one of
 * these vars (CSS) or read from the theme object (canvas renderers).
 */
export function cssVars(t: KtTheme): Record<string, string> {
  const v: Record<string, string> = {
    "--kt-bg": t.stage.canvas,
    "--kt-bg-panel": t.stage.panel,
    "--kt-bg-panel-raised": t.stage.panelRaised,
    "--kt-border": t.stage.border,
    "--kt-panel-shadow": t.stage.shadow,
    "--kt-panel-blur": `${t.stage.panelBlur}px`,
    "--kt-grid": t.structure.grid,
    "--kt-grid-dots": t.structure.gridDots,
    "--kt-axis": t.structure.axis,
    "--kt-text": t.text.primary,
    "--kt-text-muted": t.text.muted,
    "--kt-font-ui": t.typography.ui,
    "--kt-font-display": t.typography.display,
    "--kt-font-display-weight": String(t.typography.displayWeight),
    "--kt-size-base": `${t.typography.sizes.base}px`,
    "--kt-size-readout": `${t.typography.sizes.readout}px`,
    "--kt-size-formula": `${t.typography.sizes.formula}px`,
    "--kt-size-question": `${t.typography.sizes.question}px`,
    "--kt-size-caption": `${t.typography.sizes.caption}px`,
    "--kt-stroke-curve": `${t.stroke.curvePrimary}px`,
    "--kt-stroke-tangent": `${t.stroke.tangent}px`,
    "--kt-stroke-axis": `${t.stroke.axis}px`,
    "--kt-ease-smooth": t.motion.easeSmooth,
    "--kt-ease-rush-into": t.motion.easeRushInto,
    "--kt-ease-rush-from": t.motion.easeRushFrom,
    "--kt-dur-draw": `${t.motion.durDraw}ms`,
    "--kt-dur-fade": `${t.motion.durFade}ms`,
    "--kt-dur-feedback": `${t.motion.durFeedback}ms`,
  };
  for (const role of ["object", "touch", "right", "wrong", "alt", "alt2"] as const) {
    const cssRole = role === "right" ? "correct" : role;
    v[`--kt-${cssRole}`] = t.accents[role].stroke;
    v[`--kt-${cssRole}-ink`] = t.accents[role].ink;
  }
  return v;
}
