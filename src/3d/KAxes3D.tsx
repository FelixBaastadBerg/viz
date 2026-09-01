import { Suspense } from "react";
import { Line, Text, Billboard } from "@react-three/drei";
import { useScene3DTheme } from "./KScene3D";

/** Locally-served Computer Modern for in-canvas (troika) text. */
export const CM_MAIN = "/fonts-ttf/KaTeX_Main-Regular.ttf";
export const CM_MATH_IT = "/fonts-ttf/KaTeX_Math-Italic.ttf";

export interface KAxes3DProps {
  /** Axis extents: x,y in ±xy, z in [0, z]. */
  xy?: number;
  z?: number;
  tickStep?: number;
}

/** Token-styled x/y/z axes with CM tick numbers and italic axis letters. */
export function KAxes3D({ xy = 3.4, z = 3.9, tickStep = 1 }: KAxes3DProps) {
  const theme = useScene3DTheme();
  const axisColor = theme.structure.axis;
  const muted = theme.text.muted;

  const ticks: [number, number, number][][] = [];
  const tickLabels: { p: [number, number, number]; t: string }[] = [];
  for (let i = tickStep; i <= Math.floor(xy - 0.4); i += tickStep) {
    for (const s of [i, -i]) {
      ticks.push([[s, -0.09, 0], [s, 0.09, 0]]);
      ticks.push([[-0.09, s, 0], [0.09, s, 0]]);
      tickLabels.push({ p: [s, -0.42, 0.02], t: String(s) });
      tickLabels.push({ p: [-0.45, s, 0.02], t: String(s) });
    }
  }
  for (let k = tickStep; k <= Math.floor(z - 0.5); k += tickStep) {
    ticks.push([[-0.09, 0, k], [0.09, 0, k]]);
    tickLabels.push({ p: [-0.42, 0.02, k + 0.06], t: String(k) });
  }

  const axis = (from: [number, number, number], to: [number, number, number]) => (
    <Line points={[from, to]} color={axisColor} lineWidth={theme.stroke.axis} />
  );

  return (
    <group>
      {axis([-xy - 0.5, 0, 0], [xy + 0.9, 0, 0])}
      {axis([0, -xy - 0.5, 0], [0, xy + 0.9, 0])}
      {axis([0, 0, 0], [0, 0, z])}
      {ticks.map((seg, i) => (
        <Line key={i} points={seg} color={axisColor} lineWidth={1.5} />
      ))}
      {/* troika <Text> suspends while its font loads; keep that suspension
          INSIDE this boundary so a missing/slow /fonts-ttf/*.ttf in a host
          app degrades to "axes without labels" instead of unmounting the
          whole Canvas subtree (blank scene — bitten in kateter-web, where
          the r3f tree has no other Suspense boundary above this). */}
      <Suspense fallback={null}>
        {tickLabels.map(({ p, t }, i) => (
          <Billboard key={i} position={p}>
            <Text font={CM_MAIN} fontSize={0.24} color={muted} anchorX="center" anchorY="middle">
              {t}
            </Text>
          </Billboard>
        ))}
        {(
          [
            { p: [xy + 1.25, 0, 0] as [number, number, number], t: "x" },
            { p: [0, xy + 1.25, 0] as [number, number, number], t: "y" },
            { p: [0, 0, z + 0.3] as [number, number, number], t: "z" },
          ]
        ).map(({ p, t }) => (
          <Billboard key={t} position={p}>
            <Text font={CM_MATH_IT} fontSize={0.38} color={axisColor} anchorX="center" anchorY="middle">
              {t}
            </Text>
          </Billboard>
        ))}
      </Suspense>
    </group>
  );
}
