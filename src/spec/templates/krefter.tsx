/** Template: balance the forces (likevekt). Felix 2026-10-15, after Brilliant's «Balance the forces», in our widget
    style. The student drags the orange force until the sum of the forces is zero — and that IS the solution: no «Sjekk»
    button, the widget notices («bevege armen til summen = 0 og da har man … løst widgeten»).
    Chrome as the LU machine (Felix: «LU widgeten … ser veldig mye bedre ut»): one card top left with the forces and
    their sum as a small aligned calculation, the figure on the stage, then the centred pill row. Text kept to the
    three W17 voices (Felix 2026-10-15: «det er nettopp når det blir mye tekst i en widget at det blir stygt»): the
    card, readout labels on the arrows, and one centred caps status — the goal before, «LIKEVEKT» after — with a caps
    step counter. The instruction sentence belongs in the page text above the widget. Brilliant ideas (viz/BRILLIANT-INSPIRASJON.md): steps inside the widget («steg 1 av
    3»), a hint that is a mark on the figure (not more text), a short orange pulse when it balances, and the force
    polygon shown only as the «aha» once the last step is solved. Colours follow the video order (V53): fixed F₁ blue,
    fixed F₂ yellow, the force you drag orange, the sum ΣF in ink. */
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { Circle, Point, Polygon, Vector } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KPoint, KLabel } from "../../2d/primitives";
import { KFig, KFormula } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import type { KtRole } from "../../theme/types";
import { registerTemplate } from "../registry";
import { emitQuizEvent } from "../../quiz/events";

type P = Record<string, unknown>;
type V2 = [number, number];
interface Step {
  fixed: V2[];
  start: V2;
}

/** A label just past a vector's tip, pushed out along the vector so it never sits on the arrow head. */
function past(tip: V2, d = 0.5): V2 {
  const r = Math.hypot(tip[0], tip[1]) || 1;
  return [tip[0] + (tip[0] / r) * d, tip[1] + (tip[1] / r) * d];
}
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];
const num = (v: number, d = 1) => (Math.abs(v) < 0.5 * 10 ** -d ? 0 : v).toFixed(d);
const pairs = (flat: number[]): V2[] => {
  const out: V2[] = [];
  for (let k = 0; k + 1 < flat.length; k += 2) out.push([flat[k], flat[k + 1]]);
  return out;
};

/** The built-in progression (Brilliant: «one small mental leap» per step). */
const STEPS: Step[] = [
  { fixed: [[-3, 0]], start: [1.6, 1.6] }, // straight against
  { fixed: [[-2.6, -1.4]], start: [1.6, 0.8] }, // at a slant
  { fixed: [[-2.8, -0.4], [0.8, -2.0]], start: [1.0, 0.6] }, // three forces
];

// layout inline: hosts like TipTap's `div[data-node-view-wrapper] div { display/flex: inherit }` override classes
const CARD: CSSProperties = {
  position: "absolute", top: 10, left: 12, zIndex: 2, display: "flex", flexDirection: "column", alignItems: "flex-start",
  gap: 6, width: "max-content", maxWidth: "calc(100% - 24px)", boxSizing: "border-box", padding: "10px 14px 12px",
  borderRadius: 10, background: "var(--kt-bg-panel)", pointerEvents: "none", textAlign: "left",
};
const CTRL: CSSProperties = { display: "flex", flexDirection: "row", flexWrap: "wrap", justifyContent: "center", alignItems: "center", gap: 8, width: "auto" };

function Kraftbalanse({ params }: { params: P }) {
  const t = useKtTheme();
  const roles: KtRole[] = ["object", "alt"]; // F₁ blue, F₂ yellow
  const tol = params.toleranse as number;
  const snap = params.snap as number;
  const quizId = params.quizId as string;
  const half = params.utsnitt as number;
  const steps: Step[] =
    params.steg === true
      ? STEPS
      : [{ fixed: pairs(params.faste as number[]), start: params.dra as V2 }];

  const [si, setSi] = useState(0); // current step
  const step = steps[si];
  const [f, setF] = useState<V2>(step.start);
  const [moved, setMoved] = useState(false);
  const [solved, setSolved] = useState<boolean[]>(() => steps.map(() => false));
  const [hint, setHint] = useState(false);
  const [pulse, setPulse] = useState(0); // 0…1 while the «balanced» ring expands
  const reported = useRef(false);

  const fixed = step.fixed;
  const n = fixed.length + 1; // the dragged force is F_n
  const sum = fixed.reduce<V2>((s, v) => add(s, v), f);
  const size = Math.hypot(sum[0], sum[1]);
  const balanced = moved && size <= tol;
  const target: V2 = [f[0] - sum[0], f[1] - sum[1]]; // where the tip must go
  const done = solved[si];
  const last = si === steps.length - 1;

  // solving = dragging the sum to zero (no «Sjekk»): mark the step, pulse, report the widget once the last step is done
  useEffect(() => {
    if (!balanced || done) return;
    setSolved((s) => s.map((v, k) => (k === si ? true : v)));
    setHint(false);
    let raf = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - t0) / 700);
      setPulse(p);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    emitQuizEvent({ type: "quiz:attempt", quizId, correct: true, attempt: 1, at: Date.now() });
    if (last && !reported.current) {
      reported.current = true;
      emitQuizEvent({ type: "quiz:correct", quizId, attempts: 1, at: Date.now() });
    }
    return () => cancelAnimationFrame(raf);
  }, [balanced, done, si, last, quizId]);

  const goTo = (k: number) => {
    setSi(k);
    setF(steps[k].start);
    setMoved(false);
    setHint(false);
    setPulse(0);
  };
  const reset = () => {
    setF(step.start);
    setMoved(false);
    setHint(false);
    setPulse(0);
    setSolved((s) => s.map((v, k) => (k === si ? false : v)));
  };

  const col = (role: KtRole) => t.accents[role].ink;
  const rowsTex = [
    ...fixed.map((v, k) => `{\\color{${col(roles[k])}}\\vec F_${k + 1}} & = (${num(v[0])},\\ ${num(v[1])})`),
    `{\\color{${col("touch")}}\\vec F_${n}} & = (${num(f[0])},\\ ${num(f[1])})`,
    `\\hline \\Sigma \\vec F & = (${num(sum[0])},\\ ${num(sum[1])})`,
    `|\\Sigma \\vec F| & = ${balanced ? `{\\color{${col("touch")}}0}` : num(size, 2)}`,
  ];
  const chain: V2[] = [[0, 0]];
  for (const v of [...fixed, f]) chain.push(add(chain[chain.length - 1], v));
  const showPolygon = done && fixed.length > 1; // the «aha»: the forces tip to tail close up
  const w = t.stroke.curveSecondary;
  const ink = t.text.primary;
  const inView = (p: V2): V2 => [
    Math.max(-half + 0.35, Math.min(half - 0.35, p[0])),
    Math.max(-half * 0.55 + 0.3, Math.min(half * 0.55 - 0.3, p[1])),
  ];

  // W17: one centred caps status — the goal until it balances, then the result (the hint lives on the figure)
  const status = done ? (params.riktig as string) : (params.oppgave as string);

  return (
    <div className="kviz-widget kviz-kraft">
      <KFig
        legend={
          <div className="kviz-forcecard" style={CARD}>
            <span className="kviz-forcecard-h" style={{ display: "block" }}>
              {params.korttittel as string}
            </span>
            <KFormula tex={`\\begin{array}{rl} ${rowsTex.join(" \\\\ ")} \\end{array}`} />
          </div>
        }
      >
        <KPlot
          viewBox={{ x: [-half, half], y: [-half * 0.55, half * 0.55] }}
          aspect="equal"
          axes={false}
          height={(params.height as number) ?? 320}
        >
          {showPolygon ? (
            <>
              {/* a solid lighter field (V54 value fields) — orange is never translucent over the grey stage (it reads brown) */}
              <Polygon points={chain} color={t.stage.panelRaised} fillOpacity={1} strokeOpacity={0} />
              {/* the moved copies tip to tail: dashed in full colour (never faded — faded orange on grey goes muddy) */}
              {fixed.slice(1).map((v, k) => (
                <Vector key={k} tail={chain[k + 1]} tip={chain[k + 2]} color={t.accents[roles[k + 1]].stroke} weight={2} style="dashed" />
              ))}
              <Vector tail={chain[n - 1]} tip={chain[n]} color={t.accents.touch.stroke} weight={2} style="dashed" />
            </>
          ) : null}
          {hint && !done ? (
            // the hint is a mark on the figure (Brilliant): a dashed arrow from the tip to where it must go
            <g style={{ opacity: 0.9 }}>
              <Vector tail={f} tip={target} color={t.accents.touch.stroke} weight={2.2} style="dashed" />
              <Circle center={target} radius={0.22} color={t.accents.touch.stroke} fillOpacity={0} strokeStyle="dashed" weight={2} />
            </g>
          ) : null}
          {fixed.map((v, k) => (
            <Vector key={k} tip={v} color={t.accents[roles[k]].stroke} weight={w} />
          ))}
          <Vector tip={f} color={t.accents.touch.stroke} weight={w} />
          {size > 0.06 ? <Vector tip={sum} color={ink} weight={t.stroke.tangent} /> : null}
          {pulse > 0 && pulse < 1 ? (
            <Circle
              center={[0, 0]}
              radius={0.2 + 1.1 * pulse}
              color={t.accents.touch.stroke}
              fillOpacity={0}
              strokeOpacity={0.7 * (1 - pulse)}
              weight={3}
            />
          ) : null}
          <Point x={0} y={0} color={balanced ? t.accents.touch.stroke : ink} />
          <KPoint
            point={f}
            constrain={(x, y) => [Math.round(x / snap) * snap, Math.round(y / snap) * snap]}
            onMove={(p) => {
              setF(p);
              setMoved(true);
            }}
            role="touch"
          />
          {fixed.map((v, k) => (
            <KLabel key={k} tex={`\\vec F_${k + 1}`} at={inView(past(v))} role={roles[k]} />
          ))}
          <KLabel tex={`\\vec F_${n}`} at={inView(past(f, 0.6))} role="touch" />
          {size > 0.06 ? <KLabel tex="\Sigma \vec F" at={inView(past(sum, 0.45))} /> : null}
        </KPlot>
      </KFig>

      <div className="kviz-widget-controls lu-ctrl" style={CTRL}>
        {steps.length > 1 ? (
          <button className="kviz-btn lu-pill" disabled={si === 0} onClick={() => goTo(si - 1)}>
            ← Forrige
          </button>
        ) : null}
        {steps.length > 1 && !last ? (
          <button className="kviz-btn kviz-btn--primary lu-pill lu-main" disabled={!done} onClick={() => goTo(si + 1)}>
            Neste steg →
          </button>
        ) : (
          <button className="kviz-btn lu-pill" disabled={done || hint} onClick={() => setHint(true)}>
            Vis hint
          </button>
        )}
        {steps.length > 1 && !last ? (
          <button className="kviz-btn lu-pill" disabled={done || hint} onClick={() => setHint(true)}>
            Vis hint
          </button>
        ) : null}
        <button className="kviz-btn lu-pill" disabled={!moved} onClick={reset}>
          Nullstill
        </button>
      </div>
      <p className={done ? "kviz-capline is-done" : "kviz-capline"} aria-live="polite">
        {status}
      </p>
      {steps.length > 1 ? <p className="kviz-capline is-small">{`steg ${si + 1} / ${steps.length}`}</p> : null}
    </div>
  );
}

registerTemplate({
  id: "kraftbalanse",
  description:
    "Likevekt: én eller to krefter ligger fast, eleven drar den siste til summen blir null — det er løsningen (ingen «Sjekk»). Kort oppe til venstre med kreftene og summen som en liten utregning; LU-maskinens kontrollrad (Vis hint / Nullstill, eller Forrige / Neste steg i stegmodus) og én sentrert versal-status (W17: målet før, «LIKEVEKT» etter; instruksjonen står i sideteksten over). Hint = stiplet pil på figuren; oransje puls ved likevekt; kraftpolygonet vises når siste steg er løst. `steg: true` gir tre innebygde steg (rett imot → på skrå → tre krefter). Emitterer quiz:correct når siste steg er løst.",
  curriculum: ["R1", "FY1", "TMA4400"],
  params: {
    faste: { type: { kind: "numbers" }, default: [-3, -1.2], doc: "de faste kreftene, flatt: [x1, y1] eller [x1, y1, x2, y2]" },
    dra: { type: { kind: "numbers" }, default: [2.2, 1.6], doc: "startpunktet for kraften eleven drar [x, y]" },
    steg: { type: { kind: "boolean" }, default: false, doc: "tre innebygde steg i stedet for én oppgave" },
    toleranse: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.12, doc: "|ΣF| som godtas som null" },
    snap: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.1, doc: "kraften fester seg til dette rutenettet" },
    utsnitt: { type: { kind: "number", min: 2, max: 12 }, default: 4.6, doc: "halv bredde av utsnittet" },
    korttittel: { type: { kind: "string" }, default: "Kreftene", doc: "merkelappen på kortet" },
    oppgave: { type: { kind: "string" }, default: "Mål · summen = 0", doc: "sentrert versal-status før likevekt — ett til tre ord, ingen setning (W17); instruksjonen står i sideteksten" },
    riktig: { type: { kind: "string" }, default: "Likevekt", doc: "sentrert versal-status når det er i likevekt (oransje)" },
    quizId: { type: { kind: "string" }, default: "kraftbalanse", doc: "id i quiz:correct-hendelsen (verten krysser av «widget»)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 320, doc: "høyde i px" },
  },
  quizValue: "ingen (widgeten oppdager likevekt selv og sender quiz:correct)",
  example: { template: "kraftbalanse", title: "Balanser kreftene", params: { steg: true } },
  render: (params) => <Kraftbalanse params={params} />,
});
