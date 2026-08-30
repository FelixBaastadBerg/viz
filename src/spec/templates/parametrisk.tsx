/** Template: parametric curves in the plane (Matematikk 2, «Kurver i planet»).
 *
 * The play-with-the-lecture widget for the parametric-curve sections: the
 * student scrubs t, watches the point trace the curve, sees the velocity
 * (tangent) vector, and reads the arc length s(t) — the exam formula
 * s = ∫√(f'(t)² + g'(t)²) dt evaluated live.
 */
import { useMemo, useState } from "react";
import { Polyline, Vector } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KPoint, KLabel, useRoleColor } from "../../2d/primitives";
import { KPanel, KFormula, KCaption, KSlider } from "../../chrome";
import { useKtTheme, glowFilter } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";
import type { QuizWrapper } from "../types";
import { SpecQuiz } from "../SpecQuiz";
import { fmt, ddx, simpson, clamp } from "../../math";

type P = Record<string, unknown>;

function ParametriskKurve({ params, quiz }: { params: P; quiz?: QuizWrapper }) {
  const t = useKtTheme();
  const fx = fn1(params.x as string);
  const fy = fn1(params.y as string);
  const [ta, tb] = params.tRange as [number, number];
  const [t0, setT0] = useState(clamp(params.t0 as number, ta, tb));
  const [touched, setTouched] = useState(false);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const showVelocity = params.showVelocity as boolean;

  const objectColor = useRoleColor("object");
  const speed = (u: number) => Math.hypot(ddx(fx, u), ddx(fy, u));

  const curvePts = useMemo(() => {
    const pts: [number, number][] = [];
    for (let i = 0; i <= 240; i++) {
      const u = ta + ((tb - ta) * i) / 240;
      pts.push([fx(u), fy(u)]);
    }
    return pts;
  }, [fx, fy, ta, tb]);

  const px = fx(t0), py = fy(t0);
  const vx = ddx(fx, t0), vy = ddx(fy, t0);
  const arcLen = useMemo(() => simpson(speed, ta, t0, 96), [ta, t0, params.x, params.y]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <KPlot viewBox={view}>
        <g style={{ filter: glowFilter(t, objectColor) }}>
          <Polyline points={curvePts} color={objectColor} weight={t.stroke.curvePrimary} />
        </g>
        {showVelocity && (
          <KVelocity tail={[px, py]} v={[vx, vy]} />
        )}
        <KLabel tex={`t=${fmt(ta, 1)}`} at={[fx(ta) + 0.25, fy(ta) - 0.3]} />
        <KLabel tex={`t=${fmt(tb, 1)}`} at={[fx(tb) + 0.25, fy(tb) + 0.35]} />
        <KPoint
          point={[px, py]}
          constrain={(x, y) => {
            // project the pointer onto the curve by nearest sampled t
            let best = ta, bd = Infinity;
            for (let i = 0; i <= 240; i++) {
              const u = ta + ((tb - ta) * i) / 240;
              const d = (fx(u) - x) ** 2 + (fy(u) - y) ** 2;
              if (d < bd) { bd = d; best = u; }
            }
            setT0(best);
            setTouched(true);
            return [fx(best), fy(best)];
          }}
        />
      </KPlot>
      {quiz ? (
        <SpecQuiz quiz={quiz} value={t0} touched={touched} />
      ) : (
        <KPanel position="readout">
          <p className="kviz-formula">
            <KFormula tex={(params.tex as string) || "x = f(t),\\; y = g(t)"} />
          </p>
          <p className="kviz-readout">
            <span>t = <span className="kviz-value">{fmt(t0, 2)}</span></span>
            <span>(x, y) = (<span className="kviz-value">{fmt(px, 2)}</span>,{" "}
              <span className="kviz-value">{fmt(py, 2)}</span>)</span>
            <span>
              s = <span className="kviz-value">{fmt(arcLen, 3)}</span>
            </span>
          </p>
          <KCaption>
            Dra {t.touchNameNb} langs kurven eller bruk glideren. s er buelengden fra t = {fmt(ta, 1)}.
          </KCaption>
        </KPanel>
      )}
      <KPanel position="controls">
        <KSlider label="t" min={ta} max={tb} step={(tb - ta) / 200} value={t0}
          onChange={(v) => { setT0(v); setTouched(true); }} />
      </KPanel>
    </>
  );
}

/** Velocity vector, drawn one tier lighter in the alt role. */
function KVelocity({ tail, v }: { tail: [number, number]; v: [number, number] }) {
  const t = useKtTheme();
  const color = useRoleColor("alt");
  const norm = Math.hypot(v[0], v[1]) || 1;
  const scale = 1.2 / norm;
  return (
    <g style={{ filter: glowFilter(t, color), opacity: 0.9 }}>
      <Vector
        tail={tail}
        tip={[tail[0] + v[0] * scale, tail[1] + v[1] * scale]}
        color={color}
        weight={t.stroke.tangent}
      />
    </g>
  );
}

registerTemplate({
  id: "parametrisk-kurve",
  description:
    "Parametrisert kurve x=f(t), y=g(t) med t-glider, punkt som følger kurven, fartsvektor og live buelengde s(t). For kurver i planet (Matematikk 2 / R2).",
  curriculum: ["R2", "universitet"],
  params: {
    x: { type: { kind: "expr", vars: 1 }, required: true, doc: "x = f(t), uttrykk i x der x = t, f.eks. \"3x^2\"" },
    y: { type: { kind: "expr", vars: 1 }, required: true, doc: "y = g(t), uttrykk i x der x = t" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning, f.eks. \"x = 3t^2,\\\\; y = 2t^3\"" },
    tRange: { type: { kind: "range" }, default: [0, 1], doc: "t-intervallet [a, b]" },
    t0: { type: { kind: "number" }, default: 0.5, doc: "startverdi for t" },
    viewX: { type: { kind: "range" }, default: [-1, 4], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-1, 3], doc: "y-utsnitt" },
    showVelocity: { type: { kind: "boolean" }, default: true, doc: "vis fartsvektoren (f'(t), g'(t))" },
  },
  quizValue: "parameterverdien t til punktet",
  example: {
    template: "parametrisk-kurve",
    title: "Buelengde langs en parametrisert kurve",
    params: {
      x: "3x^2",
      y: "2x^3",
      tex: "x = 3t^2,\\quad y = 2t^3,\\quad s(t)=\\int_0^t \\sqrt{f'(u)^2+g'(u)^2}\\,du",
      tRange: [0, 1],
      t0: 0.6,
      viewX: [-0.6, 4],
      viewY: [-0.5, 2.6],
    },
  },
  render: (params, quiz) => <ParametriskKurve params={params} quiz={quiz} />,
});
