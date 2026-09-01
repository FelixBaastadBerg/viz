/** Template: Riemann sums — the play-with-it companion to the integral video.
 *
 * Chrome per Felix's design review (2026-08-30, round 6):
 * - an INTRO line above the graph introduces the widget (text + $latex$),
 * - readouts are ANCHORED, not floating: S_n sits inside the area it measures
 *   on a borderless plate; the exact integral sits in the figure's sky in the
 *   object colour (blue), next to the soft blue target area it names,
 * - no formula inside the figure (it lives in the intro), no n-readout (the
 *   slider is the readout), one font (CM), nothing overlapping the graph,
 * - Brilliant-scale lead slider under the plot.
 * Every chrome decision is a param, because the right answer differs per
 * widget (`readout`, `showTarget`, `snAt`, `exactAt`).
 */
import { useMemo, useState } from "react";
import { Polygon } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KCurve, useRoleColor } from "../../2d/primitives";
import { KFormula, KMixed, KFig, KLegend } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { fn1 } from "../expr";
import { sample, simpson } from "../../math";

type P = Record<string, unknown>;

function RiemannSum({ params }: { params: P }) {
  const t = useKtTheme();
  const f = fn1(params.f as string);
  const [a, b] = params.range as [number, number];
  const method = params.method as string;
  const readout = (params.readout as string) ?? "i-figuren";
  const showTarget = params.showTarget as boolean;
  const [n, setN] = useState(params.n0 as number);
  const view = { x: params.viewX as [number, number], y: params.viewY as [number, number] };
  const touch = useRoleColor("touch");
  const object = useRoleColor("object");

  const dx = (b - a) / n;
  const { rects, sn } = useMemo(() => {
    const rects: [number, number][][] = [];
    let sn = 0;
    for (let i = 0; i < n; i++) {
      const x0 = a + i * dx;
      const xi = method === "venstre" ? x0 : x0 + dx;
      const h = f(xi);
      sn += h * dx;
      rects.push([[x0, 0], [x0 + dx, 0], [x0 + dx, h], [x0, h]]);
    }
    return { rects, sn, meanH: sn / (b - a) };
  }, [f, a, b, n, dx, method]);

  const exact = useMemo(() => simpson(f, a, b, 256), [f, a, b]);
  const targetPts = useMemo<[number, number][]>(
    () => [[a, 0], ...sample(f, a, b, 128), [b, 0]],
    [f, a, b]
  );

  return (
    <div className="kviz-widget">
      {params.intro ? (
        <p className="kviz-intro"><KMixed text={params.intro as string} /></p>
      ) : null}

      <KFig
        legend={
          readout === "ingen" ? undefined : (
            <KLegend
              corner="tl"
              items={[
                { label: "S_n", value: sn, digits: 3, role: "touch" },
                { label: "\\int_a^b f(x)\\,dx", value: exact, digits: 3, role: "object" },
              ]}
            />
          )
        }
      >
        <KPlot viewBox={view} height={(params.height as number) ?? 340}>
          {showTarget && (
            <Polygon points={targetPts} color={object} fillOpacity={0.12}
              strokeOpacity={0} weight={0.1} />
          )}
          {rects.map((pts, i) => (
            <Polygon key={i} points={pts} color={touch}
              fillOpacity={t.fill.areaOpacity} weight={1.5} />
          ))}
          <KCurve f={f} />
        </KPlot>
      </KFig>

      <div className="kviz-widget-controls">
        <KFormula tex="n" />
        <input type="range" className="kviz-slider kviz-slider--lead"
          min={1} max={params.nMax as number} step={1} value={n}
          aria-label="antall rektangler"
          onChange={(e) => setN(Math.round(+e.target.value))} />
      </div>
    </div>
  );
}

registerTemplate({
  id: "riemann-sum",
  description:
    "Riemannsum under en graf med n-glider: rektanglene fyller det eksakte arealet, S_n står forankret i arealet og integralverdien i figuren. For integraldefinisjonen (R2/Kalkulus 1).",
  curriculum: ["R2", "universitet"],
  params: {
    f: { type: { kind: "expr", vars: 1 }, required: true, doc: "funksjonen, bør være ≥ 0 på intervallet" },
    intro: { type: { kind: "string" }, default: "", doc: "introtekst over figuren; $...$ blir KaTeX" },
    range: { type: { kind: "range" }, default: [0, 2], doc: "integrasjonsintervallet [a, b]" },
    method: { type: { kind: "string", oneOf: ["hoyre", "venstre"] }, default: "hoyre", doc: "endepunkt for f(x_i)" },
    readout: { type: { kind: "string", oneOf: ["i-figuren", "verdilinje", "ingen"] }, default: "i-figuren", doc: "W7: alt annet enn \"ingen\" viser S_n og integralverdien i legenden i figuren (\"verdilinje\" er utgått og behandles likt)" },
    showTarget: { type: { kind: "boolean" }, default: true, doc: "vis det eksakte arealet som svak blå flate bak rektanglene" },
    n0: { type: { kind: "number", min: 1, max: 200 }, default: 6, doc: "start-n" },
    nMax: { type: { kind: "number", min: 4, max: 200 }, default: 100, doc: "maks n på glideren" },
    snAt: { type: { kind: "numbers" }, default: undefined, doc: "utgått — ignoreres (W7: verdiene står i legenden); beholdt for bakoverkompatibilitet" },
    exactAt: { type: { kind: "numbers" }, default: undefined, doc: "utgått — ignoreres (W7); beholdt for bakoverkompatibilitet" },
    viewX: { type: { kind: "range" }, default: [-0.4, 2.4], doc: "x-utsnitt" },
    viewY: { type: { kind: "range" }, default: [-0.5, 4.5], doc: "y-utsnitt" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "riemann-sum",
    title: "Riemannsummer: flere rektangler, mindre feil",
    params: {
      f: "x^2",
      intro:
        "Vi ser på $f(x) = x^2$ på intervallet $[0, 2]$. Rektanglene har bredde $\\Delta x = 2/n$ og høyde $f(x_i)$. Dra i $n$: jo flere rektangler, jo nærmere kommer riemannsummen $S_n$ det eksakte arealet $\\int_0^2 f(x)\\,dx$.",
      range: [0, 2],
      n0: 6,
      nMax: 100,
      viewX: [-0.4, 2.4],
      viewY: [-0.5, 4.5],
    },
  },
  render: (params) => <RiemannSum params={params} />,
});
