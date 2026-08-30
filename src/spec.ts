/**
 * @kateter/viz spec entry — the authoring system: widget spec format,
 * template catalogue, renderer. Pulls the 3D stack (flate-volum-3d), so it is
 * its own entry point like ./3d.
 */
export * from "./spec/types";
export { fn1, fn2, exprToTex } from "./spec/expr";
export { validateSpec, getTemplate, allTemplates, registerTemplate } from "./spec/registry";
export { SpecRenderer } from "./spec/SpecRenderer";
export { SpecQuiz, goalMet } from "./spec/SpecQuiz";
