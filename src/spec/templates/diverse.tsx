/** Templates: graphical equations, 3D volume. */
import { useState } from "react";
import { useTransformContext, vec } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint, KLabel, KVector, curveLabelPos } from "../../2d/primitives";
import type { KtRole } from "../../theme/types";
import { KPanel, KFig, KLegend, KSlider } from "../../chrome";
import { KScene3D } from "../../3d/KScene3D";
import { KAxes3D } from "../../3d/KAxes3D";
import { KSurface } from "../../3d/KSurface";
import { KRegionColumn } from "../../3d/KRegionColumn";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1, fn2 } from "../expr";
import type { QuizWrapper } from "../types";
import { SpecQuiz } from "../SpecQuiz";
import { simpson2d } from "../../math";

type P = Record<string, unknown>;


/** Hand-drawn annotation (Manim-video look): curved arrow + Caveat-style
    label in the theme display font. Drawn in pixel space. */
function HandNote({
  tip,
  tail,
  text,
  anchor,
}: {
  tip: [number, number];
  tail: [number, number];
  text: string;
  anchor: "start" | "end";
}) {
  const t = useKtTheme();
  const ctx = useTransformContext();
  const M = vec.matrixMult(ctx.viewTransform, ctx.userTransform);
  const [x1, y1] = vec.transform(tail, M);
  const [x2, y2] = vec.transform(tip, M);
  // W10 + Felix 2026-09-01: arrow AND text in the alt2 accent (the same
  // purple as the marked point) — stroke for the arrow, ink for the text
  // (arv: #8757C8 / #6E41AC, both clearly purple and legible on paper).
  const col = t.accents.alt2.stroke;
  const ink = t.accents.alt2.ink;
  // curved shaft: control point pushed perpendicular for a lazy hand arc
  const mx = (x1 + x2) / 2 - (y2 - y1) * 0.22;
  const my = (y1 + y2) / 2 + (x2 - x1) * 0.22;
  // open, hand-drawn arrowhead: two strokes off the approach direction
  const ang = Math.atan2(y2 - my, x2 - mx);
  const hl = 11;
  const a1 = ang + Math.PI - 0.45;
  const a2 = ang + Math.PI + 0.45;
  return (
    <g style={{ pointerEvents: "none" }}>
      {/* inline style stroke, not the attribute: mafs' `.MafsView path`
          rule would otherwise repaint the arrow in --mafs-fg (near-black) */}
      <path
        d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
        fill="none"
        style={{ stroke: col }}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
      <path
        d={`M ${x2 + hl * Math.cos(a1)} ${y2 + hl * Math.sin(a1)} L ${x2} ${y2} L ${x2 + hl * Math.cos(a2)} ${y2 + hl * Math.sin(a2)}`}
        fill="none"
        style={{ stroke: col }}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text
        x={x1 + (anchor === "start" ? 6 : -6)}
        y={y1 - 8}
        textAnchor={anchor}
        style={{
          // inline style, not the fill attribute: mafs' `.MafsView text`
          // rule would otherwise repaint the text in --mafs-fg (near-black)
          fill: ink,
          fontFamily: t.typography.display,
          fontSize: 21,
          fontWeight: t.typography.displayWeight,
        }}
      >
        {text}
      </text>
    </g>
  );
}

/* -------------------------------------------------------- likning-grafisk */
/** First sign change of f−g over [x0,x1] whose point lies inside the view,
    refined by bisection. Falls back to the first root when none is in view. */
function findCrossing(
  f: (x: number) => number,
  g: (x: number) => number,
  [xa, xb]: [number, number],
  [ya, yb]: [number, number]
): [number, number] | null {
  const h = (x: number) => f(x) - g(x);
  const N = 400;
  const roots: number[] = [];
  let prev = h(xa);
  for (let i = 1; i <= N; i++) {
    const x = xa + ((xb - xa) * i) / N;
    const cur = h(x);
    if (Number.isFinite(prev) && Number.isFinite(cur) && prev * cur <= 0 && prev !== cur) {
      let a = xa + ((xb - xa) * (i - 1)) / N;
      let b = x;
      for (let k = 0; k < 60; k++) {
        const m = (a + b) / 2;
        if (h(a) * h(m) <= 0) b = m;
        else a = m;
      }
      roots.push((a + b) / 2);
    }
    prev = cur;
  }
  const inView = roots.find((x) => f(x) >= ya && f(x) <= yb);
  const x = inView ?? roots[0];
  return x === undefined ? null : [x, f(x)];
}

function LikningGrafisk({ params, quiz }: { params: P; quiz?: QuizWrapper }) {
  const f = fn1(params.f as string);
  const g = fn1(params.g as string);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const statisk = params.statisk === true && !quiz;
  const [x0, setX0] = useState(params.x0 as number);
  const [touched, setTouched] = useState(false);
  const gap = f(x0) - g(x0);
  // statisk: the intersection is computed, marked and annotated — no dragging
  const cross = statisk ? findCrossing(f, g, view.x, view.y) : null;
  const dx = view.x[1] - view.x[0];
  const dy = view.y[1] - view.y[0];
  // arrow approaches from over/right; flips when the point sits near an edge
  const sx = cross && cross[0] > (view.x[0] + view.x[1]) / 2 ? -1 : 1;
  const sy = cross && cross[1] + 0.32 * dy > view.y[1] ? -1 : 1;
  const tail: [number, number] = cross
    ? [cross[0] + sx * 0.2 * dx, cross[1] + sy * 0.22 * dy]
    : [0, 0];
  const tip: [number, number] = cross
    ? [cross[0] + sx * 0.03 * dx, cross[1] + sy * 0.045 * dy]
    : [0, 0];
  // static mode: keep the curve labels on the OPPOSITE side of the annotation
  const labelSide = statisk && cross ? ((-sx) as -1 | 1) : undefined;
  const fFrac = labelSide === undefined ? 0.78 : labelSide === -1 ? 0.14 : 0.86;
  const gFrac = labelSide === undefined ? 0.86 : labelSide === -1 ? 0.26 : 0.74;
  const fPos = curveLabelPos(f, view, fFrac, 0.09, labelSide);
  let gPos = curveLabelPos(g, view, gFrac, 0.09, labelSide);
  const crowdsF =
    Math.abs(gPos[0] - fPos[0]) < 0.12 * dx && Math.abs(gPos[1] - fPos[1]) < 0.18 * dy;
  const crowdsCross =
    cross !== null &&
    Math.abs(gPos[0] - cross[0]) < 0.16 * dx &&
    Math.abs(gPos[1] - cross[1]) < 0.1 * dy;
  if (labelSide !== undefined && (crowdsF || crowdsCross)) {
    // the label crowds f's label or the marked point — flip it under its curve
    gPos = curveLabelPos(g, view, gFrac, -0.14, labelSide);
  }
  const legendItems =
    quiz || statisk
      ? undefined
      : (params.readout as string) === "verdier"
        ? [
            { label: "x", value: x0, role: "touch" as KtRole },
            { label: "f(x)", value: f(x0), role: "object" as KtRole },
            { label: "g(x)", value: g(x0), role: "alt" as KtRole },
          ]
        : [
            { label: "x", value: x0, role: "touch" as KtRole },
            {
              label: "f(x) - g(x)",
              value: gap,
              role: (gap * gap < 0.01 ? "right" : "touch") as KtRole,
            },
          ];
  return (
    <>
      <KFig legend={legendItems && <KLegend corner="tl" items={legendItems} />}>
        <KPlot viewBox={view} height={(params.height as number) ?? 340}>
          <KCurve f={f} />
          <KCurve f={g} role="alt" weight="secondary" />
          {!statisk && (
            <KPoint
              point={[x0, f(x0)]}
              constrain={(x) => [x, f(x)]}
              onMove={([x]) => {
                setX0(x);
                setTouched(true);
              }}
            />
          )}
          <KLabel tex={(params.fLabel as string) || "y = f(x)"} at={fPos} role="object" />
          <KLabel tex={(params.gLabel as string) || "y = g(x)"} at={gPos} role="alt" />
          {cross && (
            <>
              <DotMarker at={cross} role="alt2" />
              <HandNote
                tip={tip}
                tail={tail}
                text={(params.merkelapp as string) || "her passer begge ligningene"}
                anchor={sx === 1 ? "start" : "end"}
              />
            </>
          )}
        </KPlot>
      </KFig>
      {quiz ? <SpecQuiz quiz={quiz} value={x0} fValue={f(x0)} touched={touched} /> : null}
    </>
  );
}

registerTemplate({
  id: "likning-grafisk",
  description:
    "To grafer for grafisk likningsløsning: dragbart punkt med live f(x) − g(x), eller statisk modus som markerer skjæringspunktet med pil og merkelapp. For likninger og skjæringspunkter.",
  curriculum: ["1T"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "venstresiden f" },
    g: { type: { kind: "expr", vars: 1 }, required: true, doc: "høyresiden g" },
    fLabel: { type: { kind: "string" }, default: "y = f(x)", doc: "kurvelabel for f (KaTeX) i kurvens farge — sett uttrykket, f.eks. \"y = x^2 - 1\" (W9)" },
    gLabel: { type: { kind: "string" }, default: "y = g(x)", doc: "kurvelabel for g (KaTeX) — sett uttrykket, f.eks. \"y = 0{,}5x + 1\" (W9)" },
    tex: { type: { kind: "string" }, default: "", doc: "utgått — ignoreres (likningen hører hjemme i brødteksten); beholdt for bakoverkompatibilitet" },
    statisk: { type: { kind: "boolean" }, default: false, doc: "statisk figur: intet dragbart punkt/readouts — skjæringspunktet beregnes og markeres med pil og merkelapp" },
    merkelapp: { type: { kind: "string" }, default: "(x, y)-verdiene som passer begge", doc: "kort tekst ved pilen i statisk modus" },
    viewX: { type: { kind: "range" }, default: [-5, 5], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-4, 6], doc: "y-utsnitt" },
    x0: { type: { kind: "number" }, default: 0, doc: "startposisjon" },
    readout: { type: { kind: "string", oneOf: ["differanse", "verdier"] }, default: "differanse", doc: "vis f−g (likninger) eller f og g hver for seg (grenser)" },
    caption: { type: { kind: "string" }, default: "", doc: "utgått (W6: ingen instruksjonstekst på widgets) — ignoreres, beholdt for bakoverkompatibilitet" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  quizValue: "x-posisjonen til punktet (bruk expr-zero med f−g for skjæring)",
  example: {
    template: "likning-grafisk",
    title: "Grafisk løsning av likning",
    params: { f: "x^2 - 1", g: "0.5x + 1", fLabel: "y = x^2 - 1", gLabel: "y = 0{,}5x + 1", viewX: [-4, 4], viewY: [-2, 6], x0: 0 },
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
      {/* W7: the live volume lives in a legend box over the 3D stage (KFig
          provides the relative wrapper, same pattern as the 2D figures) */}
      <KFig
        legend={
          <KLegend
            corner="tl"
            items={[{ label: "V=\\iint_R f\\,dA", value: V, digits: 3, role: "object" }]}
          />
        }
      >
        <KScene3D camera="iso" floorGrid={domain}>
          <KAxes3D xy={domain} />
          <KSurface f={f} domain={domain} />
          <KRegionColumn f={f} a={a} b={b} c={c} d={d} />
        </KScene3D>
      </KFig>
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
    tex: { type: { kind: "string" }, default: "", doc: "utgått — ignoreres (W7: verdien står i legenden med fast formel-label); beholdt for bakoverkompatibilitet" },
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
      fill="var(--kt-bg)"
      stroke={t.accents.object.stroke}
      strokeWidth={2.5}
    />
  );
}

/** Small filled marker (e.g. an isolated function value) in pixel space. */
function DotMarker({ at, role = "object" }: { at: [number, number]; role?: KtRole }) {
  const t = useKtTheme();
  const ctx = useTransformContext();
  const [px, py] = vec.transform(at, vec.matrixMult(ctx.viewTransform, ctx.userTransform));
  return <circle cx={px} cy={py} r={5} fill={t.accents[role].stroke} />;
}

function GrenseUtforsker({ params }: { params: P }) {
  const f = fn1(params.f as string);
  const a = params.a as number;
  const L = params.L as number;
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const [x0, setX0] = useState(params.x0 as number);
  const extra = ((params.extra as string[]) ?? []).map((e) => fn1(e));
  const marks = (params.marks as [number, number][]) ?? [];
  return (
    <div className="kviz-widget" style={{ position: "relative" }}>
      <KPlot
        viewBox={view}
        height={(params.height as number) ?? 340}
        xTick={(params.xTick as number) ?? 1}
        yTick={(params.yTick as number) ?? 1}
      >
        {extra.map((g, i) => (
          <KCurve key={i} f={g} role="alt" weight="secondary" />
        ))}
        <KCurve f={f} />
        {marks.map((m, i) => (
          <DotMarker key={i} at={m} />
        ))}
        {params.hole !== false && <HoleMarker at={[a, L]} />}
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => setX0(x)}
        />
      </KPlot>
      {/* W7: live values sit in the in-figure legend */}
      <KLegend
        corner="tl"
        items={[
          { label: "x", value: x0, role: "touch" },
          { label: "f(x)", value: f(x0), role: "object" },
        ]}
      />
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
    tex: { type: { kind: "string" }, default: "", doc: "utgått — ignoreres (W9: formler hører i brødteksten); beholdt for bakoverkompatibilitet" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger" },
    viewX: { type: { kind: "range" }, default: [-1, 5], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-1, 9], doc: "y-utsnitt" },
    x0: { type: { kind: "number" }, default: 0.8, doc: "startposisjon for punktet" },
    extra: {
      type: { kind: "exprs", vars: 1 },
      default: [],
      doc: "ekstra kurver (mathjs-uttrykk) i dempet stil — f.eks. skviseregelens yttergrenser",
    },
    marks: {
      type: { kind: "points" },
      default: [],
      doc: "fylte punkter [[x, y], …] — f.eks. en isolert funksjonsverdi eller intervallender",
    },
    xTick: { type: { kind: "number", min: 0.25, max: 20 }, default: 1, doc: "avstand mellom x-aksetall — øk så tallene ikke stues (W6)" },
    yTick: { type: { kind: "number", min: 0.25, max: 20 }, default: 1, doc: "avstand mellom y-aksetall — øk på høye utsnitt (W6)" },
  },
  example: {
    template: "grense-utforsker",
    title: "Grensen i x = 2",
    params: {
      f: "x < 2 ? x^2 : 2x",
      a: 2,
      L: 4,
      viewX: [-1, 5],
      viewY: [-1, 9],
      x0: 0.8,
    },
  },
  render: (params) => <GrenseUtforsker params={params} />,
});
