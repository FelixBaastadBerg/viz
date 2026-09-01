/** Templates: graphical equations, 3D volume. */
import { useState } from "react";
import { useTransformContext, vec } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint, KLabel } from "../../2d/primitives";
import { KPanel, KFormula, KReadout, KCaption, KSlider } from "../../chrome";
import { KScene3D } from "../../3d/KScene3D";
import { KAxes3D } from "../../3d/KAxes3D";
import { KSurface } from "../../3d/KSurface";
import { KRegionColumn } from "../../3d/KRegionColumn";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1, fn2 } from "../expr";
import type { QuizWrapper } from "../types";
import { SpecQuiz } from "../SpecQuiz";
import { fmt, simpson2d } from "../../math";

type P = Record<string, unknown>;

/* -------------------------------------------------------- likning-grafisk */
function LikningGrafisk({ params, quiz }: { params: P; quiz?: QuizWrapper }) {
  const t = useKtTheme();
  const f = fn1(params.f as string);
  const g = fn1(params.g as string);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const [x0, setX0] = useState(params.x0 as number);
  const [touched, setTouched] = useState(false);
  const gap = f(x0) - g(x0);
  return (
    <>
      <KPlot viewBox={view}>
        <KCurve f={f} />
        <KCurve f={g} role="alt" weight="secondary" />
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => {
            setX0(x);
            setTouched(true);
          }}
        />
        <KLabel tex="f" at={[view.x[1] - 0.5, f(view.x[1] - 0.7) + 0.5]} role="object" />
        <KLabel tex="g" at={[view.x[1] - 0.5, g(view.x[1] - 0.7) + 0.5]} role="alt" />
      </KPlot>
      {quiz ? (
        <SpecQuiz quiz={quiz} value={x0} fValue={f(x0)} touched={touched} />
      ) : (
        <KPanel position="readout">
          <p className="kviz-formula">
            <KFormula tex={(params.tex as string) || "f(x) = g(x)"} />
          </p>
          {(params.readout as string) === "verdier" ? (
            <KReadout
              items={[
                { label: "x", value: x0, role: "touch" },
                { label: "f(x)", value: f(x0), role: "object" },
                { label: "g(x)", value: g(x0), role: "alt" },
              ]}
            />
          ) : (
            <KReadout
              items={[
                { label: "x", value: x0, role: "touch" },
                { label: "f(x) - g(x)", value: gap, role: gap * gap < 0.01 ? "right" : "touch" },
              ]}
            />
          )}
          <KCaption>
            {(params.caption as string) ||
              `Dra ${t.touchNameNb} dit hvor grafene skjærer hverandre.`}
          </KCaption>
        </KPanel>
      )}
    </>
  );
}

registerTemplate({
  id: "likning-grafisk",
  description:
    "To grafer og et dragbart punkt; viser f(x) − g(x) live for grafisk likningsløsning. For likninger og skjæringspunkter.",
  curriculum: ["1T"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "venstresiden f" },
    g: { type: { kind: "expr", vars: 1 }, required: true, doc: "høyresiden g" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning av likningen" },
    viewX: { type: { kind: "range" }, default: [-5, 5], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-4, 6], doc: "y-utsnitt" },
    x0: { type: { kind: "number" }, default: 0, doc: "startposisjon" },
    readout: { type: { kind: "string", oneOf: ["differanse", "verdier"] }, default: "differanse", doc: "vis f−g (likninger) eller f og g hver for seg (grenser)" },
    caption: { type: { kind: "string" }, default: "", doc: "egen instruksjonstekst under avlesningene" },
  },
  quizValue: "x-posisjonen til punktet (bruk expr-zero med f−g for skjæring)",
  example: {
    template: "likning-grafisk",
    title: "Grafisk løsning av likning",
    params: { f: "x^2 - 1", g: "0.5x + 1", tex: "x^2 - 1 = 0{,}5x + 1", viewX: [-4, 4], viewY: [-2, 6], x0: 0 },
  },
  render: (params, quiz) => <LikningGrafisk params={params} quiz={quiz} />,
});

/* -------------------------------------------------------- flate-volum-3d */
function FlateVolum({ params }: { params: P }) {
  const f = fn2(params.f as string);
  const domain = params.domain as number;
  const [a, setA] = useState((params.region as number[])[0]);
  const [b, setB] = useState((params.region as number[])[1]);
  const [c, setC] = useState((params.region as number[])[2]);
  const [d, setD] = useState((params.region as number[])[3]);
  const GAP = 0.4;
  const V = simpson2d(f, a, b, c, d);
  return (
    <>
      <KScene3D camera="iso" floorGrid={domain}>
        <KAxes3D xy={domain} />
        <KSurface f={f} domain={domain} />
        <KRegionColumn f={f} a={a} b={b} c={c} d={d} />
      </KScene3D>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={(params.tex as string) || "V=\\iint_R f\\,dA"} />
        </p>
        <p className="kviz-readout">
          <span>
            V ≈ <span className="kviz-value">{fmt(V, 3)}</span>
          </span>
        </p>
        <KCaption>Dra for å rotere. Juster området R med gliderne.</KCaption>
      </KPanel>
      <KPanel position="controls">
        <KSlider label="a" min={-domain} max={domain - GAP} step={0.05} value={a}
          onChange={(v) => { setA(v); if (v > b - GAP) setB(v + GAP); }} />
        <KSlider label="b" min={-domain + GAP} max={domain} step={0.05} value={b}
          onChange={(v) => { setB(v); if (v < a + GAP) setA(v - GAP); }} />
        <KSlider label="c" min={-domain} max={domain - GAP} step={0.05} value={c}
          onChange={(v) => { setC(v); if (v > d - GAP) setD(v + GAP); }} />
        <KSlider label="d" min={-domain + GAP} max={domain} step={0.05} value={d}
          onChange={(v) => { setD(v); if (v < c + GAP) setC(v - GAP); }} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "flate-volum-3d",
  description:
    "3D-flate z = f(x,y) med justerbart rektangulært område R og live volum (dobbeltintegral). For Kalkulus 2 / flervariabel.",
  curriculum: ["universitet"],
  params: {
    f: { type: { kind: "expr", vars: 2 }, required: true, doc: "flaten f(x, y) — bør være ≥ 0 på domenet om volum skal være ærlig" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning" },
    domain: { type: { kind: "number", min: 1, max: 6 }, default: 3.4, doc: "domenehalvbredde" },
    region: { type: { kind: "numbers" }, default: [-2, 1.5, -1.5, 2], doc: "startområdet [a, b, c, d]" },
  },
  example: {
    template: "flate-volum-3d",
    title: "Volum under flate",
    params: {
      f: "2 + sin(x)*cos(y)",
      tex: "V=\\iint_{R} f(x,y)\\,dA,\\quad f(x,y)=2+\\sin x\\,\\cos y",
    },
  },
  render: (params) => <FlateVolum params={params} />,
});

/* -------------------------------------------------------- grense-utforsker */
/** Open-circle marker («hull») drawn in pixel space so it stays round. */
function HoleMarker({ at }: { at: [number, number] }) {
  const t = useKtTheme();
  const ctx = useTransformContext();
  const [px, py] = vec.transform(at, vec.matrixMult(ctx.viewTransform, ctx.userTransform));
  return (
    <circle
      cx={px}
      cy={py}
      r={5.5}
      fill={t.stage.canvas}
      stroke={t.accents.object.stroke}
      strokeWidth={2.5}
    />
  );
}

function GrenseUtforsker({ params }: { params: P }) {
  const f = fn1(params.f as string);
  const a = params.a as number;
  const L = params.L as number;
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const [x0, setX0] = useState(params.x0 as number);
  return (
    <div className="kviz-widget" style={{ position: "relative" }}>
      <KPlot viewBox={view} height={(params.height as number) ?? 340}>
        <KCurve f={f} />
        {params.hole !== false && <HoleMarker at={[a, L]} />}
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => setX0(x)}
        />
      </KPlot>
      <KPanel position="readout">
        {params.tex ? (
          <p className="kviz-formula">
            <KFormula tex={params.tex as string} />
          </p>
        ) : null}
        <KReadout
          items={[
            { label: "x", value: x0, role: "touch" },
            { label: "f(x)", value: f(x0), role: "object" },
          ]}
        />
        {params.caption ? <KCaption>{params.caption as string}</KCaption> : null}
      </KPanel>
    </div>
  );
}

registerTemplate({
  id: "grense-utforsker",
  description:
    "Grenseverdi i et punkt: ÉN kurve (gjerne delt funksjon via ternær mathjs-syntaks), åpent hull-symbol i grensepunktet, og et dragbart punkt som viser x og f(x) på vei mot grensen. For grenser og kontinuitet.",
  curriculum: ["R1", "universitet"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "funksjonen — delt funksjon skrives ternært: \"x < 2 ? x^2 : 2x\"" },
    a: { type: { kind: "number" }, required: true, doc: "grensepunktet" },
    L: { type: { kind: "number" }, required: true, doc: "grenseverdien (hullets y-verdi)" },
    hole: { type: { kind: "boolean" }, default: true, doc: "tegn åpent hull i (a, L)" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX over avlesningene" },
    caption: { type: { kind: "string" }, default: "", doc: "instruksjon under avlesningene" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger" },
    viewX: { type: { kind: "range" }, default: [-1, 5], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-1, 9], doc: "y-utsnitt" },
    x0: { type: { kind: "number" }, default: 0.8, doc: "startposisjon for punktet" },
  },
  example: {
    template: "grense-utforsker",
    title: "Grensen i x = 2",
    params: {
      f: "x < 2 ? x^2 : 2x",
      a: 2,
      L: 4,
      tex: "\\lim_{x \\to 2} f(x) = 4",
      caption: "Dra punktet mot x = 2 fra begge sider — f(x) nærmer seg 4, selv om f ikke er definert akkurat der.",
      viewX: [-1, 5],
      viewY: [-1, 9],
      x0: 0.8,
    },
  },
  render: (params) => <GrenseUtforsker params={params} />,
});
