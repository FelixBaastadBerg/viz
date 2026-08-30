/**
 * SHOWCASE — «Normaliserende flyt»: a Gaussian morphing into a trimodal
 * target distribution, as an exact 1D normalizing flow (increasing
 * rearrangement + displacement interpolation — see src/math/flow1d.ts for the
 * stated discretisation). Time scrubber, play, forward/inverse direction,
 * live density probe under the cursor, KL(p_t‖q) readout, and a spacetime
 * ribbon of quantile trajectories.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Plot, Polyline, Point as MafsPoint } from "mafs";
import {
  ThemeProvider, KPlot, KPoint, KPanel, KFormula, KCaption, KSlider,
  useKtTheme, glowFilter, smooth, fmt,
} from "@kateter/viz/core";
import { buildFlow1D, gauss, mixture, type Flow1D } from "../src/math/flow1d";
import { bootTheme } from "./shared";

const theme = bootTheme();

const LO = -4.5, HI = 4.5, N = 1025;
const STRIDE = 4; // display stride for SVG polylines (math stays at N)
const p0 = gauss(0, 1);
const target = mixture([
  { w: 0.45, mu: -1.6, sigma: 0.35 },
  { w: 0.2, mu: 0.2, sigma: 0.25 },
  { w: 0.35, mu: 1.5, sigma: 0.5 },
]);

const BAND_TOP = -0.16, BAND_BOTTOM = -0.72;
const bandY = (t: number) => BAND_TOP + (BAND_BOTTOM - BAND_TOP) * t;
const QUANTILES = [0.03, 0.08, 0.15, 0.25, 0.35, 0.45, 0.5, 0.55, 0.65, 0.75, 0.85, 0.92, 0.97];

function useFlow(direction: "forward" | "inverse"): Flow1D {
  return useMemo(
    () =>
      direction === "forward"
        ? buildFlow1D(p0, target, LO, HI, N)
        : buildFlow1D(target, p0, LO, HI, N),
    [direction]
  );
}

function quantileIndices(flow: Flow1D): number[] {
  // grid indices whose CDF levels are closest to QUANTILES (p0 of that flow)
  const { xs } = flow;
  const h = (HI - LO) / (N - 1);
  // rebuild the source cdf cheaply from the curve at t=0
  const { p } = flow.curve(0);
  const F = new Float64Array(N);
  for (let i = 1; i < N; i++) F[i] = F[i - 1] + ((p[i - 1] + p[i]) / 2) * h;
  for (let i = 0; i < N; i++) F[i] /= F[N - 1];
  return QUANTILES.map((q) => {
    let a = 0, b = N - 1;
    while (b - a > 1) {
      const m = (a + b) >> 1;
      if (F[m] < q) a = m;
      else b = m;
    }
    return a;
  });
}

function Explorer() {
  const t = useKtTheme();
  const [dir, setDir] = useState<"forward" | "inverse">("forward");
  const [tt, setTt] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [probeX, setProbeX] = useState(0.6);
  const flow = useFlow(dir);

  // play loop: ping-pong 0→1→0 with the token smooth easing
  const playRef = useRef(playing);
  playRef.current = playing;
  useEffect(() => {
    let raf = 0;
    const period = t.motion.durDraw * 2.4;
    let start: number | null = null;
    let base = tt;
    const tick = (now: number) => {
      if (!playRef.current) return;
      if (start === null) start = now - ((base % 1) * period) / 1;
      const phase = ((now - start) / period) % 2;
      const lin = phase < 1 ? phase : 2 - phase;
      setTt(smooth(lin));
      raf = requestAnimationFrame(tick);
    };
    if (playing) raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, dir, t.motion.durDraw]);

  const { y, p } = useMemo(() => flow.curve(tt), [flow, tt]);
  const curvePts = useMemo(() => {
    // resample onto a uniform display grid: where T stretches space the raw
    // samples spread out and stride-sampling would draw visible chords
    const M = Math.floor(N / STRIDE) * 2;
    const pts: [number, number][] = [];
    let j = 0;
    for (let k = 0; k <= M; k++) {
      const yq = LO + ((HI - LO) * k) / M;
      while (j < N - 2 && y[j + 1] < yq) j++;
      const span = y[j + 1] - y[j];
      const w = span > 1e-15 ? Math.min(Math.max((yq - y[j]) / span, 0), 1) : 0;
      pts.push([yq, p[j] + w * (p[j + 1] - p[j])]);
    }
    return pts;
  }, [y, p]);

  const qIdx = useMemo(() => quantileIndices(flow), [flow]);
  const trajectories = useMemo(
    () =>
      qIdx.map((i) => {
        const pts: [number, number][] = [];
        for (let s = 0; s <= 40; s++) {
          pts.push([flow.mapAt(s / 40, i), bandY(s / 40)]);
        }
        return pts;
      }),
    [flow, qIdx]
  );

  const kl = useMemo(() => flow.kl(tt), [flow, tt]);
  const source = dir === "forward" ? p0 : target;
  const dest = dir === "forward" ? target : p0;
  const pProbe = flow.densityAt(tt, probeX);

  const objectC = t.accents.object.stroke;
  const altC = t.accents.alt.stroke;
  const alt2C = t.accents.alt2.stroke;
  const touchC = t.accents.touch.stroke;

  return (
    <>
      <KPlot viewBox={{ x: [LO, HI], y: [-0.8, 0.92] }} axes={false}>
        {/* x-axis line only (the ribbon lives below it) */}
        <Polyline points={[[LO, 0], [HI, 0]]} color={t.structure.axis} weight={t.stroke.axis} />
        {/* source & destination as context, dashed */}
        <g style={{ opacity: 0.45 }}>
          <Plot.OfX y={source} color={alt2C} weight={t.stroke.curveSecondary} style="dashed" />
        </g>
        <g style={{ opacity: 0.8 }}>
          <Plot.OfX y={dest} color={altC} weight={t.stroke.curveSecondary} style="dashed" />
        </g>
        {/* the flowing density */}
        <g style={{ filter: glowFilter(t, objectC) }}>
          <Polyline points={curvePts} color={objectC} weight={t.stroke.curvePrimary} />
        </g>
        {/* spacetime ribbon: quantile trajectories + current time markers */}
        <g style={{ opacity: 0.35 }}>
          {trajectories.map((pts, i) => (
            <Polyline key={i} points={pts} color={touchC} weight={1.5} />
          ))}
        </g>
        {qIdx.map((i, k) => (
          <MafsPoint key={k} x={flow.mapAt(tt, i)} y={bandY(tt)} color={touchC} />
        ))}
        {/* density probe — drag along the current curve */}
        <KPoint
          point={[probeX, pProbe]}
          constrain={(x) => [Math.min(Math.max(x, LO), HI), flow.densityAt(tt, Math.min(Math.max(x, LO), HI))]}
          onMove={([x]) => setProbeX(x)}
        />
      </KPlot>

      <KPanel position="readout" fadeInDelay={300}>
        <p className="kviz-formula">
          <KFormula
            tex={`p_t = (T_t)_{\\#}\\,p_0, \\qquad D_{\\mathrm{KL}}(p_t \\,\\|\\, q) = ${fmt(kl, 4)}`}
          />
        </p>
        <p className="kviz-readout">
          <span>t = <span className="kviz-value">{fmt(tt, 2)}</span></span>
          <span>x = <span className="kviz-value">{fmt(probeX, 2)}</span></span>
          <span>
            p<sub>t</sub>(x) = <span className="kviz-value">{fmt(pProbe, 3)}</span>
          </span>
          <span>q(x) = <span className="kviz-value">{fmt(dest(probeX), 3)}</span></span>
        </p>
        <KCaption>
          {dir === "forward"
            ? "Normalfordelingen flyter til målfordelingen. Dra punktet for å lese av tettheten; båndet under aksen viser kvantilbanene."
            : "Invers retning: målfordelingen normaliseres tilbake til N(0,1)."}
        </KCaption>
      </KPanel>

      <KPanel position="controls" fadeInDelay={300}>
        <KSlider label="t" min={0} max={1} step={0.005} value={tt}
          onChange={(v) => { setPlaying(false); setTt(v); }} />
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button className="kviz-choice" onClick={() => setPlaying((s) => !s)}>
            {playing ? "⏸ Pause" : "▶ Spill av"}
          </button>
          <button
            className="kviz-choice"
            onClick={() => {
              setDir((d) => (d === "forward" ? "inverse" : "forward"));
              setTt(0);
            }}
          >
            {dir === "forward" ? "⇄ Invers retning" : "⇄ Fremover"}
          </button>
        </div>
      </KPanel>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme} fill>
    <Explorer />
  </ThemeProvider>
);
