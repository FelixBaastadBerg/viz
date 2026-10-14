import { useRef, type ReactElement, type ReactNode } from "react";
import { Mafs, Coordinates, Text as MafsText, usePaneContext, useTransformContext, vec } from "mafs";
import { useElementSize } from "../hooks";
import { useKtTheme } from "../theme/ThemeProvider";

export interface KPlotProps {
  /** Math-space view box, e.g. {x: [-6, 6], y: [-4, 4]}. */
  viewBox: { x: [number, number]; y: [number, number] };
  /** Fixed pixel height; when omitted the plot fills its parent. */
  height?: number;
  pan?: boolean;
  zoom?: boolean;
  /** Show the coordinate grid + axes (default true). */
  axes?: boolean;
  /** Grid subdivisions (default off — the grid is furniture, not content). */
  subdivisions?: boolean;
  /** Axis line/label spacing (default 1) — raise on tall/wide ranges so the
      labels never crowd (W6). */
  xTick?: number;
  yTick?: number;
  /** "equal" preserves a 1:1 unit aspect (circles stay round). */
  aspect?: "auto" | "equal";
  /** Axis end labels, e.g. {x: "Re", y: "Im"} for the complex plane. */
  axisLabels?: { x?: string; y?: string };
  children?: ReactNode;
}

/**
 * The 2D stage: Mafs view + token-themed Cartesian coordinates. All colour
 * comes from the --kt-* vars the ThemeProvider sets (mapped to Mafs' own
 * custom properties in kviz.css). Origin labels are hidden (3b1b convention).
 */
export function KPlot({
  viewBox,
  height,
  pan = false,
  zoom = false,
  axes = true,
  subdivisions = false,
  xTick = 1,
  yTick = 1,
  aspect = "auto",
  axisLabels,
  children,
}: KPlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const theme = useKtTheme();
  const ruler = theme.structure.axisStyle === "ruler";
  return (
    <div ref={ref} className="kviz-stage" data-kt-theme={theme.name} data-kt-axis={ruler ? "ruler" : undefined}>
      <Mafs
        viewBox={viewBox}
        preserveAspectRatio={aspect === "equal" ? "contain" : false}
        pan={pan}
        zoom={zoom}
        height={height ?? size.height}
      >
        {axes && (
          <Coordinates.Cartesian
            subdivisions={subdivisions ? 4 : false}
            xAxis={{ lines: xTick, labels: (n) => (n === 0 ? "" : String(n)) }}
            yAxis={{ lines: yTick, labels: (n) => (n === 0 ? "" : String(n)) }}
          />
        )}
        {axes && ruler && <RulerTicks xTick={xTick} yTick={yTick} />}
        {children}
        {axisLabels?.x && (
          <MafsText x={viewBox.x[1]} y={0} attach="nw" size={15} color="var(--kt-text-muted)">
            {axisLabels.x}
          </MafsText>
        )}
        {axisLabels?.y && (
          <MafsText x={0} y={viewBox.y[1]} attach="se" size={15} color="var(--kt-text-muted)">
            {axisLabels.y}
          </MafsText>
        )}
      </Mafs>
    </div>
  );
}

/** Ruler ticks on the axes (V54: the set square as a visual language): whole units long, halves
    medium, quarters short — the finer levels only where they have room. Drawn in pixel space. */
function RulerTicks({ xTick, yTick }: { xTick: number; yTick: number }) {
  const theme = useKtTheme();
  const { xPaneRange, yPaneRange } = usePaneContext();
  const ctx = useTransformContext();
  const M = vec.matrixMult(ctx.viewTransform, ctx.userTransform);
  const [ox, oy] = vec.transform([0, 0], M);
  const pxX = vec.transform([1, 0], M)[0] - ox;
  const pxY = oy - vec.transform([0, 1], M)[1];
  const lines: ReactElement[] = [];
  const axis = (tick: number, px: number, range: [number, number], horiz: boolean) => {
    const per = tick * Math.abs(px);
    const step = per >= 72 ? tick / 4 : per >= 36 ? tick / 2 : tick;
    const [a, b] = range;
    for (let k = Math.ceil(a / step); k <= Math.floor(b / step); k++) {
      const v = k * step;
      if (Math.abs(v) < 1e-9) continue;
      const r = v / tick;
      const len = Math.abs(r - Math.round(r)) < 1e-9 ? 8 : Math.abs(2 * r - Math.round(2 * r)) < 1e-9 ? 5 : 3;
      const key = (horiz ? "x" : "y") + k;
      if (horiz) {
        const x = ox + v * px;
        lines.push(<line key={key} x1={x} y1={oy} x2={x} y2={oy + len} />);
      } else {
        const y = oy - v * px;
        lines.push(<line key={key} x1={ox - len} y1={y} x2={ox} y2={y} />);
      }
    }
  };
  axis(xTick, pxX, xPaneRange as [number, number], true);
  axis(yTick, pxY, yPaneRange as [number, number], false);
  return (
    <g style={{ stroke: theme.structure.axis, pointerEvents: "none" }} strokeWidth={1.25} strokeLinecap="round">
      {lines}
    </g>
  );
}
