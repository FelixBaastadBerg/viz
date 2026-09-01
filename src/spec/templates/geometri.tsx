/** Templates: unit circle, vectors, linear transformations. */
import { useMemo, useState } from "react";
import { Polygon, Line as MafsLine, Circle } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint, KVector, KLabel, useRoleColor } from "../../2d/primitives";
import { KPanel, KReadout, KSlider } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import type { QuizWrapper } from "../types";
import { SpecQuiz } from "../SpecQuiz";
import { fmt } from "../../math";

type P = Record<string, unknown>;

/* ---------------------------------------------------------- enhetssirkel */
function Enhetssirkel({ params, quiz }: { params: P; quiz?: QuizWrapper }) {
  const t = useKtTheme();
  const [angle, setAngle] = useState(((params.angle0 as number) * Math.PI) / 180);
  const [touched, setTouched] = useState(false);
  const cx = Math.cos(angle);
  const sy = Math.sin(angle);
  const deg = ((angle * 180) / Math.PI + 360) % 360;
  const objectColor = useRoleColor("object");
  const altColor = useRoleColor("alt");
  const alt2Color = useRoleColor("alt2");
  return (
    <>
      <KPlot
        viewBox={{ x: [-1.6, 1.6], y: [-1.6, 1.6] }}
        aspect="equal"
        height={(params.height as number) ?? 300}
      >
        <Circle center={[0, 0]} radius={1} color={objectColor} fillOpacity={0} weight={t.stroke.curveSecondary} />
        {/* radius + angle arm */}
        <MafsLine.Segment point1={[0, 0]} point2={[cx, sy]} color={objectColor} weight={t.stroke.tangent} />
        {/* cos (x-axis) and sin (vertical) as coloured segments */}
        <MafsLine.Segment point1={[0, 0]} point2={[cx, 0]} color={altColor} weight={t.stroke.tangent} />
        <MafsLine.Segment point1={[cx, 0]} point2={[cx, sy]} color={alt2Color} weight={t.stroke.tangent} />
        <KPoint
          point={[cx, sy]}
          constrain={(x, y) => {
            const r = Math.hypot(x, y) || 1;
            return [x / r, y / r];
          }}
          onMove={([x, y]) => {
            setAngle(Math.atan2(y, x));
            setTouched(true);
          }}
        />
        <KLabel tex="\cos v" at={[cx / 2, -0.22]} role="alt" />
        <KLabel tex="\sin v" at={[cx + (cx >= 0 ? 0.34 : -0.34), sy / 2]} role="alt2" />
      </KPlot>
      {quiz ? (
        <SpecQuiz quiz={quiz} value={deg} touched={touched} />
      ) : (
        <KPanel position="readout">
          <KReadout
            items={[
              { label: "v", value: `${fmt(deg, 0)}°`, role: "touch" },
              { label: "\\cos v", value: cx, role: "alt" },
              { label: "\\sin v", value: sy, role: "alt2" },
            ]}
          />
        </KPanel>
      )}
    </>
  );
}

registerTemplate({
  id: "enhetssirkel",
  description:
    "Enhetssirkelen med dragbart punkt; viser vinkelen, cos og sin som segmenter og verdier. For trigonometri-introduksjon.",
  curriculum: ["1T", "R1"],
  params: {
    angle0: { type: { kind: "number" }, default: 40, doc: "startvinkel i grader" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 300, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  quizValue: "vinkelen i grader (0–360)",
  example: {
    template: "enhetssirkel",
    title: "Enhetssirkelen",
    params: { angle0: 40 },
  },
  render: (params, quiz) => <Enhetssirkel params={params} quiz={quiz} />,
});

/* -------------------------------------------------------------- vektorer */
/** Format [re, im] as a tidy complex number: «3 + i», «−1 + 2i», «2 − 3i».
    Coefficient 1 is dropped, pure real/imaginary numbers are simplified. */
function fmtComplex([re, im]: [number, number], digits = 1): string {
  const pow = 10 ** digits;
  const r = Math.round(re * pow) / pow;
  const m = Math.round(im * pow) / pow;
  // trim trailing ".0" so integers read clean («3», not «3.0»)
  const num = (v: number) => fmt(v, digits).replace(/\.0+$/, "");
  const imPart = (v: number) => (Math.abs(v) === 1 ? "i" : `${num(Math.abs(v))}i`);
  if (m === 0) return num(r);
  if (r === 0) return (m < 0 ? "−" : "") + imPart(m);
  return `${num(r)} ${m < 0 ? "−" : "+"} ${imPart(m)}`;
}

function Vektorer({ params }: { params: P }) {
  const [u, setU] = useState(params.u as [number, number]);
  const [v, setV] = useState(params.v as [number, number]);
  const op = params.op as string;
  const kompleks = params.kompleks === true;
  const sum: [number, number] = op === "diff" ? [u[0] - v[0], u[1] - v[1]] : [u[0] + v[0], u[1] + v[1]];
  // vector names: u/v in the plane, z/w in the complex plane
  const [uTex, vTex] = kompleks ? ["z", "w"] : ["\\vec{u}", "\\vec{v}"];
  const sumTex = `${uTex}${op === "diff" ? "-" : "+"}${vTex}`;
  const show = (p: [number, number]) =>
    kompleks ? fmtComplex(p) : `(${fmt(p[0], 1)}, ${fmt(p[1], 1)})`;
  return (
    <>
      <KPlot
        viewBox={{ x: [-4.5, 4.5], y: [-4, 4] }}
        aspect="equal"
        height={(params.height as number) ?? 340}
        axisLabels={kompleks ? { x: "Re", y: "Im" } : undefined}
      >
        <KVector tip={u} role="object" />
        <KVector tip={v} role="alt" />
        <KVector tip={sum} role="touch" />
        {/* parallelogram guides */}
        <g style={{ opacity: 0.5 }}>
          <KVector tail={u} tip={sum} role="alt" />
          <KVector tail={op === "diff" ? [-v[0], -v[1]] : v} tip={sum} role="object" />
        </g>
        <KPoint point={u} constrain="unrestricted" onMove={(p) => setU(p)} role="object" />
        <KPoint point={v} constrain="unrestricted" onMove={(p) => setV(p)} role="alt" />
        <KLabel tex={uTex} at={[u[0] + 0.3, u[1] + 0.3]} role="object" />
        <KLabel tex={vTex} at={[v[0] + 0.3, v[1] + 0.3]} role="alt" />
        <KLabel tex={sumTex} at={[sum[0] + 0.45, sum[1] + 0.35]} role="touch" />
      </KPlot>
      <KPanel position="readout">
        <KReadout
          items={[
            { label: uTex, value: show(u), role: "object" },
            { label: vTex, value: show(v), role: "alt" },
            { label: sumTex, value: show(sum), role: "touch" },
          ]}
        />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "vektorer",
  description:
    "Vektorsum eller -differanse med dragbare vektorspisser og parallellogram. For vektorregning i planet.",
  curriculum: ["R1"],
  params: {
    u: { type: { kind: "numbers" }, default: [2, 1], doc: "vektor u som [x, y]" },
    v: { type: { kind: "numbers" }, default: [1, 2], doc: "vektor v som [x, y]" },
    op: { type: { kind: "string", oneOf: ["sum", "diff"] }, default: "sum", doc: "operasjon" },
    kompleks: { type: { kind: "boolean" }, default: false, doc: "kompleks modus: Re/Im-akser og vektorene som komplekse tall z, w («3 + i»)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "vektorer",
    title: "Vektorsum",
    params: { u: [2, 1], v: [1, 2], op: "sum" },
  },
  render: (params) => <Vektorer params={params} />,
});

/* -------------------------------------------------- lineaer-transformasjon */
type Mat2 = [[number, number], [number, number]];

const matMul = (A: Mat2, B: Mat2): Mat2 => [
  [A[0][0] * B[0][0] + A[0][1] * B[1][0], A[0][0] * B[0][1] + A[0][1] * B[1][1]],
  [A[1][0] * B[0][0] + A[1][1] * B[1][0], A[1][0] * B[0][1] + A[1][1] * B[1][1]],
];
const matApply = (A: Mat2, [x, y]: [number, number]): [number, number] => [
  A[0][0] * x + A[0][1] * y,
  A[1][0] * x + A[1][1] * y,
];
const det2 = (A: Mat2): number => A[0][0] * A[1][1] - A[0][1] * A[1][0];

/**
 * 2×2 polar decomposition A = R·S: R = A·(AᵀA)^(−1/2) is a rotation, S is
 * symmetric positive definite. Closed form: with M = AᵀA,
 * √M = (M + √(det M)·I) / √(tr M + 2·√(det M)), then R = A·(√M)⁻¹.
 * Returns the rotation angle θ of R plus S. Valid for det A > 0 — for
 * reflections/singular A we return null and the caller falls back to
 * straight-line interpolation.
 */
export function polar2(A: Mat2): { theta: number; S: Mat2 } | null {
  if (!(det2(A) > 1e-9)) return null;
  const [[a, b], [c, d]] = A;
  const m00 = a * a + c * c;
  const m01 = a * b + c * d;
  const m11 = b * b + d * d;
  const sDet = Math.sqrt(Math.max(m00 * m11 - m01 * m01, 0)); // = |det A|
  const denom = Math.sqrt(m00 + m11 + 2 * sDet);
  if (!(denom > 1e-9)) return null;
  const S: Mat2 = [
    [(m00 + sDet) / denom, m01 / denom],
    [m01 / denom, (m11 + sDet) / denom],
  ];
  const dS = det2(S);
  const Sinv: Mat2 = [
    [S[1][1] / dS, -S[0][1] / dS],
    [-S[1][0] / dS, S[0][0] / dS],
  ];
  const R = matMul(A, Sinv);
  return { theta: Math.atan2(R[1][0], R[0][0]), S };
}

/** A(t) = R(t·θ)·((1−t)·I + t·S) — rotates naturally instead of shearing
    straight from I to A. Falls back to linear interpolation when A has no
    rotation-form polar decomposition (det ≤ 0). */
export function interpolateMat(M: Mat2, polar: { theta: number; S: Mat2 } | null, t: number): Mat2 {
  if (!polar) {
    return [
      [1 + (M[0][0] - 1) * t, M[0][1] * t],
      [M[1][0] * t, 1 + (M[1][1] - 1) * t],
    ];
  }
  const { theta, S } = polar;
  const c = Math.cos(t * theta);
  const sn = Math.sin(t * theta);
  const Rt: Mat2 = [[c, -sn], [sn, c]];
  const St: Mat2 = [
    [1 + (S[0][0] - 1) * t, S[0][1] * t],
    [S[1][0] * t, 1 + (S[1][1] - 1) * t],
  ];
  return matMul(Rt, St);
}

const UNIT_SQUARE: [number, number][] = [[0, 0], [1, 0], [1, 1], [0, 1]];

function LinTrans({ params }: { params: P }) {
  const M = params.matrix as Mat2;
  const [s, setS] = useState(0);
  const objectColor = useRoleColor("object");
  const t = useKtTheme();
  const polar = useMemo(() => polar2(M), [M]);
  const At = useMemo(() => interpolateMat(M, polar, s), [M, polar, s]);
  // image of the unit square = parallelogram spanned by the columns of A(t)
  const e1 = matApply(At, [1, 0]);
  const e2 = matApply(At, [0, 1]);
  const image: [number, number][] = [[0, 0], e1, [e1[0] + e2[0], e1[1] + e2[1]], e2];
  return (
    <>
      <KPlot
        viewBox={{ x: [-4, 4], y: [-3, 3] }}
        subdivisions
        aspect="equal"
        height={(params.height as number) ?? 340}
      >
        {/* faint reference copy of the untransformed unit square */}
        <g style={{ opacity: 0.45 }}>
          <Polygon points={UNIT_SQUARE} color={objectColor} fillOpacity={t.fill.areaOpacity / 3} weight={t.stroke.curveSecondary} />
        </g>
        {/* the image under A(t) */}
        <Polygon points={image} color={objectColor} fillOpacity={t.fill.areaOpacity} weight={t.stroke.curvePrimary} />
        {/* transformed basis vectors e1 og e2 */}
        <KVector tip={e1} role="touch" />
        <KVector tip={e2} role="alt" />
      </KPlot>
      <KPanel position="readout">
        <KReadout items={[{ label: "\\det", value: det2(At), digits: 2, role: "object" }]} />
      </KPanel>
      <KPanel position="controls">
        <KSlider label="t" min={0} max={1} step={0.01} value={s} onChange={setS} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "lineaer-transformasjon",
  description:
    "Enhetskvadratet og basisvektorene e1, e2 under en 2×2-matrise; glideren interpolerer fra identiteten via polar-dekomponering, så rotasjoner faktisk roterer. Skriv A og det A i brødteksten, ikke i widgeten. For lineære transformasjoner (S1/S2, universitetsforkurs).",
  curriculum: ["S2", "forkurs"],
  params: {
    matrix: { type: { kind: "matrix2" }, required: true, doc: "2×2-matrisen [[a,b],[c,d]]" },
    figure: { type: { kind: "string", oneOf: ["kvadrat", "trekant", "hus"] }, default: "kvadrat", doc: "utgått — enhetskvadratet vises alltid; beholdt for bakoverkompatibilitet" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "lineaer-transformasjon",
    title: "Rotasjon 90°",
    params: { matrix: [[0, -1], [1, 0]] },
  },
  render: (params) => <LinTrans params={params} />,
});
