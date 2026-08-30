/**
 * @kateter/viz gallery — every component, all three themes side by side,
 * live knobs. This page is the library's quality bar: if it renders clean in
 * all themes, a course page built from these parts will too.
 */
import { useMemo, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider, themes, loadThemeFonts,
  KPlot, KCurve, KTangent, KVector, KArea, KLabel, KPoint, type KDraggable,
  KPanel, KFormula, KReadout, KCaption, KSlider,
  KScene3D, KAxes3D, KSurface, KRegionColumn,
  QuizCard, PredictReveal, useQuiz, onQuizEvent, type QuizEvent,
  simpson, fmt, ddx,
} from "@kateter/viz";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../src/kviz.css";
import "./gallery.css";

Object.values(themes).forEach(loadThemeFonts);
const THEME_LIST = Object.values(themes);

/** One demo row: the same cell rendered inside all three ThemeProviders. */
function Demo({
  id,
  title,
  what,
  knobs,
  size,
  children,
}: {
  id: string;
  title: string;
  what: string;
  knobs?: ReactNode;
  size?: "tall" | "short";
  children: ReactNode;
}) {
  return (
    <section className="demo" id={id}>
      <h2>{title}</h2>
      <p className="what">{what}</p>
      {knobs && <div className="knobs">{knobs}</div>}
      <div className="cells">
        {THEME_LIST.map((t) => (
          <div key={t.name} className={`cell ${size ?? ""}`}>
            <div className="cell-title">{t.label}</div>
            <ThemeProvider theme={t}>{children}</ThemeProvider>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------------------------------------------- demo bodies */

const FUNCTIONS: Record<string, { f: (x: number) => number; tex: string }> = {
  "kubisk": { f: (x) => 0.1 * x ** 3 - x + 1, tex: "0{,}1x^3 - x + 1" },
  "sinus": { f: (x) => 2 * Math.sin(x), tex: "2\\sin x" },
  "parabel": { f: (x) => 0.4 * x * x - 2, tex: "0{,}4x^2 - 2" },
};

function CurveDemo({ fn, replayKey }: { fn: string; replayKey: number }) {
  const { f } = FUNCTIONS[fn];
  return (
    <KPlot viewBox={{ x: [-6, 6], y: [-4, 4] }}>
      <KCurve key={`${fn}-${replayKey}`} f={f} drawIn />
      <KCurve f={(x: number) => -f(x) * 0.5} role="alt" weight="secondary" />
    </KPlot>
  );
}

function PointDemo({ mode }: { mode: string }) {
  const f = (x: number) => 2 * Math.sin(x);
  const constrain: KDraggable =
    mode === "kurve" ? (x: number) => [x, f(x)] as [number, number] : (mode as KDraggable);
  return (
    <KPlot viewBox={{ x: [-5, 5], y: [-3.5, 3.5] }}>
      {mode === "kurve" && <KCurve f={f} />}
      <KPoint defaultPoint={[1, mode === "kurve" ? f(1) : 1]} constrain={constrain} />
    </KPlot>
  );
}

function TangentDemo({ x }: { x: number }) {
  const f = (x: number) => 0.1 * x ** 3 - x + 1;
  return (
    <KPlot viewBox={{ x: [-6, 6], y: [-4, 4] }}>
      <KCurve f={f} />
      <KTangent f={f} x={x} />
      <KLabel tex={`f'(${fmt(x, 1)}) = ${fmt(ddx(f, x), 2)}`} at={[x + 0.4, f(x) + 0.9]} role="touch" />
    </KPlot>
  );
}

function VectorDemo({ angle }: { angle: number }) {
  const a = (angle * Math.PI) / 180;
  const tip: [number, number] = [2.6 * Math.cos(a), 2.6 * Math.sin(a)];
  return (
    <KPlot viewBox={{ x: [-4, 4], y: [-3, 3] }}>
      <KVector tip={tip} />
      <KVector tip={[tip[0], 0]} role="alt2" />
      <KLabel tex="\vec{v}" at={[tip[0] + 0.35, tip[1] + 0.35]} role="alt" />
    </KPlot>
  );
}

function AreaDemo({ from, to }: { from: number; to: number }) {
  const f = (x: number) => 0.5 * x * x + 0.5;
  return (
    <KPlot viewBox={{ x: [-4, 4], y: [-1, 6] }}>
      <KCurve f={f} />
      <KArea f={f} from={from} to={to} />
      <KLabel
        tex={`\\int_{${fmt(from, 1)}}^{${fmt(to, 1)}} f = ${fmt(simpson(f, from, to), 2)}`}
        at={[(from + to) / 2, -0.6]}
        role="object"
      />
    </KPlot>
  );
}

function ChromeDemo({ v }: { v: number }) {
  return (
    <div style={{ position: "relative", height: "100%", background: "var(--kt-bg)" }}>
      <KPanel position="readout">
        <p className="kviz-formula">
          <KFormula tex="f(x) = ax^3 - x + 1" />
        </p>
        <KReadout
          items={[
            { label: "a", value: v, role: "touch" },
            { label: "f(2)", value: v * 8 - 1, role: "touch" },
          ]}
        />
        <KCaption>Panelet, avlesninger og glidere deler samme tokens.</KCaption>
      </KPanel>
    </div>
  );
}

function QuizDemoCell() {
  const f = (x: number) => x ** 3 / 3 - x + 1;
  const df = (x: number) => x * x - 1;
  const [x0, setX0] = useState(2.2);
  const quiz = useQuiz("gallery-quiz");
  const correct = Math.abs(df(x0)) < 0.08;
  const touched = x0 !== 2.2;
  return (
    <>
      <KPlot viewBox={{ x: [-4.5, 4.5], y: [-2.5, 4.5] }}>
        <KCurve f={f} />
        <KTangent f={f} df={df} x={x0} role={correct ? "right" : "touch"} />
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x: number) => [x, f(x)] as [number, number]}
          onMove={([x]: [number, number]) => {
            setX0(x);
            quiz.check(Math.abs(df(x)) < 0.08);
          }}
        />
      </KPlot>
      <QuizCard
        className="kviz-panel--readout"
        question="Dra punktet dit hvor $f'(x)=0$."
        status={correct ? "correct" : touched ? "incorrect" : "neutral"}
        feedback={
          correct
            ? "Riktig! Tangenten er vannrett."
            : touched
              ? `f′(x) = ${fmt(df(x0))} — ikke helt.`
              : "Dra i punktet for å begynne."
        }
      />
    </>
  );
}

function PredictDemo() {
  return (
    <div style={{ padding: 16, background: "var(--kt-bg)", height: "100%", overflow: "auto" }}>
      <PredictReveal
        prompt="Hva skjer med grafen til f(x) = x² når vi legger til 2?"
        choices={["Flytter opp", "Flytter ned", "Blir brattere"]}
        answer={0}
      >
        <div style={{ height: 220 }}>
          <KPlot viewBox={{ x: [-3, 3], y: [-1, 6] }} height={220}>
            <KCurve f={(x: number) => x * x} role="alt" weight="secondary" />
            <KCurve f={(x: number) => x * x + 2} drawIn />
          </KPlot>
        </div>
      </PredictReveal>
    </div>
  );
}

function SurfaceDemo({ withRegion }: { withRegion: boolean }) {
  const f = (x: number, y: number) => 2 + Math.sin(x) * Math.cos(y);
  return (
    <KScene3D camera="iso" floorGrid={3.4}>
      <KAxes3D xy={3.4} />
      <KSurface f={f} domain={3.4} />
      {withRegion && <KRegionColumn f={f} a={-2} b={1.5} c={-1.5} d={2} />}
    </KScene3D>
  );
}

/* ---------------------------------------------------------------- events */
function EventLog() {
  const [log, setLog] = useState<string[]>([]);
  useMemo(
    () =>
      onQuizEvent((e: QuizEvent) =>
        setLog((l) => [`${e.type}  ${JSON.stringify({ ...e, at: undefined, type: undefined })}`, ...l].slice(0, 8))
      ),
    []
  );
  return (
    <pre style={{ margin: 0, padding: "10px 14px", fontSize: 11.5, lineHeight: 1.6, overflow: "auto", maxHeight: 160 }}>
      {log.length ? log.join("\n") : "Interact with the quiz above — typed events appear here (the future game layer subscribes to exactly this stream)."}
    </pre>
  );
}

/* ------------------------------------------------------------------ page */
function Gallery() {
  const [fn, setFn] = useState("kubisk");
  const [replay, setReplay] = useState(0);
  const [mode, setMode] = useState("kurve");
  const [tx, setTx] = useState(1);
  const [angle, setAngle] = useState(35);
  const [from, setFrom] = useState(-1);
  const [to, setTo] = useState(2);
  const [chromeV, setChromeV] = useState(0.1);
  const [withRegion, setWithRegion] = useState(true);

  return (
    <>
      <header>
        <h1>@kateter/viz — component gallery</h1>
        <p>
          Every component rendered in all three Phase-0 design directions simultaneously
          (scoped theme providers — no iframes). Change a knob: all three update. Change a
          theme JSON: the whole system follows. Zero hard-coded visual values in components.
        </p>
      </header>
      <nav className="toc">
        {["KPlot+KCurve", "KPoint", "KTangent", "KVector", "KArea", "chrome", "QuizCard", "PredictReveal", "3D", "events"].map((s) => (
          <a key={s} href={`#${s}`}>{s}</a>
        ))}
      </nav>

      <Demo
        id="KPlot+KCurve"
        title="<KPlot> + <KCurve>"
        what="Stage, themed grid/axes, protagonist curve (role object, heaviest stroke) + secondary (role alt). Draw-in uses token durDraw + smooth easing."
        knobs={
          <>
            <label>
              f(x)
              <select value={fn} onChange={(e) => setFn(e.target.value)}>
                {Object.keys(FUNCTIONS).map((k) => (
                  <option key={k}>{k}</option>
                ))}
              </select>
            </label>
            <button onClick={() => setReplay((n) => n + 1)}>Replay draw-in</button>
          </>
        }
      >
        <CurveDemo fn={fn} replayKey={replay} />
      </Demo>

      <Demo
        id="KPoint"
        title="<KPoint>"
        what="Graphica's constraint-drag API, ported: unrestricted · horizontal · vertical · (x,y) ⇒ [x′,y′]. Keyboard: focus + arrow keys."
        knobs={
          <label>
            constraint
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              <option value="kurve">curve (x, y) ⇒ [x, f(x)]</option>
              <option value="unrestricted">unrestricted</option>
              <option value="horizontal">horizontal</option>
              <option value="vertical">vertical</option>
            </select>
          </label>
        }
      >
        <PointDemo mode={mode} />
      </Demo>

      <Demo
        id="KTangent"
        title="<KTangent> + <KLabel>"
        what="Tangent (one stroke tier lighter than the curve) with numeric fallback derivative; KaTeX label in Computer Modern at math coordinates."
        knobs={
          <label>
            x <input type="range" min={-4} max={4} step={0.1} value={tx} onChange={(e) => setTx(+e.target.value)} /> {fmt(tx, 1)}
          </label>
        }
      >
        <TangentDemo x={tx} />
      </Demo>

      <Demo
        id="KVector"
        title="<KVector>"
        what="Vectors in supporting-cast roles (alt / alt2)."
        knobs={
          <label>
            angle <input type="range" min={0} max={360} value={angle} onChange={(e) => setAngle(+e.target.value)} /> {angle}°
          </label>
        }
      >
        <VectorDemo angle={angle} />
      </Demo>

      <Demo
        id="KArea"
        title="<KArea>"
        what="Region under a curve, token fill opacity; label shows the Simpson value (math from src/math, unit-tested)."
        knobs={
          <>
            <label>
              from <input type="range" min={-3} max={1} step={0.1} value={from} onChange={(e) => setFrom(+e.target.value)} /> {fmt(from, 1)}
            </label>
            <label>
              to <input type="range" min={1} max={3.5} step={0.1} value={to} onChange={(e) => setTo(+e.target.value)} /> {fmt(to, 1)}
            </label>
          </>
        }
      >
        <AreaDemo from={from} to={to} />
      </Demo>

      <Demo
        id="chrome"
        title="<KPanel> + <KFormula> + <KReadout> + <KSlider>"
        what="Widget chrome: formula panel, tabular readouts in touch ink, token slider. Note the per-theme voice (Caveat captions in arv, glassy panel in nordlys)."
        knobs={
          <label>
            a <input type="range" min={-0.3} max={0.3} step={0.005} value={chromeV} onChange={(e) => setChromeV(+e.target.value)} /> {fmt(chromeV)}
          </label>
        }
      >
        <ChromeDemo v={chromeV} />
      </Demo>

      <Demo
        id="QuizCard"
        title="<QuizCard> + useQuiz"
        what="Question → manipulation → immediate feedback. Colour system encodes right/wrong; emits typed progress events."
      >
        <QuizDemoCell />
      </Demo>

      <Demo
        id="PredictReveal"
        title="<PredictReveal>"
        what="Predict-then-reveal: the student commits before seeing the evidence."
        size="tall"
      >
        <PredictDemo />
      </Demo>

      <Demo
        id="3D"
        title="<KScene3D> + <KAxes3D> + <KSurface> + <KRegionColumn>"
        what="3D stage with flat tone mapping (honest token hexes), CM canvas text, iso-parameter curves, translucency policy baked in. Drag to orbit."
        size="tall"
        knobs={
          <label>
            <input type="checkbox" checked={withRegion} onChange={(e) => setWithRegion(e.target.checked)} />
            show region column
          </label>
        }
      >
        <SurfaceDemo withRegion={withRegion} />
      </Demo>

      <section className="demo" id="events">
        <h2>Quiz event stream</h2>
        <p className="what">onQuizEvent(listener) — the seam the gamified universe subscribes to.</p>
        <div className="cells" style={{ gridTemplateColumns: "1fr" }}>
          <div className="cell short">
            <EventLog />
          </div>
        </div>
      </section>
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Gallery />);
