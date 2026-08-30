/** Template: solid of revolution (x-axis) in 3D — the play-with-it companion
 * to the disc-method video: n cylinder discs (orange) approximate the exact
 * solid (soft blue target, same language as riemann-sum's showTarget), and
 * V_n crawls toward V = π∫f² as n grows.
 *
 * W-rules: intro with KaTeX above (W1); values in a quiet line under the
 * canvas — a per-widget call (W5): a 3D surface offers no stable in-figure
 * anchor, so the verdilinje layout is the right fallback here.
 */
import { useMemo, useState } from "react";
import * as THREE from "three";
import { KScene3D } from "../../3d/KScene3D";
import { KAxes3D } from "../../3d/KAxes3D";
import { KFormula, KMixed } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";
import { fmt, simpson } from "../../math";

type P = Record<string, unknown>;

function SolidOfRevolution({ f, a, b, color, opacity }: {
  f: (x: number) => number; a: number; b: number; color: string; opacity: number;
}) {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 72; i++) {
      const x = a + ((b - a) * i) / 72;
      pts.push(new THREE.Vector2(Math.max(f(x), 1e-3), x));
    }
    return new THREE.LatheGeometry(pts, 56);
  }, [f, a, b]);
  return (
    <mesh geometry={geo} rotation={[0, 0, -Math.PI / 2]}>
      <meshStandardMaterial color={color} transparent opacity={opacity}
        side={THREE.DoubleSide} depthWrite={false} />
    </mesh>
  );
}

function Discs({ f, a, b, n, color }: {
  f: (x: number) => number; a: number; b: number; n: number; color: string;
}) {
  const dx = (b - a) / n;
  return (
    <>
      {Array.from({ length: n }, (_, i) => {
        const x0 = a + i * dx;
        const r = f(x0 + dx); // right endpoint, as in the video
        return (
          <mesh key={i} position={[x0 + dx / 2, 0, 0]}
            rotation={[0, 0, -Math.PI / 2]}>
            <cylinderGeometry args={[r, r, dx * 0.96, 40]} />
            <meshStandardMaterial color={color} transparent opacity={0.34}
              depthWrite={false} />
          </mesh>
        );
      })}
    </>
  );
}

function Omdreining3D({ params }: { params: P }) {
  const t = useKtTheme();
  const f = fn1(params.f as string);
  const [a, b] = params.range as [number, number];
  const showTarget = params.showTarget as boolean;
  const [n, setN] = useState(params.n0 as number);

  const dx = (b - a) / n;
  const vn = useMemo(() => {
    let s = 0;
    for (let i = 0; i < n; i++) s += Math.PI * f(a + (i + 1) * dx) ** 2 * dx;
    return s;
  }, [f, a, b, n, dx]);
  const exact = useMemo(() => Math.PI * simpson((x) => f(x) ** 2, a, b, 256), [f, a, b]);

  return (
    <div className="kviz-widget">
      {params.intro ? (
        <p className="kviz-intro"><KMixed text={params.intro as string} /></p>
      ) : null}

      <KScene3D camera="iso" target={[(a + b) / 2, 0, 0]} floorGrid={0}>
        <KAxes3D xy={b + 1} z={3} />
        {showTarget && (
          <SolidOfRevolution f={f} a={a} b={b}
            color={t.accents.object.stroke} opacity={0.16} />
        )}
        <Discs f={f} a={a} b={b} n={n} color={t.accents.touch.stroke} />
      </KScene3D>

      <div className="kviz-widget-controls">
        <KFormula tex="n" />
        <input type="range" className="kviz-slider kviz-slider--lead"
          min={1} max={params.nMax as number} step={1} value={n}
          aria-label="antall skiver"
          onChange={(e) => setN(Math.round(+e.target.value))} />
        <span className="kviz-widget-values">
          <span style={{ color: t.accents.touch.ink }}>
            <KFormula tex={`V_n = ${fmt(vn, 2)}`} />
          </span>
          <span style={{ color: t.accents.object.ink }}>
            <KFormula tex={`\\pi\\int_a^b f(x)^2 dx = ${fmt(exact, 2)}`} />
          </span>
        </span>
      </div>
    </div>
  );
}

registerTemplate({
  id: "omdreining-3d",
  description:
    "Omdreiningslegeme rundt x-aksen i 3D: n sylinderskiver (oransje) mot det eksakte legemet (svak blå), V_n → π∫f² med n-glider. For skivemetoden (R2/Kalkulus 1).",
  curriculum: ["R2", "universitet"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "radiusfunksjonen, > 0 på intervallet" },
    intro: { type: { kind: "string" }, default: "", doc: "introtekst over figuren; $...$ blir KaTeX" },
    range: { type: { kind: "range" }, default: [0.5, 5], doc: "intervallet [a, b] langs x-aksen" },
    showTarget: { type: { kind: "boolean" }, default: true, doc: "vis det eksakte legemet som svak blå flate" },
    n0: { type: { kind: "number", min: 1, max: 120 }, default: 6, doc: "start-antall skiver" },
    nMax: { type: { kind: "number", min: 4, max: 120 }, default: 80, doc: "maks n på glideren" },
  },
  example: {
    template: "omdreining-3d",
    title: "Skivemetoden i 3D",
    params: {
      f: "1.8 + 0.6*sin(1.2x - 0.5)",
      intro:
        "Dette er «vasen» fra videoen: $f(x) = 1.8 + 0.6\\sin(1.2x - 0.5)$ rotert rundt $x$-aksen. Hver skive er en sylinder med radius $f(x_i)$ og volum $\\pi f(x_i)^2 \\Delta x$. Dra i $n$ og se at $V_n \\to \\pi\\int_a^b f(x)^2\\,dx$. Dra i figuren for å rotere den.",
      range: [0.9, 5.3],
      n0: 6,
      nMax: 80,
    },
  },
  render: (params) => <Omdreining3D params={params} />,
});
