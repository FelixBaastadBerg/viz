import type { ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useKtTheme } from "../theme/ThemeProvider";
import type { KtTheme } from "../theme/types";
import { createContext, useContext } from "react";

/** r3f children can't read React context across the renderer boundary by
 * default helpers we own — re-provide the theme inside the Canvas. */
const Scene3DThemeContext = createContext<KtTheme | null>(null);
export function useScene3DTheme(): KtTheme {
  const t = useContext(Scene3DThemeContext);
  if (!t) throw new Error("K3D components must be inside <KScene3D>");
  return t;
}

export type CameraPreset = "iso" | "front" | "top";
const CAMERAS: Record<CameraPreset, { position: [number, number, number]; fov: number }> = {
  iso: { position: [7.6, -9.2, 7.4], fov: 38 },
  front: { position: [0, -12.5, 2.5], fov: 38 },
  top: { position: [0, -0.01, 14], fov: 38 },
};

export interface KScene3DProps {
  camera?: CameraPreset;
  /** Orbit target (default slightly above origin). */
  target?: [number, number, number];
  orbit?: boolean;
  /** Floor grid extent in units (0 disables). */
  floorGrid?: number;
  children: ReactNode;
}

/**
 * The 3D stage. Lessons already paid for, baked in: `flat` tone mapping (keep
 * token hexes honest), local clipping enabled (draw-in sweeps), z-up camera,
 * theme clear colour, token light rig.
 */
export function KScene3D({
  camera = "iso",
  target = [0, 0, 1.3],
  orbit = true,
  floorGrid = 0,
  children,
}: KScene3DProps) {
  const theme = useKtTheme();
  const cam = CAMERAS[camera];
  const s = theme.scene3d;
  return (
    <div className="kviz-stage kviz-stage--3d">
      <Canvas
        flat
        dpr={[1, 2]}
        camera={{ position: cam.position, up: [0, 0, 1], fov: cam.fov }}
        onCreated={({ gl }) => {
          gl.localClippingEnabled = true;
          /* Transparent clear: the stage div's background (--kt-bg, host-
           * overridable via --kt-stage-canvas) shows through the canvas. */
          gl.setClearColor(0x000000, 0);
        }}
      >
        <Scene3DThemeContext.Provider value={theme}>
          <ambientLight intensity={s.ambient} />
          <directionalLight position={[5, -7, 9]} intensity={s.key} />
          <directionalLight position={[-6, 5, 3]} intensity={s.fill} />
          {floorGrid > 0 && (
            <gridHelper
              args={[2 * floorGrid, 2 * floorGrid, theme.structure.grid, theme.structure.grid]}
              rotation={[Math.PI / 2, 0, 0]}
              position={[0, 0, -0.01]}
            />
          )}
          {children}
          {orbit && (
            <OrbitControls
              target={target}
              minDistance={4}
              maxDistance={26}
              enableDamping
              dampingFactor={0.08}
            />
          )}
        </Scene3DThemeContext.Provider>
      </Canvas>
    </div>
  );
}
