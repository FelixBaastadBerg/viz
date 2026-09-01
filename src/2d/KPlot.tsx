import { useRef, type ReactNode } from "react";
import { Mafs, Coordinates } from "mafs";
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
  children,
}: KPlotProps) {
  const ref = useRef<HTMLDivElement>(null);
  const size = useElementSize(ref);
  const theme = useKtTheme();
  return (
    <div ref={ref} className="kviz-stage" data-kt-theme={theme.name}>
      <Mafs
        viewBox={viewBox}
        preserveAspectRatio={false}
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
        {children}
      </Mafs>
    </div>
  );
}
