/** Template: exponential growth/decay (1T/S1 workhorse). */
import { useState } from "react";
import { KPlot } from "../../2d/KPlot";
import { KCurve, KPoint, KLabel } from "../../2d/primitives";
import { KPanel, KFormula, KReadout, KSlider } from "../../chrome";
import { registerTemplate } from "../registry";
import { fmt } from "../../math";

type P = Record<string, unknown>;

function EksponentiellVekst({ params }: { params: P }) {
  const [b0, setB0] = useState(params.b0 as number);
  const [k, setK] = useState(params.k as number);
  const f = (x: number) => b0 * k ** x;
  const [x0, setX0] = useState(2);
  const doubling = k > 1 ? Math.log(2) / Math.log(k) : k < 1 ? Math.log(0.5) / Math.log(k) : NaN;
  const xMax = params.xMax as number;
  return (
    <>
      <KPlot
        viewBox={{ x: [-0.5, xMax], y: [-b0 * 0.4, b0 * Math.max(k ** xMax, 1.4) * 1.08] }}
        height={(params.height as number) ?? 340}
      >
        <KCurve f={f} />
        <KPoint point={[x0, f(x0)]} constrain={(x) => [Math.max(x, 0), f(Math.max(x, 0))]} onMove={([x]) => setX0(x)} />
        {Number.isFinite(doubling) && (
          <KLabel
            tex={k > 1 ? `\\text{doblingstid} \\approx ${fmt(doubling, 2)}` : `\\text{halveringstid} \\approx ${fmt(doubling, 2)}`}
            at={[xMax * 0.55, b0 * Math.max(k ** xMax, 1.4) * 0.92]}
            role="alt"
          />
        )}
      </KPlot>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex={`B(x) = ${fmt(b0, 1)} \\cdot ${fmt(k, 2)}^{\\,x}`} />
        </p>
        <KReadout
          items={[
            { label: "x", value: x0, role: "touch" },
            { label: "B(x)", value: f(x0), role: "touch" },
          ]}
        />
      </KPanel>
      <KPanel position="controls">
        <KSlider label="B_0" min={1} max={10} step={0.5} value={b0} onChange={setB0} digits={1} />
        <KSlider label="k" min={0.5} max={1.8} step={0.01} value={k} onChange={setK} />
      </KPanel>
    </>
  );
}

registerTemplate({
  id: "eksponentiell-vekst",
  description:
    "Eksponentiell vekst/nedgang B₀·kˣ med glidere for startverdi og vekstfaktor, dragbart punkt og doblings-/halveringstid. For eksponentialfunksjoner og prosentvis vekst.",
  curriculum: ["1T", "S1"],
  params: {
    b0: { type: { kind: "number", min: 0.1 }, default: 4, doc: "startverdi B₀" },
    k: { type: { kind: "number", min: 0.1, max: 3 }, default: 1.25, doc: "vekstfaktor (start)" },
    xMax: { type: { kind: "number", min: 3, max: 30 }, default: 8, doc: "x-aksens lengde" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 340, doc: "høyde i px — kompakt i løsninger (W6)" },
  },
  example: {
    template: "eksponentiell-vekst",
    title: "Eksponentiell vekst",
    params: { b0: 4, k: 1.25, xMax: 8 },
  },
  render: (params) => <EksponentiellVekst params={params} />,
});
