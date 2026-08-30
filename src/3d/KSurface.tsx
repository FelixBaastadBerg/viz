import { useMemo } from "react";
import * as THREE from "three";
import { useScene3DTheme } from "./KScene3D";
import type { KtRole } from "../theme/types";

export interface KSurfaceProps {
  f: (x: number, y: number) => number;
  /** Domain half-width: x, y ∈ [−domain, domain]. */
  domain?: number;
  role?: KtRole;
  segments?: number;
  /** 0→1 draw-in sweep across x (drive with useIntro); 1 = fully drawn. */
  draw?: number;
  /** Iso-parameter coordinate curves (Manim look — never triangle wireframe). */
  coordCurves?: boolean;
}

function useSurfaceGeometry(
  f: (x: number, y: number) => number,
  domain: number,
  segments: number
) {
  return useMemo(() => {
    const g = new THREE.PlaneGeometry(2 * domain, 2 * domain, segments, segments);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) pos.setZ(i, f(pos.getX(i), pos.getY(i)));
    g.computeVertexNormals();
    return g;
  }, [f, domain, segments]);
}

function useCoordinateCurves(
  f: (x: number, y: number) => number,
  domain: number,
  lines = 24,
  samples = 72
) {
  return useMemo(() => {
    const verts: number[] = [];
    const push = (x0: number, y0: number, x1: number, y1: number) =>
      verts.push(x0, y0, f(x0, y0) + 0.006, x1, y1, f(x1, y1) + 0.006);
    for (let l = 0; l <= lines; l++) {
      const c = -domain + (2 * domain * l) / lines;
      for (let s = 0; s < samples; s++) {
        const t0 = -domain + (2 * domain * s) / samples;
        const t1 = -domain + (2 * domain * (s + 1)) / samples;
        push(c, t0, c, t1);
        push(t0, c, t1, c);
      }
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
    return g;
  }, [f, domain, lines, samples]);
}

/**
 * A z = f(x, y) surface in the token look: role colour, theme-tuned
 * translucency, stage-coloured iso-parameter curves so curvature reads.
 */
export function KSurface({
  f,
  domain = 3.4,
  role = "object",
  segments = 96,
  draw = 1,
  coordCurves = true,
}: KSurfaceProps) {
  const theme = useScene3DTheme();
  const s = theme.scene3d;
  const color = theme.accents[role].stroke;
  const solid = useSurfaceGeometry(f, domain, segments);
  const curves = useCoordinateCurves(f, domain);
  const clip = useMemo(
    () => [new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0)],
    []
  );
  clip[0].constant = -domain - 0.2 + draw * (2 * domain + 0.6);
  const active = draw < 1;
  return (
    <group>
      <mesh geometry={solid}>
        <meshStandardMaterial
          color={color}
          roughness={s.surfaceRoughness}
          metalness={0}
          emissive={color}
          emissiveIntensity={s.emissive}
          side={THREE.DoubleSide}
          transparent
          opacity={s.surfaceOpacity}
          clippingPlanes={active ? clip : undefined}
        />
      </mesh>
      {coordCurves && (
        <lineSegments geometry={curves}>
          <lineBasicMaterial
            color={theme.stage.canvas}
            transparent
            opacity={s.coordCurveOpacity}
            clippingPlanes={active ? clip : undefined}
          />
        </lineSegments>
      )}
    </group>
  );
}
