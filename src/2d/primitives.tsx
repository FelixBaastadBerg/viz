import { useMemo, useState } from "react";
import { Plot, Line, Vector, Polygon, LaTeX, MovablePoint } from "mafs";
import type { KatexOptions } from "katex";
import { useKtTheme, glowFilter } from "../theme/ThemeProvider";
import type { KtRole } from "../theme/types";
import { useIntro } from "../hooks";
import { ddx, sample } from "../math";

/** Resolve a semantic role to its stroke colour in the active theme. */
export function useRoleColor(role: KtRole): string {
  return useKtTheme().accents[role].stroke;
}

/* ------------------------------------------------------------------ KCurve */
export interface KCurveProps {
  f: (x: number) => number;
  /** Semantic colour role (default: object — the thing being studied). */
  role?: KtRole;
  /** Line weight tier (default primary — the protagonist is heaviest). */
  weight?: "primary" | "secondary";
  /** Animate a left-to-right draw-in on mount (token durDraw + smooth). */
  drawIn?: boolean;
  /** Extra delay before the draw-in starts, ms. */
  delay?: number;
}

/** A plotted function — the standard "object of study". */
export function KCurve({
  f,
  role = "object",
  weight = "primary",
  drawIn = false,
  delay = 0,
}: KCurveProps) {
  const theme = useKtTheme();
  const color = theme.accents[role].stroke;
  const w =
    weight === "primary" ? theme.stroke.curvePrimary : theme.stroke.curveSecondary;
  const draw = useIntro(drawIn ? theme.motion.durDraw : 1, delay);
  const progress = drawIn ? draw : 1;
  return (
    <g
      style={{
        clipPath:
          progress < 1 ? `inset(0 ${(1 - progress) * 100}% 0 0)` : undefined,
        filter: glowFilter(theme, color),
      }}
    >
      <Plot.OfX y={f} color={color} weight={w} />
    </g>
  );
}

/* ---------------------------------------------------------------- KTangent */
export interface KTangentProps {
  f: (x: number) => number;
  x: number;
  /** Analytic derivative; numeric central difference when omitted. */
  df?: (x: number) => number;
  role?: KtRole;
  /** Fade in on mount. */
  fadeIn?: boolean;
  delay?: number;
}

/** The tangent to f at x — supporting cast, one tier lighter than the curve. */
export function KTangent({
  f,
  x,
  df,
  role = "touch",
  fadeIn = false,
  delay = 0,
}: KTangentProps) {
  const theme = useKtTheme();
  const color = theme.accents[role].stroke;
  const fade = useIntro(fadeIn ? theme.motion.durFade : 1, delay);
  return (
    <g style={{ opacity: fadeIn ? fade : 1, filter: glowFilter(theme, color) }}>
      <Line.PointSlope
        point={[x, f(x)]}
        slope={df ? df(x) : ddx(f, x)}
        color={color}
        weight={theme.stroke.tangent}
      />
    </g>
  );
}

/* ----------------------------------------------------------------- KVector */
export interface KVectorProps {
  tip: [number, number];
  tail?: [number, number];
  role?: KtRole;
}

export function KVector({ tip, tail = [0, 0], role = "alt" }: KVectorProps) {
  const theme = useKtTheme();
  const color = theme.accents[role].stroke;
  return (
    <g style={{ filter: glowFilter(theme, color) }}>
      <Vector tail={tail} tip={tip} color={color} weight={theme.stroke.curveSecondary} />
    </g>
  );
}

/* ------------------------------------------------------------------- KArea */
export interface KAreaProps {
  f: (x: number) => number;
  from: number;
  to: number;
  role?: KtRole;
  /** Sampling resolution of the region boundary. */
  samples?: number;
}

/** The filled region between f and the x-axis on [from, to]. */
export function KArea({ f, from, to, role = "object", samples = 96 }: KAreaProps) {
  const theme = useKtTheme();
  const color = theme.accents[role].stroke;
  const points = useMemo<[number, number][]>(
    () => [[from, 0], ...sample(f, from, to, samples), [to, 0]],
    [f, from, to, samples]
  );
  return (
    <Polygon
      points={points}
      color={color}
      fillOpacity={theme.fill.areaOpacity}
      strokeOpacity={0}
      weight={0.1}
    />
  );
}

/* ------------------------------------------------------------------ KLabel */
export interface KLabelProps {
  tex: string;
  at: [number, number];
  /** Text-grade colour: role ink, or theme text colour when omitted. */
  role?: KtRole;
  katexOptions?: KatexOptions;
}

/** A KaTeX (Computer Modern) label at math coordinates. */
export function KLabel({ tex, at, role, katexOptions }: KLabelProps) {
  const theme = useKtTheme();
  const color = role ? theme.accents[role].ink : theme.text.primary;
  return <LaTeX tex={tex} at={at} color={color} katexOptions={katexOptions} />;
}

export interface KMathLabelProps extends KLabelProps {
  /** Sit the label on a borderless stage-coloured plate so it never collides
   * with the graphics behind it (Felix, 2026-08-30). */
  plate?: boolean;
}

/**
 * In-figure readout: a math label anchored to the thing it describes.
 * With `plate`, it gets a quiet stage-coloured backing (no border) so it
 * stays legible over rectangles, curves and fills.
 */
export function KMathLabel({ tex, at, role, plate = true, katexOptions }: KMathLabelProps) {
  const theme = useKtTheme();
  const color = role ? theme.accents[role].ink : theme.text.primary;
  return (
    <g className={`kviz-mathlabel${plate ? " kviz-mathlabel--plate" : ""}`}>
      <LaTeX tex={tex} at={at} color={color} katexOptions={katexOptions} />
    </g>
  );
}

/* ------------------------------------------------------------------ KPoint */
/**
 * Graphica's constraint-drag API (its best idea), ported:
 * undefined = not draggable · "unrestricted" · "horizontal" · "vertical" ·
 * or a mapping (x, y) => [x', y'] from pointer position to snapped position.
 */
export type KDraggable =
  | undefined
  | "unrestricted"
  | "horizontal"
  | "vertical"
  | ((x: number, y: number) => [number, number]);

export interface KPointProps {
  /** Controlled position. Omit to let the point manage its own state. */
  point?: [number, number];
  defaultPoint?: [number, number];
  constrain?: KDraggable;
  onMove?: (point: [number, number]) => void;
  role?: KtRole;
  fadeIn?: boolean;
  delay?: number;
}

export function KPoint({
  point,
  defaultPoint = [0, 0],
  constrain,
  onMove,
  role = "touch",
  fadeIn = false,
  delay = 0,
}: KPointProps) {
  const theme = useKtTheme();
  const color = theme.accents[role].stroke;
  const [inner, setInner] = useState<[number, number]>(defaultPoint);
  const current = point ?? inner;
  const fade = useIntro(fadeIn ? theme.motion.durFade : 1, delay);

  const mafsConstrain = useMemo(() => {
    if (constrain === undefined) return () => current;
    if (constrain === "unrestricted") return undefined;
    if (constrain === "horizontal")
      return ([x]: [number, number]) => [x, current[1]] as [number, number];
    if (constrain === "vertical")
      return ([, y]: [number, number]) => [current[0], y] as [number, number];
    return ([x, y]: [number, number]) => constrain(x, y);
  }, [constrain, current]);

  return (
    <g style={{ opacity: fadeIn ? fade : 1, filter: glowFilter(theme, color) }}>
      <MovablePoint
        point={current}
        color={color}
        constrain={mafsConstrain as ((p: [number, number]) => [number, number]) | undefined}
        onMove={(p) => {
          const next = p as [number, number];
          if (point === undefined) setInner(next);
          onMove?.(next);
        }}
      />
    </g>
  );
}
