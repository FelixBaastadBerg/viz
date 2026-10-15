/** Template: balance the forces (likevekt). Felix 2026-10-15, after Brilliant's «Balance the forces», in our widget
    style: one force is fixed, the student drags the other until the sum vanishes, then presses «Sjekk». The figure on
    top, the challenge under it (W6: panels flow below the figure). */
import { useState } from "react";
import { Point } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KPoint, KVector, KLabel } from "../../2d/primitives";
import { KFig, KLegend, KMixed } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { emitQuizEvent } from "../../quiz/events";

type P = Record<string, unknown>;
type V2 = [number, number];

/** A label just past a vector's tip, pushed out along the vector so it never sits on the arrow head. */
function past(tip: V2, d = 0.5): V2 {
  const r = Math.hypot(tip[0], tip[1]) || 1;
  return [tip[0] + (tip[0] / r) * d, tip[1] + (tip[1] / r) * d];
}

const COL = { display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start", gap: 10, width: "auto" } as const;
const ROW = { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12, width: "auto" } as const;

function Kraftbalanse({ params }: { params: P }) {
  const t = useKtTheme();
  const f1 = params.f1 as V2;
  const tol = params.toleranse as number;
  const snap = params.snap as number;
  const quizId = params.quizId as string;
  const half = params.utsnitt as number;
  const [f2, setF2] = useState<V2>(params.f2 as V2);
  const [result, setResult] = useState<null | boolean>(null);   // the last «Sjekk»
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const sum: V2 = [f1[0] + f2[0], f1[1] + f2[1]];
  const size = Math.hypot(sum[0], sum[1]);

  const check = () => {
    const ok = size <= tol;
    const n = attempts + 1;
    setAttempts(n);
    setResult(ok);
    emitQuizEvent({ type: "quiz:attempt", quizId, correct: ok, attempt: n, at: Date.now() });
    if (ok) {
      setDone(true);
      emitQuizEvent({ type: "quiz:correct", quizId, attempts: n, at: Date.now() });
    }
  };

  return (
    <div className="kviz-widget kviz-kraft">
      <KFig
        legend={
          <KLegend corner="tl" items={[{ label: "|\\Sigma \\vec F|", value: size, role: "alt" }]} />
        }
      >
        <KPlot
          viewBox={{ x: [-half, half], y: [-half * 0.55, half * 0.55] }}
          aspect="equal"
          axes={false}
          height={(params.height as number) ?? 320}
        >
          <KVector tip={f1} role="object" />
          <KVector tip={f2} role="touch" />
          {size > 0.06 ? <KVector tip={sum} role="alt" /> : null}
          <Point x={0} y={0} color={t.text.primary} />
          <KPoint
            point={f2}
            constrain={(x, y) => [Math.round(x / snap) * snap, Math.round(y / snap) * snap]}
            onMove={(p) => {
              setF2(p);
              if (!done) setResult(null);
            }}
            role="touch"
          />
          <KLabel tex="\vec F_1" at={past(f1)} role="object" />
          <KLabel tex="\vec F_2" at={past(f2, 0.6)} role="touch" />
          {size > 0.06 ? <KLabel tex="\Sigma \vec F" at={past(sum, 0.45)} role="alt" /> : null}
        </KPlot>
      </KFig>

      {/* layout inline: hosts like TipTap's `div[data-node-view-wrapper] div { display/flex: inherit }` override classes */}
      <div className="kviz-challenge" style={COL}>
        <span className="kviz-challenge-h" style={{ display: "block" }}>Utfordring</span>
        <div className="kviz-challenge-row" style={ROW}>
          <span className={done ? "kviz-challenge-box is-done" : "kviz-challenge-box"} aria-hidden="true">
            {done ? "✓" : ""}
          </span>
          <p className="kviz-challenge-t">
            <KMixed text={params.oppgave as string} />
          </p>
          {!done ? (
            <button className="kviz-btn kviz-btn--primary kviz-challenge-btn" onClick={check}>
              Sjekk
            </button>
          ) : null}
        </div>
        <p
          className={
            result === null ? "kviz-challenge-fb" : result ? "kviz-challenge-fb is-good" : "kviz-challenge-fb is-bad"
          }
          aria-live="polite"
        >
          {result === null ? (
            <KMixed text={done ? (params.riktig as string) : (params.hint as string)} />
          ) : result ? (
            <KMixed text={params.riktig as string} />
          ) : (
            <KMixed text={params.feil as string} />
          )}
        </p>
      </div>
    </div>
  );
}

registerTemplate({
  id: "kraftbalanse",
  description:
    "Likevekt: én kraft ligger fast, eleven drar den andre til summen blir null og trykker «Sjekk». Viser ΣF som en vektor og |ΣF| i en forklaringsboks. Emitterer quiz:correct når |ΣF| ≤ toleransen. For vektorsum, krefter og likevekt.",
  curriculum: ["R1", "FY1", "TMA4400"],
  params: {
    f1: { type: { kind: "numbers" }, default: [-3, 1.4], doc: "den faste kraften F₁ [x, y]" },
    f2: { type: { kind: "numbers" }, default: [2.2, -1.6], doc: "startpunktet for F₂ [x, y] (dras)" },
    toleranse: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.15, doc: "|ΣF| som godtas som null" },
    snap: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.1, doc: "F₂ fester seg til dette rutenettet" },
    utsnitt: { type: { kind: "number", min: 2, max: 12 }, default: 4.6, doc: "halv bredde av utsnittet" },
    oppgave: { type: { kind: "string" }, default: "Få kreftene til å oppheve hverandre.", doc: "oppgaveteksten ($…$ for matte)" },
    hint: { type: { kind: "string" }, default: "Dra $\\vec F_2$ og trykk «Sjekk».", doc: "linja under før første sjekk" },
    feil: { type: { kind: "string" }, default: "Ikke helt: flytt $\\vec F_2$ nærmere likevekt.", doc: "når summen ikke er null" },
    riktig: { type: { kind: "string" }, default: "Riktig. $\\Sigma \\vec F = \\vec 0$: kreftene er i likevekt.", doc: "når summen er null" },
    quizId: { type: { kind: "string" }, default: "kraftbalanse", doc: "id i quiz:correct-hendelsen (verten krysser av «widget»)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 320, doc: "høyde i px" },
  },
  quizValue: "ingen (widgeten sjekker selv og sender quiz:correct)",
  example: {
    template: "kraftbalanse",
    title: "Balanser kreftene",
    params: { f1: [-3, 1.4], f2: [2.2, -1.6] },
  },
  render: (params) => <Kraftbalanse params={params} />,
});
