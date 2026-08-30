/**
 * @kateter/viz — full barrel (core + 3D). Pages that never render 3D should
 * import from "@kateter/viz/core" so the three.js stack stays out of their
 * bundle (fast first paint).
 */
export * from "./core";
export * from "./3d";
