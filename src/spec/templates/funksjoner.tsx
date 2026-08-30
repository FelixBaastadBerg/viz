/** Templates: function analysis (1T/R1 core). */
import { useState } from "react";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KTangent, KPoint, KArea, KLabel } from "../../2d/primitives";
import { KPanel, KFormula, KReadout, KCaption, KSlider } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";
import type { QuizWrapper } from "../types";
import { SpecQuiz } from "../SpecQuiz";
import { ddx, simpson, fmt } from "../../math";

type P = Record<string, unknown>;

/* ------------------------------------------------------- funksjon-tangent */
function FunksjonTangent({ params, quiz }: { params: P; quiz?: QuizWrapper }) {
  const t = useKtTheme();
  const f = fn1(params.f as string);
  const [x0, setX0] = useState(params.x0 as number);
  const [touched, setTouched] = useState(false);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  return (
    <>
      <KPlot viewBox={view}>
        <KCurve f={f} drawIn delay={150} />
        <KTangent f={f} x={x0} fadeIn delay={900} />
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => {
            setX0(x);
            setTouched(true);
          }}
          fadeIn
          delay={900}
        />
      </KPlot>
      {quiz ? (
        <SpecQuiz quiz={quiz} value={x0} fValue={f(x0)} touched={touched} />
      ) : (
        <KPanel position="readout" fadeInDelay={1100}>
          <p className="kviz-formula">
            <KFormula tex={(params.tex as string) || `f(x)`} />
          </p>
          <KReadout
            items={[
              { label: "x", value: x0, role: "touch" },
              { label: "f(x)", value: f(x0), role: "touch" },
              { label: "f'(x)", value: ddx(f, x0), role: "touch" },
            ]}
          />
          <KCaption>Dra {t.touchNameNb} langs kurven.</KCaption>
        </KPanel>
      )}
    </>
  );
}

registerTemplate({
  id: "funksjon-tangent",
  description:
    "En graf med et dragbart punkt og tangentlinje; viser x, f(x) og f'(x) live. For derivasjon, momentan vekstfart, stasjonære punkter.",
  curriculum: ["1T", "R1"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "funksjonen, f.eks. \"0.1x^3 - x + 1\"" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning av f, f.eks. \"f(x)=0{,}1x^3-x+1\"" },
    viewX: { type: { kind: "range" }, default: [-6, 6], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-4, 4], doc: "y-utsnitt" },
    x0: { type: { kind: "number" }, default: 1, doc: "startposisjon for punktet" },
  },
  quizValue: "x-posisjonen til det dragbare punktet",
  example: {
    template: "funksjon-tangent",
    title: "Derivasjon: tangenten langs kurven",
    params: { f: "0.1x^3 - x + 1", tex: "f(x) = 0{,}1x^3 - x + 1", x0: 1 },
  },
  render: (params, quiz) => <FunksjonTangent params={params} quiz={quiz} />,
});

/* --------------------------------------------------------- derivert-graf */
function DerivertGraf({ params }: { params: P }) {
  const t = useKtTheme();
  const f = fn1(params.f as string);
  const df = (x: number) => ddx(f, x);
  const [x0, setX0] = useState(params.x0 as number);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  return (
    <>
      <div style={{ display: "grid", gridTemplateRows: "1fr 1fr", height: "100%" }}>
        <KPlot viewBox={view}>
          <KCurve f={f} />
          <KTangent f={f} x={x0} />
          <KPoint point={[x0, f(x0)]} constrain={(x) => [x, f(x)]} onMove={([x]) => setX0(x)} />
          <KLabel tex="f" at={[view.x[1] - 0.7, f(view.x[1] - 0.9) + 0.6]} role="object" />
        </KPlot>
        <KPlot viewBox={view}>
          <KCurve f={df} role="alt" />
          <KPoint point={[x0, df(x0)]} constrain={(x) => [x, df(x)]} onMove={([x]) => setX0(x)} />
          <KLabel tex="f'" at={[view.x[1] - 0.7, df(view.x[1] - 0.9) + 0.6]} role="alt" />
        </KPlot>
      </div>
      <KPanel position="readout">
        <KReadout
          items={[
            { label: "x", value: x0, role: "touch" },
            { label: "f(x)", value: f(x0), role: "object" },
            { label: "f'(x)", value: df(x0), role: "alt" },
          ]}
        />
        <KCaption>Dra {t.touchNameNb} — begge grafene følger samme x.</KCaption>
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "derivert-graf",
  description:
    "f og f' i to koblede grafer med felles dragbart x; ser hvordan fortegnet til f' styrer f. For funksjonsdrøfting.",
  curriculum: ["R1"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "funksjonen" },
    viewX: { type: { kind: "range" }, default: [-5, 5], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-4, 4], doc: "y-utsnitt (begge grafer)" },
    x0: { type: { kind: "number" }, default: 1, doc: "startposisjon" },
  },
  example: {
    template: "derivert-graf",
    title: "Sammenhengen mellom f og f'",
    params: { f: "x^3/3 - x", viewX: [-4, 4], viewY: [-3, 3], x0: 0.5 },
  },
  render: (params) => <DerivertGraf params={params} />,
});

/* ----------------------------------------------------- areal-under-kurve */
function ArealUnderKurve({ params }: { params: P }) {
  const f = fn1(params.f as string);
  const [a, setA] = useState((params.from as number) ?? -1);
  const [b, setB] = useState((params.to as number) ?? 2);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const V = simpson(f, a, b);
  return (
    <>
      <KPlot viewBox={view}>
        <KCurve f={f} />
        <KArea f={f} from={a} to={b} />
        <KLabel tex={`\\int_{${fmt(a, 1)}}^{${fmt(b, 1)}} f(x)\\,dx = ${fmt(V, 3)}`}
          at={[(view.x[0] + view.x[1]) / 2, view.y[0] + 0.8]} role="object" />
      </KPlot>
      <KPanel position="controls">
        <KSlider label="a" min={view.x[0]} max={view.x[1]} step={0.05} value={a}
          onChange={(v) => { setA(v); if (v > b) setB(v); }} />
        <KSlider label="b" min={view.x[0]} max={view.x[1]} step={0.05} value={b}
          onChange={(v) => { setB(v); if (v < a) setA(v); }} />
      </KPanel>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={(params.tex as string) || "\\int_a^b f(x)\\,dx"} />
        </p>
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "areal-under-kurve",
  description:
    "Skravert areal under en graf mellom justerbare grenser, med live integralverdi. For integrasjon og arealtolkning.",
  curriculum: ["R2"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "integranden" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning" },
    from: { type: { kind: "number" }, default: -1, doc: "nedre grense (start)" },
    to: { type: { kind: "number" }, default: 2, doc: "øvre grense (start)" },
    viewX: { type: { kind: "range" }, default: [-4, 4], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-1, 6], doc: "y-utsnitt" },
  },
  example: {
    template: "areal-under-kurve",
    title: "Bestemt integral som areal",
    params: { f: "0.5x^2 + 0.5", tex: "f(x)=0{,}5x^2+0{,}5", from: -1, to: 2 },
  },
  render: (params) => <ArealUnderKurve params={params} />,
});

/* --------------------------------------------------------- trig-funksjon */
function TrigFunksjon({ params }: { params: P }) {
  const [A, setA] = useState(params.a as number);
  const [B, setB] = useState(params.b as number);
  const [C, setC] = useState(params.c as number);
  const [D, setD] = useState(params.d as number);
  const f = (x: number) => A * Math.sin(B * (x + C)) + D;
  return (
    <>
      <KPlot viewBox={{ x: [-7, 7], y: [-4, 4] }}>
        <KCurve f={(x) => Math.sin(x)} role="alt" weight="secondary" />
        <KCurve f={f} />
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={`f(x) = ${fmt(A, 1)}\\sin(${fmt(B, 1)}(x + ${fmt(C, 1)})) + ${fmt(D, 1)}`} />
        </p>
        <KCaption>Grå kurve: sin x som referanse. Endre A, B, C, D.</KCaption>
      </KPanel>
      <KPanel position="controls">
        <KSlider label="A" min={-3} max={3} step={0.1} value={A} onChange={setA} digits={1} />
        <KSlider label="B" min={0.2} max={4} step={0.1} value={B} onChange={setB} digits={1} />
        <KSlider label="C" min={-3.14} max={3.14} step={0.05} value={C} onChange={setC} digits={1} />
        <KSlider label="D" min={-2} max={2} step={0.1} value={D} onChange={setD} digits={1} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "trig-funksjon",
  description:
    "A·sin(B(x+C))+D med glidere for amplitude, periode, fase og likevektslinje, mot sin x som referanse. For trigonometriske funksjoner.",
  curriculum: ["R1", "R2"],
  params: {
    a: { type: { kind: "number" }, default: 2, doc: "amplitude A (start)" },
    b: { type: { kind: "number" }, default: 1, doc: "vinkelfrekvens B (start)" },
    c: { type: { kind: "number" }, default: 0, doc: "faseforskyvning C (start)" },
    d: { type: { kind: "number" }, default: 0, doc: "likevektslinje D (start)" },
  },
  example: {
    template: "trig-funksjon",
    title: "Harmoniske svingninger",
    params: { a: 2, b: 1, c: 0, d: 0.5 },
  },
  render: (params) => <TrigFunksjon params={params} />,
});
