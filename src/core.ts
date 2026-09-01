/**
 * @kateter/viz core — everything except the 3D stack (2D pages must not pay for three.js; import "./3d" where you need it).
 *
 * Themes are data (src/theme/themes/*.json). Components consume semantic
 * roles (object / touch / right / wrong / alt) — never colour names, never
 * hard-coded visual values. Host app imports:
 *   import "mafs/core.css";
 *   import "katex/dist/katex.min.css";
 *   import "@kateter/viz/src/kviz.css";  (and serves /fonts-cm, /fonts-ttf)
 */

// theme
export * from "./theme/types";
export * from "./theme/themes";
export { cssVars } from "./theme/cssVars";
export { ThemeProvider, useKtTheme, glowFilter, loadThemeFonts } from "./theme/ThemeProvider";

// hooks + math
export { useIntro, useElementSize } from "./hooks";
export * from "./math";

// 2D
export { KPlot, type KPlotProps } from "./2d/KPlot";
export {
  KCurve, KTangent, KVector, KArea, KLabel, KMathLabel, KPoint,
  useRoleColor, curveLabelPos,
  type KCurveProps, type KTangentProps, type KVectorProps,
  type KAreaProps, type KLabelProps, type KMathLabelProps,
  type KPointProps, type KDraggable,
} from "./2d/primitives";

// chrome
export {
  KFormula, KMixed, KPanel, KReadout, KCaption, KSlider, KLegend, KFig, useTexColor,
  type KPanelProps, type KReadoutItem, type KSliderProps,
  type KLegendProps, type KLegendItem, type KLegendCorner,
} from "./chrome";

// quiz
export { QuizCard, PredictReveal, type QuizCardProps, type PredictRevealProps } from "./quiz/QuizCard";
export { useQuiz, type QuizStatus, type QuizState } from "./quiz/useQuiz";
export { onQuizEvent, emitQuizEvent, type QuizEvent, type QuizEventListener } from "./quiz/events";
