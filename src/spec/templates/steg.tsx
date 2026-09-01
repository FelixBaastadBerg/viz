/** Templates: steg-for-steg-widgets med «Neste»-knapp (samme mekanikk som
 * dijkstra-graf): gauss-steg (radoperasjoner mot redusert trappeform, ren
 * KaTeX-widget) og fikspunkt-steg (spindelvev-iterasjon x_{n+1} = g(x_n)).
 *
 * Begge er deterministiske: hele forløpet er forhåndsberegnet, stegindeksen
 * er eneste state — Tilbake/Nullstill er derfor eksakte.
 */
import { useMemo, useState } from "react";
import { Line as MafsLine } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint } from "../../2d/primitives";
import { KFormula, KReadout } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";

type P = Record<string, unknown>;

/* ================================================================ gauss-steg */

/** Exact rational arithmetic so the row operations stay pretty. */
interface Frac {
  n: number;
  d: number; // always > 0
}

function gcd(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) [a, b] = [b, a % b];
  return a || 1;
}

function frac(n: number, d = 1): Frac {
  if (d < 0) {
    n = -n;
    d = -d;
  }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}

/** Convert a (possibly decimal) input number to an exact-ish fraction. */
function fromNumber(v: number): Frac {
  if (Number.isInteger(v)) return { n: v, d: 1 };
  for (let d = 2; d <= 1000; d++) {
    const n = v * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return frac(Math.round(n), d);
  }
  return frac(Math.round(v * 1e6), 1e6);
}

const fAdd = (a: Frac, b: Frac) => frac(a.n * b.d + b.n * a.d, a.d * b.d);
const fSub = (a: Frac, b: Frac) => frac(a.n * b.d - b.n * a.d, a.d * b.d);
const fMul = (a: Frac, b: Frac) => frac(a.n * b.n, a.d * b.d);
const fDiv = (a: Frac, b: Frac) => frac(a.n * b.d, a.d * b.n);
const fIsZero = (a: Frac) => a.n === 0;
const fIsOne = (a: Frac) => a.n === a.d;

/** Pretty TeX: integers plain, simple fractions as \frac, else 2 decimals. */
function fTex(a: Frac): string {
  if (a.d === 1) return String(a.n);
  if (a.d <= 64) {
    const sign = a.n < 0 ? "-" : "";
    return `${sign}\\frac{${Math.abs(a.n)}}{${a.d}}`;
  }
  const v = a.n / a.d;
  return fmtDecTex(v);
}

/** 2-decimal fallback with Norwegian decimal comma in KaTeX. */
function fmtDecTex(v: number): string {
  const s = v.toFixed(2).replace("-", "");
  return (v < 0 ? "-" : "") + s.replace(".", "{,}");
}

/** Coefficient in an op like "- 2R_1": magnitude only, 1 omitted. */
function fCoefTex(a: Frac): string {
  const abs = frac(Math.abs(a.n), a.d);
  if (fIsOne(abs)) return "";
  return fTex(abs);
}

/** Signed coefficient for "R_i ← cR_i": sign kept, magnitude 1 omitted. */
function fSignedCoefTex(a: Frac): string {
  return (a.n < 0 ? "-" : "") + fCoefTex(a);
}

interface GaussStep {
  /** Row operation that PRODUCED `after`, as KaTeX. */
  opTex: string;
  after: Frac[][];
}

/** Full Gauss–Jordan to reduced row-echelon form, one step per row op. */
function gaussJordan(m0: Frac[][], ncols: number): GaussStep[] {
  const m = m0.map((r) => r.slice());
  const nrows = m.length;
  const steps: GaussStep[] = [];
  const snap = (opTex: string) =>
    steps.push({ opTex, after: m.map((r) => r.slice()) });
  let row = 0;
  for (let col = 0; col < ncols - 1 && row < nrows; col++) {
    let p = -1;
    for (let r = row; r < nrows; r++)
      if (!fIsZero(m[r][col])) {
        p = r;
        break;
      }
    if (p === -1) continue;
    if (p !== row) {
      [m[row], m[p]] = [m[p], m[row]];
      snap(`R_{${row + 1}} \\leftrightarrow R_{${p + 1}}`);
    }
    const piv = m[row][col];
    if (!fIsOne(piv)) {
      const inv = fDiv(frac(1), piv);
      for (let c = 0; c < ncols; c++) m[row][c] = fMul(m[row][c], inv);
      snap(`R_{${row + 1}} \\leftarrow ${fSignedCoefTex(inv)}R_{${row + 1}}`);
    }
    for (let r = 0; r < nrows; r++) {
      if (r === row) continue;
      const f = m[r][col];
      if (fIsZero(f)) continue;
      for (let c = 0; c < ncols; c++) m[r][c] = fSub(m[r][c], fMul(f, m[row][c]));
      snap(
        `R_{${r + 1}} \\leftarrow R_{${r + 1}} ${f.n < 0 ? "+" : "-"} ${fCoefTex(f)}R_{${row + 1}}`
      );
    }
    row++;
  }
  return steps;
}

/** Augmented matrix as KaTeX: \left(\begin{array}{cc|c}...\end{array}\right). */
function matTex(m: Frac[][], ncols: number): string {
  const colSpec = "c".repeat(ncols - 1) + "|c";
  const body = m.map((r) => r.map(fTex).join(" & ")).join(" \\\\ ");
  return `\\left(\\begin{array}{${colSpec}} ${body} \\end{array}\\right)`;
}

function GaussSteg({ params }: { params: P }) {
  const t = useKtTheme();
  const flat = params.matrise as number[];
  const ncols = params.kolonner as number;

  const data = useMemo(() => {
    if (ncols < 2 || flat.length % ncols !== 0 || flat.length < ncols * 2)
      return null;
    const nrows = flat.length / ncols;
    const m0: Frac[][] = [];
    for (let r = 0; r < nrows; r++)
      m0.push(flat.slice(r * ncols, (r + 1) * ncols).map(fromNumber));
    return { m0, steps: gaussJordan(m0, ncols) };
  }, [flat, ncols]);

  const [idx, setIdx] = useState(0);

  if (!data) {
    return (
      <div className="kviz-widget" style={{ padding: 24, color: "var(--kt-wrong-ink)" }}>
        Ugyldig matrise: «matrise» må ha minst 2 rader og lengde delelig med «kolonner».
      </div>
    );
  }
  const { m0, steps } = data;
  const current = idx === 0 ? m0 : steps[idx - 1].after;
  const done = idx >= steps.length;

  return (
    <div className="kviz-widget" style={{ textAlign: "center" }}>
      <p className="kviz-formula" style={{ margin: "14px 0 6px", fontSize: "1.25em" }}>
        <KFormula tex={matTex(current, ncols)} />
      </p>
      <p style={{ minHeight: "1.8em", margin: "2px 0 6px", color: done ? t.accents.right.ink : t.text.muted, fontSize: 15 }}>
        {done ? (
          steps.length === 0 ? "Matrisen er allerede på redusert trappeform." : "Ferdig — redusert trappeform."
        ) : (
          <>
            Neste: <KFormula tex={steps[idx].opTex} />
          </>
        )}
      </p>
      <div style={{ display: "flex", justifyContent: "center" }}>
        <KReadout items={[{ label: "\\text{steg}", value: `${idx} av ${steps.length}` }]} />
      </div>
      <div className="kviz-widget-controls" style={{ justifyContent: "center", gap: 10 }}>
        <button className="kviz-btn" disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Forrige</button>
        <button className="kviz-btn kviz-btn--primary" disabled={done}
          onClick={() => setIdx((i) => Math.min(steps.length, i + 1))}>
          Neste →</button>
        <button className="kviz-btn" disabled={idx === 0}
          onClick={() => setIdx(0)}>Nullstill</button>
      </div>
    </div>
  );
}

registerTemplate({
  id: "gauss-steg",
  description:
    "Gauss-eliminasjon steg for steg: augmentert matrise som KaTeX, «Neste»-knapp utfører én radoperasjon om gangen (bytte, skalering, eliminasjon) helt til redusert trappeform. Widgeten beregner selv hele radoperasjonssekvensen — eksakt brøkregning, pene tall. For lineære likningssystemer og lineær algebra.",
  curriculum: ["universitet"],
  params: {
    matrise: {
      type: { kind: "numbers" },
      required: true,
      doc: "den augmenterte matrisen som flat radmajor-liste, f.eks. [[1,1,3],[1,-1,1]] skrives [1, 1, 3, 1, -1, 1]",
    },
    kolonner: {
      type: { kind: "number", min: 2, max: 8 },
      required: true,
      doc: "antall kolonner (siste kolonne er høyresiden/augmentert kolonne); listelengden må være delelig med dette",
    },
  },
  example: {
    template: "gauss-steg",
    title: "Gauss-eliminasjon steg for steg",
    params: { matrise: [1, 1, 3, 1, -1, 1], kolonner: 3 },
  },
  render: (params) => <GaussSteg params={params} />,
});

/* ============================================================ fikspunkt-steg */

function FikspunktSteg({ params }: { params: P }) {
  const t = useKtTheme();
  const g = useMemo(() => fn1(params.g as string), [params.g]);
  const x0 = params.x0 as number;
  const maks = params.maks as number;
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const [n, setN] = useState(0);

  /* the whole orbit, precomputed (stops at the first non-finite value) */
  const xs = useMemo(() => {
    const out = [x0];
    for (let i = 0; i < maks + 1; i++) {
      const next = g(out[i]);
      if (!Number.isFinite(next) || Math.abs(next) > 1e6) break;
      out.push(next);
    }
    return out;
  }, [g, x0, maks]);
  const maxN = Math.min(maks, xs.length - 1);
  const touch = t.accents.touch.stroke;

  /* cobweb segments for the n executed steps:
     (x_i, x_i) → (x_i, g(x_i)) → (g(x_i), g(x_i)) */
  const segs: [[number, number], [number, number]][] = [];
  for (let i = 0; i < n && i + 1 < xs.length; i++) {
    const a = xs[i];
    const b = xs[i + 1];
    segs.push([[a, a], [a, b]]);
    segs.push([[a, b], [b, b]]);
  }
  const xn = xs[Math.min(n, xs.length - 1)];
  const gxn = n + 1 < xs.length ? xs[n + 1] : g(xn);

  return (
    <div className="kviz-widget">
      <KPlot viewBox={view} height={(params.height as number) ?? 340}>
        <KCurve f={(x) => x} role="alt" weight="secondary" />
        <KCurve f={g} />
        {segs.map(([p1, p2], i) => (
          <MafsLine.Segment key={i} point1={p1} point2={p2} color={touch}
            weight={t.stroke.tangent} />
        ))}
        {Number.isFinite(gxn) && <KPoint point={[xn, gxn]} />}
      </KPlot>
      <div className="kviz-widget-controls" style={{ justifyContent: "center", gap: 10 }}>
        <KReadout
          items={[
            { label: "n", value: n, digits: 0 },
            { label: "x_n", value: xn, digits: 4, role: "touch" },
          ]}
        />
        <button className="kviz-btn kviz-btn--primary" disabled={n >= maxN}
          onClick={() => setN((i) => Math.min(maxN, i + 1))}>Neste →</button>
        <button className="kviz-btn" disabled={n === 0}
          onClick={() => setN(0)}>Nullstill</button>
      </div>
    </div>
  );
}

registerTemplate({
  id: "fikspunkt-steg",
  description:
    "Fikspunktiterasjon x_{n+1} = g(x_n) med «Neste»-knapp: kurven y = g(x), diagonalen y = x, og spindelvev-stien som vokser ett steg om gangen mot (eller bort fra) fikspunktet. Avlesning av n og x_n. For numeriske metoder, konvergens og fikspunkter.",
  curriculum: ["universitet"],
  params: {
    g: { type: { kind: "expr", vars: 1 }, required: true, doc: "iterasjonsfunksjonen g i x_{n+1} = g(x_n)" },
    x0: { type: { kind: "number" }, required: true, doc: "startverdien x_0" },
    viewX: { type: { kind: "range" }, default: [-0.5, 2], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-0.5, 2], doc: "y-utsnitt" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
    maks: { type: { kind: "number", min: 1, max: 60 }, default: 12, doc: "maks antall iterasjonssteg" },
  },
  example: {
    template: "fikspunkt-steg",
    title: "Fikspunktiterasjon for cos",
    params: { g: "cos(x)", x0: 1.4, viewX: [-0.3, 1.7], viewY: [-0.3, 1.7], maks: 14 },
  },
  render: (params) => <FikspunktSteg params={params} />,
});
