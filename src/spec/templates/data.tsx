/** Templates: sequences, probability distributions, statistics. */
import { useMemo, useState } from "react";
import { Polygon, Point as MafsPoint } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KArea, KLabel, useRoleColor } from "../../2d/primitives";
import { KPanel, KFormula, KReadout, KSlider } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";
import { fmt, simpson } from "../../math";

type P = Record<string, unknown>;

/* ----------------------------------------------------------- foelge-rekke */
function FoelgeRekke({ params }: { params: P }) {
  const an = fn1(params.an as string); // n ↦ a_n (expression in x)
  const nMax = params.nMax as number;
  const kind = params.kind as string;
  const objectColor = useRoleColor("object");
  const touchColor = useRoleColor("touch");
  const [n, setN] = useState(Math.min(5, nMax));

  const terms = useMemo(
    () => Array.from({ length: nMax }, (_, i) => an(i + 1)),
    [an, nMax]
  );
  const partials = useMemo(() => {
    let s = 0;
    return terms.map((a) => (s += a));
  }, [terms]);
  const values = kind === "partial-sums" ? partials : terms;
  const yMax = Math.max(...values, 0) * 1.25 + 0.5;
  const yMin = Math.min(...values, 0) * 1.25 - 0.5;

  return (
    <>
      <KPlot viewBox={{ x: [0, nMax + 1], y: [yMin, yMax] }} height={(params.height as number) ?? 340}>
        {values.map((v, i) => (
          <MafsPoint
            key={i}
            x={i + 1}
            y={v}
            color={i + 1 <= n ? touchColor : objectColor}
            opacity={i + 1 <= n ? 1 : 0.35}
          />
        ))}
        {kind === "partial-sums" && (
          <KLabel tex={`S_{${n}} = ${fmt(partials[n - 1], 3)}`} at={[nMax * 0.55, yMax * 0.85]} role="touch" />
        )}
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={(params.tex as string) || "a_n"} />
        </p>
        <KReadout
          items={[
            { label: "n", value: String(n), role: "touch" },
            { label: "a_n", value: terms[n - 1], digits: 3, role: "object" },
            ...(kind === "partial-sums"
              ? [{ label: "S_n", value: partials[n - 1], digits: 3, role: "touch" as const }]
              : []),
          ]}
        />
      </KPanel>
      <KPanel position="controls">
        <KSlider label="n" min={1} max={nMax} step={1} value={n} onChange={(v) => setN(Math.round(v))} digits={0} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "foelge-rekke",
  description:
    "Tallfølge eller delsummer som diskrete punkter, med glider for n. For følger, rekker og konvergens.",
  curriculum: ["R2", "S2"],
  params: {
    an: { type: { kind: "expr", vars: 1 }, required: true, doc: "leddet a_n som uttrykk i x (x = n), f.eks. \"3*(1/2)^(x-1)\"" },
    tex: { type: { kind: "string" }, default: "", doc: "KaTeX-visning, f.eks. \"a_n = 3\\\\cdot(1/2)^{n-1}\"" },
    kind: { type: { kind: "string", oneOf: ["sequence", "partial-sums"] }, default: "sequence", doc: "vis leddene eller delsummene S_n" },
    nMax: { type: { kind: "number", min: 3, max: 60 }, default: 20, doc: "antall ledd" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "foelge-rekke",
    title: "Geometrisk rekke konvergerer",
    params: { an: "3*(1/2)^(x-1)", tex: "a_n = 3\\cdot\\left(\\tfrac{1}{2}\\right)^{n-1}", kind: "partial-sums", nMax: 20 },
  },
  render: (params) => <FoelgeRekke params={params} />,
});

/* ---------------------------------------------------- binomisk-fordeling */
function lnFact(n: number): number {
  let s = 0;
  for (let i = 2; i <= n; i++) s += Math.log(i);
  return s;
}
function binomPmf(n: number, p: number, k: number): number {
  const lnC = lnFact(n) - lnFact(k) - lnFact(n - k);
  return Math.exp(lnC + k * Math.log(p) + (n - k) * Math.log(1 - p));
}

function BinomiskFordeling({ params }: { params: P }) {
  const [n, setN] = useState(params.n as number);
  const [p, setP] = useState(params.p as number);
  const touchColor = useRoleColor("touch");
  const objectColor = useRoleColor("object");
  const t = useKtTheme();
  const pmf = useMemo(
    () => Array.from({ length: n + 1 }, (_, k) => binomPmf(n, p, k)),
    [n, p]
  );
  const yMax = Math.max(...pmf) * 1.3;
  const mean = n * p;
  const w = 0.38;
  return (
    <>
      <KPlot viewBox={{ x: [-1, Math.max(n + 1, 8)], y: [-yMax * 0.08, yMax] }} height={(params.height as number) ?? 340}>
        {pmf.map((q, k) => (
          <Polygon
            key={k}
            points={[[k - w, 0], [k + w, 0], [k + w, q], [k - w, q]]}
            color={Math.abs(k - Math.round(mean)) < 0.5 ? touchColor : objectColor}
            fillOpacity={t.fill.areaOpacity * 2.2}
            weight={1}
          />
        ))}
        <KLabel tex={`E(X) = np = ${fmt(mean, 1)}`} at={[Math.max(n + 1, 8) * 0.72, yMax * 0.9]} role="touch" />
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={`X \\sim \\text{Bin}(${n},\\; ${fmt(p, 2)})`} />
        </p>
      </KPanel>
      <KPanel position="controls">
        <KSlider label="n" min={1} max={40} step={1} value={n} onChange={(v) => setN(Math.round(v))} digits={0} />
        <KSlider label="p" min={0.05} max={0.95} step={0.01} value={p} onChange={setP} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "binomisk-fordeling",
  description:
    "Binomisk sannsynlighetsfordeling som søylediagram med glidere for n og p; forventningsverdien framhevet. For sannsynlighet (1T/S1/R1).",
  curriculum: ["1T", "S1", "R1"],
  params: {
    n: { type: { kind: "number", min: 1, max: 40 }, default: 10, doc: "antall forsøk (start)" },
    p: { type: { kind: "number", min: 0.01, max: 0.99 }, default: 0.3, doc: "suksess-sannsynlighet (start)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "binomisk-fordeling",
    title: "Binomisk fordeling",
    params: { n: 10, p: 0.3 },
  },
  render: (params) => <BinomiskFordeling params={params} />,
});

/* ------------------------------------------------------- normalfordeling */
function NormalFordeling({ params }: { params: P }) {
  const [mu, setMu] = useState(params.mu as number);
  const [sigma, setSigma] = useState(params.sigma as number);
  const [a, setA] = useState(params.from as number);
  const [b, setB] = useState(params.to as number);
  const phi = (x: number) =>
    Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));
  const prob = simpson(phi, a, b, 128);
  return (
    <>
      <KPlot viewBox={{ x: [mu - 5 * 1.6, mu + 5 * 1.6], y: [-0.06, 0.75] }} height={(params.height as number) ?? 340}>
        <KCurve f={phi} />
        <KArea f={phi} from={a} to={b} role="touch" />
        <KLabel tex={`P(${fmt(a, 1)} \\le X \\le ${fmt(b, 1)}) = ${fmt(prob, 3)}`} at={[mu, 0.68]} role="touch" />
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={`X \\sim N(${fmt(mu, 1)},\\; ${fmt(sigma, 1)}^2)`} />
        </p>
      </KPanel>
      <KPanel position="controls">
        <KSlider label="\mu" min={-3} max={3} step={0.1} value={mu} onChange={setMu} digits={1} />
        <KSlider label="\sigma" min={0.4} max={2.5} step={0.05} value={sigma} onChange={setSigma} />
        <KSlider label="a" min={-8} max={8} step={0.1} value={a} onChange={(v) => { setA(v); if (v > b) setB(v); }} digits={1} />
        <KSlider label="b" min={-8} max={8} step={0.1} value={b} onChange={(v) => { setB(v); if (v < a) setA(v); }} digits={1} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "normalfordeling",
  description:
    "Normalfordelingskurve med skravert sannsynlighet mellom justerbare grenser og glidere for μ og σ. For normalfordeling (S2/R2).",
  curriculum: ["S2", "R2"],
  params: {
    mu: { type: { kind: "number" }, default: 0, doc: "forventningsverdi (start)" },
    sigma: { type: { kind: "number", min: 0.1 }, default: 1, doc: "standardavvik (start)" },
    from: { type: { kind: "number" }, default: -1, doc: "nedre grense (start)" },
    to: { type: { kind: "number" }, default: 1, doc: "øvre grense (start)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "normalfordeling",
    title: "Normalfordelingen",
    params: { mu: 0, sigma: 1, from: -1, to: 1 },
  },
  render: (params) => <NormalFordeling params={params} />,
});
