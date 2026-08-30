/** Templates: unit circle, vectors, linear transformations. */
import { useMemo, useState } from "react";
import { Polygon, Line as MafsLine, Circle } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint, KVector, KLabel, useRoleColor } from "../../2d/primitives";
import { KPanel, KFormula, KReadout, KCaption, KSlider } from "../../chrome";
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
      <KPlot viewBox={{ x: [-2.6, 2.6], y: [-1.7, 1.7] }}>
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
          <KCaption>Dra {t.touchNameNb} rundt sirkelen.</KCaption>
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
function Vektorer({ params }: { params: P }) {
  const t = useKtTheme();
  const [u, setU] = useState(params.u as [number, number]);
  const [v, setV] = useState(params.v as [number, number]);
  const op = params.op as string;
  const sum: [number, number] = op === "diff" ? [u[0] - v[0], u[1] - v[1]] : [u[0] + v[0], u[1] + v[1]];
  return (
    <>
      <KPlot viewBox={{ x: [-5, 5], y: [-4, 4] }}>
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
        <KLabel tex="\vec{u}" at={[u[0] + 0.3, u[1] + 0.3]} role="object" />
        <KLabel tex="\vec{v}" at={[v[0] + 0.3, v[1] + 0.3]} role="alt" />
        <KLabel tex={op === "diff" ? "\\vec{u}-\\vec{v}" : "\\vec{u}+\\vec{v}"} at={[sum[0] + 0.45, sum[1] + 0.35]} role="touch" />
      </KPlot>
      <KPanel position="readout">
        <KReadout
          items={[
            { label: "\\vec{u}", value: `(${fmt(u[0], 1)}, ${fmt(u[1], 1)})`, role: "object" },
            { label: "\\vec{v}", value: `(${fmt(v[0], 1)}, ${fmt(v[1], 1)})`, role: "alt" },
            {
              label: op === "diff" ? "\\vec{u}-\\vec{v}" : "\\vec{u}+\\vec{v}",
              value: `(${fmt(sum[0], 1)}, ${fmt(sum[1], 1)})`,
              role: "touch",
            },
          ]}
        />
        <KCaption>Dra vektorspissene. Parallellogrammet viser {op === "diff" ? "differansen" : "summen"}.</KCaption>
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
  },
  example: {
    template: "vektorer",
    title: "Vektorsum",
    params: { u: [2, 1], v: [1, 2], op: "sum" },
  },
  render: (params) => <Vektorer params={params} />,
});

/* -------------------------------------------------- lineaer-transformasjon */
const FIGURES: Record<string, [number, number][]> = {
  kvadrat: [[0, 0], [1, 0], [1, 1], [0, 1]],
  trekant: [[0, 0], [1.4, 0], [0.5, 1.2]],
  hus: [[0, 0], [1, 0], [1, 1], [0.5, 1.5], [0, 1]],
};

function LinTrans({ params }: { params: P }) {
  const M = params.matrix as [[number, number], [number, number]];
  const fig = FIGURES[(params.figure as string) ?? "hus"];
  const [s, setS] = useState(0);
  const objectColor = useRoleColor("object");
  const touchColor = useRoleColor("touch");
  const t = useKtTheme();
  const lerp = useMemo(() => {
    const apply = ([x, y]: [number, number]): [number, number] => [
      M[0][0] * x + M[0][1] * y,
      M[1][0] * x + M[1][1] * y,
    ];
    return fig.map((p) => {
      const q = apply(p);
      return (tt: number): [number, number] => [
        p[0] + (q[0] - p[0]) * tt,
        p[1] + (q[1] - p[1]) * tt,
      ];
    });
  }, [M, fig]);
  const shape = lerp.map((f) => f(s));
  return (
    <>
      <KPlot viewBox={{ x: [-4, 4], y: [-3, 3] }} subdivisions>
        <Polygon points={fig} color={objectColor} fillOpacity={t.fill.areaOpacity / 2} weight={t.stroke.curveSecondary} />
        <Polygon points={shape} color={touchColor} fillOpacity={t.fill.areaOpacity} weight={t.stroke.curvePrimary} />
        {/* transformed basis vectors */}
        <g style={{ opacity: 0.85 }}>
          <KVector tip={[1 + (M[0][0] - 1) * s, M[1][0] * s]} role="alt" />
          <KVector tip={[M[0][1] * s, 1 + (M[1][1] - 1) * s]} role="alt2" />
        </g>
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula
            tex={`A = \\begin{pmatrix} ${M[0][0]} & ${M[0][1]} \\\\ ${M[1][0]} & ${M[1][1]} \\end{pmatrix}, \\quad \\det A = ${fmt(
              M[0][0] * M[1][1] - M[0][1] * M[1][0],
              2
            )}`}
          />
        </p>
        <KCaption>Glideren interpolerer fra identitet til A. Basisvektorene følger med.</KCaption>
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
    "En figur og basisvektorene under en 2×2-matrise, med glider som interpolerer fra identiteten. For lineære transformasjoner (S1/S2, universitetsforkurs).",
  curriculum: ["S2", "forkurs"],
  params: {
    matrix: { type: { kind: "matrix2" }, required: true, doc: "2×2-matrisen [[a,b],[c,d]]" },
    figure: { type: { kind: "string", oneOf: Object.keys(FIGURES) }, default: "hus", doc: "figuren som transformeres" },
  },
  example: {
    template: "lineaer-transformasjon",
    title: "Lineær transformasjon",
    params: { matrix: [[1, 1], [0.5, 1.5]], figure: "hus" },
  },
  render: (params) => <LinTrans params={params} />,
});
