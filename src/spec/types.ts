/**
 * The widget spec format — the contract between the authoring AI and the
 * renderer. AI generates SPECS (small declarative JSON), not code; the
 * library renders a spec directly. That is what makes first-try output
 * reliable. The escape hatch for the long tail is a hand-written page on
 * @kateter/viz (see artifacts/).
 */

/** A math expression in one variable, e.g. "0.1x^3 - x + 1" (mathjs syntax). */
export type Expr = string;
/** A math expression in two variables x, y (3D surfaces). */
export type Expr2 = string;

export interface QuizWrapper {
  /** Question shown on the card; `$...$` segments render as KaTeX. */
  question: string;
  /** KaTeX subtitle, typically the function definition. */
  subtitleTex?: string;
  /**
   * What the student must achieve, checked live against the widget's primary
   * interactive value v (template-specific — documented per template):
   *   {kind: "value-near", target, tolerance}     v ≈ target
   *   {kind: "expr-zero", expr, tolerance}        |expr(v)| < tolerance
   */
  goal:
    | { kind: "value-near"; target: number; tolerance: number }
    | { kind: "expr-zero"; expr: Expr; tolerance: number };
  /** Feedback lines (bokmål). {v} and {fv} interpolate live values. */
  correct: string;
  incorrect: string;
  neutral: string;
  /** Stable id for progress events. */
  quizId: string;
}

/** The one shape the AI produces. `params` is validated per template. */
export interface WidgetSpec {
  /** Template id from the catalogue (see spec/templates/). */
  template: string;
  /** Widget title (bokmål) — used for page titles / captions. */
  title?: string;
  /** Template-specific parameters. */
  params: Record<string, unknown>;
  /** Optional guided-quiz wrapper (supported templates document it). */
  quiz?: QuizWrapper;
}

/* ------------------------------------------------------- param validation */

export type ParamType =
  | { kind: "expr"; vars: 1 | 2 }
  | { kind: "number"; min?: number; max?: number }
  | { kind: "boolean" }
  | { kind: "string"; oneOf?: string[] }
  | { kind: "range"; }               // [min, max] pair
  | { kind: "numbers" }              // number[]
  | { kind: "matrix2" };             // [[a,b],[c,d]]

export interface ParamDef {
  type: ParamType;
  required?: boolean;
  default?: unknown;
  /** One-line doc shown to the authoring AI. */
  doc: string;
}

export interface TemplateDef {
  id: string;
  /** One-line description (shown to the authoring AI for template choice). */
  description: string;
  /** Norwegian curriculum anchors, e.g. ["1T", "R1"]. */
  curriculum: string[];
  params: Record<string, ParamDef>;
  /** Whether spec.quiz is supported, and what the live value v means. */
  quizValue?: string;
  /** A worked example spec (also the gallery demo). */
  example: WidgetSpec;
  /** Render validated params (+ optional quiz) to JSX. */
  render: (params: Record<string, unknown>, quiz?: QuizWrapper) => React.ReactNode;
}
