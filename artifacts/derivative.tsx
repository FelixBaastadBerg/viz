/**
 * Phase-0 artifact #1 rebuilt ON the library: derivative / tangent explorer.
 * Everything visual comes from the theme; the page is ~60 lines of intent.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider, KPlot, KCurve, KTangent, KPoint,
  KPanel, KFormula, KReadout, KCaption, KSlider,
  useKtTheme, useTexColor, ddx,
} from "@kateter/viz/core";
import { bootTheme } from "./shared";

const theme = bootTheme();

function Explorer() {
  const t = useKtTheme();
  const color = useTexColor();
  const [a, setA] = useState(0.1);
  const [x0, setX0] = useState(1);
  const f = (x: number) => a * x ** 3 - x + 1;
  const df = (x: number) => 3 * a * x ** 2 - 1;

  return (
    <>
      <KPlot viewBox={{ x: [-6, 6], y: [-4, 4] }}>
        <KCurve f={f} drawIn delay={150} />
        <KTangent f={f} df={df} x={x0} fadeIn delay={900} />
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => setX0(x)}
          fadeIn
          delay={900}
        />
      </KPlot>

      <KPanel position="readout" fadeInDelay={1100}>
        <p className="kviz-formula">
          <KFormula tex={`f(x) = ${color("touch", "a")}\\,x^3 - x + 1`} />
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

      <KPanel position="controls" fadeInDelay={1100}>
        <KSlider label="a" min={-0.3} max={0.3} step={0.005} value={a} onChange={setA} />
      </KPanel>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme} fill>
    <Explorer />
  </ThemeProvider>
);
