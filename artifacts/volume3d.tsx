/**
 * Phase-0 artifact #3 rebuilt ON the library: volume under a surface
 * (double integral, Calculus 2).
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider, KScene3D, KAxes3D, KSurface, KRegionColumn,
  KPanel, KFormula, KCaption, KSlider, useTexColor, useIntro,
  simpson2d, fmt, useKtTheme,
} from "@kateter/viz";
import { bootTheme } from "./shared";

const theme = bootTheme();

const DOMAIN = 3.4;
const GAP = 0.4;
const f = (x: number, y: number) => 2 + Math.sin(x) * Math.cos(y);

function Volume() {
  const t = useKtTheme();
  const color = useTexColor();
  const [a, setA] = useState(-2);
  const [b, setB] = useState(1.5);
  const [c, setC] = useState(-1.5);
  const [d, setD] = useState(2);
  const V = simpson2d(f, a, b, c, d);

  const draw = useIntro(t.motion.durDraw, 150);
  const regionFade = useIntro(t.motion.durFade, 950);

  return (
    <>
      <KScene3D camera="iso" floorGrid={DOMAIN}>
        <KAxes3D xy={DOMAIN} />
        <KSurface f={f} domain={DOMAIN} draw={draw} />
        {regionFade > 0.01 && (
          <KRegionColumn f={f} a={a} b={b} c={c} d={d} opacity={regionFade} />
        )}
      </KScene3D>

      <KPanel position="readout" fadeInDelay={1250}>
        <p className="kviz-formula">
          <KFormula
            tex={`V=\\iint_{R} ${color("object", "f(x,y)")}\\,dA,\\quad ${color(
              "object",
              "f(x,y)=2+\\sin x\\,\\cos y"
            )}`}
          />
        </p>
        <p className="kviz-readout">
          <span>
            <KFormula tex="R" /> = [<span className="kviz-value">{fmt(a)}</span>,{" "}
            <span className="kviz-value">{fmt(b)}</span>] × [
            <span className="kviz-value">{fmt(c)}</span>,{" "}
            <span className="kviz-value">{fmt(d)}</span>]
          </span>
          <span>
            V ≈ <span className="kviz-value">{fmt(V, 3)}</span>
          </span>
        </p>
        <KCaption>Dra for å rotere, rull for å zoome. Juster området R med gliderne.</KCaption>
      </KPanel>

      <KPanel position="controls" fadeInDelay={1250}>
        <KSlider label="a" min={-DOMAIN} max={DOMAIN - GAP} step={0.05} value={a}
          onChange={(v) => { setA(v); if (v > b - GAP) setB(v + GAP); }} />
        <KSlider label="b" min={-DOMAIN + GAP} max={DOMAIN} step={0.05} value={b}
          onChange={(v) => { setB(v); if (v < a + GAP) setA(v - GAP); }} />
        <KSlider label="c" min={-DOMAIN} max={DOMAIN - GAP} step={0.05} value={c}
          onChange={(v) => { setC(v); if (v > d - GAP) setD(v + GAP); }} />
        <KSlider label="d" min={-DOMAIN + GAP} max={DOMAIN} step={0.05} value={d}
          onChange={(v) => { setD(v); if (v < c + GAP) setC(v - GAP); }} />
      </KPanel>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme} fill>
    <Volume />
  </ThemeProvider>
);
