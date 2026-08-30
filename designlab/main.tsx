/**
 * Design lab v2 — riemann widget, round 2 (Felix: C-direction but anchored,
 * no floating; formula belongs in page text above, not in the widget;
 * Brilliant as styling reference — big friendly slider, calm whitespace).
 * One font (CM). Nothing over the graph. No instruction text, no n readout.
 */
import { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Polygon, LaTeX } from "mafs";
import {
  ThemeProvider, arv, loadThemeFonts, KPlot, KCurve, KFormula,
  useKtTheme, simpson, sample, fmt,
} from "@kateter/viz/core";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../src/kviz.css";
import "./lab.css";

loadThemeFonts(arv);

const f = (x: number) => 2.4 + 0.9 * Math.sin(1.1 * x - 0.4);
const A = 0.9, B = 5.5;
const VIEW = { x: [-0.3, 6.3] as [number, number], y: [-0.7, 4.3] as [number, number] };

function useRiemann(n: number) {
  return useMemo(() => {
    const dx = (B - A) / n;
    const rects: [number, number][][] = [];
    let sn = 0;
    for (let i = 0; i < n; i++) {
      const x0 = A + i * dx;
      const h = f(x0 + dx);
      sn += h * dx;
      rects.push([[x0, 0], [x0 + dx, 0], [x0 + dx, h], [x0, h]]);
    }
    return { rects, sn, exact: simpson(f, A, B, 256) };
  }, [n]);
}

function Rects({ rects }: { rects: [number, number][][] }) {
  const t = useKtTheme();
  return (
    <>
      {rects.map((pts, i) => (
        <Polygon key={i} points={pts} color={t.accents.touch.stroke}
          fillOpacity={t.fill.areaOpacity} weight={1.5} />
      ))}
    </>
  );
}

function BigSlider({ n, setN }: { n: number; setN: (v: number) => void }) {
  return (
    <div className="lab-slider lab-slider--big">
      <KFormula tex="n" />
      <input type="range" className="kviz-slider" min={1} max={200} step={1}
        value={n} onChange={(e) => setN(Math.round(+e.target.value))} />
    </div>
  );
}

/* ---- D · verdilinje: one calm centered values-line between plot & slider ---- */
function VariantD() {
  const [n, setN] = useState(6);
  const { rects, sn, exact } = useRiemann(n);
  const t = useKtTheme();
  return (
    <div className="lab-frame">
      <div className="lab-plot">
        <KPlot viewBox={VIEW}>
          <Rects rects={rects} />
          <KCurve f={f} />
        </KPlot>
      </div>
      <div className="lab-valueline">
        <span style={{ color: t.accents.touch.ink }}>
          <KFormula tex={`S_n = ${fmt(sn, 3)}`} />
        </span>
        <KFormula tex={`\\int_a^b f(x)\\,dx = ${fmt(exact, 3)}`} />
        <span className="lab-muted"><KFormula tex={`\\text{feil} = ${fmt(Math.abs(sn - exact), 3)}`} /></span>
      </div>
      <div className="lab-footer"><BigSlider n={n} setN={setN} /></div>
    </div>
  );
}

/* ---- E · forankret: S_n lives INSIDE the area it measures ---- */
function VariantE() {
  const [n, setN] = useState(6);
  const { rects, sn, exact } = useRiemann(n);
  const t = useKtTheme();
  return (
    <div className="lab-frame">
      <div className="lab-plot lab-plot--tall">
        <KPlot viewBox={VIEW}>
          <Rects rects={rects} />
          <KCurve f={f} />
          <LaTeX tex={`S_n = ${fmt(sn, 3)}`} at={[(A + B) / 2, 1.05]}
            color={t.accents.touch.ink} />
        </KPlot>
      </div>
      <div className="lab-valueline lab-valueline--right lab-muted">
        <KFormula tex={`\\int_a^b f(x)\\,dx = ${fmt(exact, 3)}`} />
        <KFormula tex={`\\text{feil} = ${fmt(Math.abs(sn - exact), 3)}`} />
      </div>
      <div className="lab-footer"><BigSlider n={n} setN={setN} /></div>
    </div>
  );
}

/* ---- F · fasit i figuren: exact area as soft blue target behind rects ---- */
function VariantF() {
  const [n, setN] = useState(6);
  const { rects, sn, exact } = useRiemann(n);
  const t = useKtTheme();
  const areaPts = useMemo<[number, number][]>(
    () => [[A, 0], ...sample(f, A, B, 96), [B, 0]], []);
  return (
    <div className="lab-frame">
      <div className="lab-plot lab-plot--tall">
        <KPlot viewBox={VIEW}>
          <Polygon points={areaPts} color={t.accents.object.stroke}
            fillOpacity={0.12} strokeOpacity={0} weight={0.1} />
          <Rects rects={rects} />
          <KCurve f={f} />
          <LaTeX tex={`S_n = ${fmt(sn, 3)}`} at={[(A + B) / 2, 1.05]}
            color={t.accents.touch.ink} />
          <LaTeX tex={`\\int_a^b f(x)\\,dx = ${fmt(exact, 3)}`} at={[4.95, 3.95]}
            color={t.accents.object.ink} />
        </KPlot>
      </div>
      <div className="lab-footer"><BigSlider n={n} setN={setN} /></div>
    </div>
  );
}

function Lab() {
  return (
    <main>
      <h1>Design-lab v2 · riemann-widgeten</h1>
      <p className="intro">
        Runde to: formelen er flyttet ut av widgeten (den hører hjemme i sideteksten rett
        over), verdiene er <em>forankret</em> i stedet for å flyte, og glideren har fått
        Brilliant-aktig størrelse. Fortsatt: én skrift, ingenting oppå grafen.
      </p>
      <p className="intro">Slik ville teksten over widgeten sett ut på siden:
        «Riemannsummen <KFormula tex="S_n = \sum f(x_i)\,\Delta x" /> er summen av
        rektanglene. Dra i <KFormula tex="n" /> og se hvor fort den treffer integralet.»
      </p>

      <section>
        <h2>D · Verdilinje</h2>
        <p>Én rolig, sentrert verdilinje mellom graf og glider. Strukturert, men panelfritt.</p>
        <ThemeProvider theme={arv}><VariantD /></ThemeProvider>
      </section>

      <section>
        <h2>E · Forankret</h2>
        <p><KFormula tex="S_n" /> bor <em>inni</em> arealet det måler; integralet og feilen
          står stille og rolig under grafen til høyre.</p>
        <ThemeProvider theme={arv}><VariantE /></ThemeProvider>
      </section>

      <section>
        <h2>F · Fasit i figuren</h2>
        <p>Som E, men fasiten er synlig: det eksakte arealet ligger som en svak blå flate bak
          rektanglene (samme visuelle språk som akt 1 i videoen) — du <em>ser</em> feilen
          krympe, og integralverdien står i det blå hjørnet.</p>
        <ThemeProvider theme={arv}><VariantF /></ThemeProvider>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Lab />);
