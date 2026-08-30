import { useMemo } from "react";
import * as THREE from "three";
import { Line } from "@react-three/drei";
import { useScene3DTheme } from "./KScene3D";
import type { KtRole } from "../theme/types";

export interface KRegionColumnProps {
  f: (x: number, y: number) => number;
  a: number;
  b: number;
  c: number;
  d: number;
  role?: KtRole;
  opacity?: number;
  resolution?: number;
}

function useColumnGeometry(
  f: (x: number, y: number) => number,
  a: number,
  b: number,
  c: number,
  d: number,
  n: number
) {
  return useMemo(() => {
    const verts: number[] = [];
    const quad = (p0: number[], p1: number[], p2: number[], p3: number[]) =>
      verts.push(...p0, ...p1, ...p2, ...p0, ...p2, ...p3);
    const X = (i: number) => a + ((b - a) * i) / n;
    const Y = (j: number) => c + ((d - c) * j) / n;
    for (let i = 0; i < n; i++)
      for (let j = 0; j < n; j++) {
        const x0 = X(i), x1 = X(i + 1), y0 = Y(j), y1 = Y(j + 1);
        quad(
          [x0, y0, f(x0, y0)], [x1, y0, f(x1, y0)],
          [x1, y1, f(x1, y1)], [x0, y1, f(x0, y1)]
        );
      }
    for (let i = 0; i < n; i++) {
      const x0 = X(i), x1 = X(i + 1), y0 = Y(i), y1 = Y(i + 1);
      quad([x0, c, 0], [x1, c, 0], [x1, c, f(x1, c)], [x0, c, f(x0, c)]);
      quad([x1, d, 0], [x0, d, 0], [x0, d, f(x0, d)], [x1, d, f(x1, d)]);
      quad([a, y1, 0], [a, y0, 0], [a, y0, f(a, y0)], [a, y1, f(a, y1)]);
      quad([b, y0, 0], [b, y1, 0], [b, y1, f(b, y1)], [b, y0, f(b, y0)]);
    }
    quad([a, d, 0], [b, d, 0], [b, c, 0], [a, c, 0]);
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [f, a, b, c, d, n]);
}

function capOutline(
  f: (x: number, y: number) => number,
  a: number, b: number, c: number, d: number, n = 24
) {
  const pts: [number, number, number][] = [];
  for (let i = 0; i <= n; i++) { const x = a + ((b - a) * i) / n; pts.push([x, c, f(x, c)]); }
  for (let j = 1; j <= n; j++) { const y = c + ((d - c) * j) / n; pts.push([b, y, f(b, y)]); }
  for (let i = n - 1; i >= 0; i--) { const x = a + ((b - a) * i) / n; pts.push([x, d, f(x, d)]); }
  for (let j = n - 1; j >= 0; j--) { const y = c + ((d - c) * j) / n; pts.push([a, y, f(a, y)]); }
  return pts;
}

/**
 * The volume between z = 0 and z = f over [a,b]×[c,d] — "the thing you
 * touch". Translucent-in-translucent policy baked in: explicit renderOrder,
 * depthWrite off (the three.js lesson already paid for).
 */
export function KRegionColumn({
  f, a, b, c, d,
  role = "touch",
  opacity = 1,
  resolution = 28,
}: KRegionColumnProps) {
  const theme = useScene3DTheme();
  const s = theme.scene3d;
  const color = theme.accents[role].stroke;
  const column = useColumnGeometry(f, a, b, c, d, resolution);
  const rim = useMemo(() => capOutline(f, a, b, c, d), [f, a, b, c, d]);
  const base: [number, number, number][] = [
    [a, c, 0.004], [b, c, 0.004], [b, d, 0.004], [a, d, 0.004], [a, c, 0.004],
  ];
  return (
    <group>
      <mesh geometry={column} renderOrder={2}>
        <meshBasicMaterial
          color={color}
          transparent
          opacity={s.columnOpacity * opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={base} color={color} lineWidth={theme.stroke.tangent} transparent opacity={opacity} />
      <mesh position={[(a + b) / 2, (c + d) / 2, 0.002]} renderOrder={1}>
        <planeGeometry args={[b - a, d - c]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={s.regionFillOpacity * opacity}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <Line points={rim} color={color} lineWidth={2.5} transparent opacity={0.85 * opacity} />
    </group>
  );
}
