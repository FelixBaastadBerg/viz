/** Template: balance the forces (likevekt). Felix 2026-10-15, after Brilliant's «Balance the forces», in our widget
    style: one or two forces are fixed, the student drags the last one until the sum vanishes, then presses «Sjekk».
    Layouts (Felix: «mer dynamisk … grå bakgrunn i større grad»): the challenge under the figure or in a grey card
    beside it; optional force polygon (the forces tip to tail — the polygon closes at equilibrium), a balance meter
    and a grey field behind the figure. Colours follow the video order (V53): fixed F₁ blue, fixed F₂ yellow, the force
    you drag orange, the sum ΣF in ink. */
import { useMemo, useState, type CSSProperties } from "react";
import { Point, Polygon, Vector } from "mafs";
import { KPlot } from "../../2d/KPlot";
import { KPoint, KLabel } from "../../2d/primitives";
import { KFig, KLegend, KMixed } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import type { KtRole } from "../../theme/types";
import { registerTemplate } from "../registry";
import { emitQuizEvent } from "../../quiz/events";

type P = Record<string, unknown>;
type V2 = [number, number];

/** A label just past a vector's tip, pushed out along the vector so it never sits on the arrow head. */
function past(tail: V2, tip: V2, d = 0.5): V2 {
  const dx = tip[0] - tail[0];
  const dy = tip[1] - tail[1];
  const r = Math.hypot(dx, dy) || 1;
  return [tip[0] + (dx / r) * d, tip[1] + (dy / r) * d];
}
const add = (a: V2, b: V2): V2 => [a[0] + b[0], a[1] + b[1]];

// layout inline: hosts like TipTap's `div[data-node-view-wrapper] div { display/flex: inherit }` override classes
const SIDE: CSSProperties = { display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.55fr)", alignItems: "center", gap: 16, width: "auto" };
const COL: CSSProperties = { display: "flex", flexDirection: "column", alignItems: "stretch", justifyContent: "flex-start", gap: 10, width: "auto" };
const ROW: CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "flex-start", gap: 12, width: "auto" };
const METER: CSSProperties = { display: "flex", flexDirection: "row", alignItems: "center", gap: 12, width: "auto", padding: "2px 14px 12px" };
const FIELD: CSSProperties = { display: "block", width: "auto", borderRadius: 14, background: "var(--kt-bg-panel)", padding: 6 };

function Kraftbalanse({ params }: { params: P }) {
  const t = useKtTheme();
  const flat = params.faste as number[];
  const fixed: V2[] = [];
  for (let k = 0; k + 1 < flat.length; k += 2) fixed.push([flat[k], flat[k + 1]]);
  const roles: KtRole[] = ["object", "alt"]; // F₁ blue, F₂ yellow
  const tol = params.toleranse as number;
  const snap = params.snap as number;
  const quizId = params.quizId as string;
  const half = params.utsnitt as number;
  const start = params.dra as V2;
  const side = params.oppsett === "side";
  const polygon = params.kraftpolygon === true;
  const meter = params.maaler === true;
  const field = params.felt === true;
  const n = fixed.length + 1; // the dragged force is F_n

  const [f, setF] = useState<V2>(start);
  const [result, setResult] = useState<null | boolean>(null); // the last «Sjekk»
  const [attempts, setAttempts] = useState(0);
  const [done, setDone] = useState(false);
  const fixedSum = fixed.reduce<V2>((s, v) => add(s, v), [0, 0]);
  const sum = add(fixedSum, f);
  const size = Math.hypot(sum[0], sum[1]);
  const size0 = useMemo(
    () => Math.max(0.5, Math.hypot(fixedSum[0] + start[0], fixedSum[1] + start[1])),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flat.join(","), start.join(",")]
  );
  const closed = size <= tol;
  // the polygon: the forces tip to tail from the origin; it closes when the sum is zero
  const chain: V2[] = [[0, 0]];
  for (const v of [...fixed, f]) chain.push(add(chain[chain.length - 1], v));
  const ink = t.text.primary;
  const w = t.stroke.curveSecondary;

  const check = () => {
    const ok = size <= tol;
    const k = attempts + 1;
    setAttempts(k);
    setResult(ok);
    emitQuizEvent({ type: "quiz:attempt", quizId, correct: ok, attempt: k, at: Date.now() });
    if (ok) {
      setDone(true);
      emitQuizEvent({ type: "quiz:correct", quizId, attempts: k, at: Date.now() });
    }
  };

  const fig = (
    <KFig legend={meter ? undefined : <KLegend corner="tl" items={[{ label: "|\\Sigma \\vec F|", value: size }]} />}>
      <KPlot
        viewBox={{ x: [-half, half], y: [-half * 0.55, half * 0.55] }}
        aspect="equal"
        axes={false}
        height={(params.height as number) ?? 320}
      >
        {polygon ? (
          <>
            <Polygon points={chain} color={t.accents.touch.stroke} fillOpacity={closed ? 0.2 : 0.06} strokeOpacity={0} />
            <g style={{ opacity: 0.5 }}>
              {fixed.slice(1).map((v, k) => (
                <Vector key={k} tail={chain[k + 1]} tip={chain[k + 2]} color={t.accents[roles[k + 1]].stroke} weight={w} />
              ))}
              <Vector tail={chain[n - 1]} tip={chain[n]} color={t.accents.touch.stroke} weight={w} />
            </g>
          </>
        ) : null}
        {fixed.map((v, k) => (
          <Vector key={k} tip={v} color={t.accents[roles[k]].stroke} weight={w} />
        ))}
        <Vector tip={f} color={t.accents.touch.stroke} weight={w} />
        {size > 0.06 ? <Vector tip={sum} color={ink} weight={t.stroke.tangent} /> : null}
        <Point x={0} y={0} color={ink} />
        <KPoint
          point={f}
          constrain={(x, y) => [Math.round(x / snap) * snap, Math.round(y / snap) * snap]}
          onMove={(p) => {
            setF(p);
            if (!done) setResult(null);
          }}
          role="touch"
        />
        {fixed.map((v, k) => (
          <KLabel key={k} tex={`\\vec F_${k + 1}`} at={past([0, 0], v)} role={roles[k]} />
        ))}
        <KLabel tex={`\\vec F_${n}`} at={past([0, 0], f, 0.6)} role="touch" />
        {size > 0.06 ? <KLabel tex="\Sigma \vec F" at={past([0, 0], sum, 0.45)} /> : null}
      </KPlot>
    </KFig>
  );

  const meterEl = meter ? (
    <div className="kviz-meter" style={METER}>
      <span className="kviz-meter-l">
        <KMixed text={"$|\\Sigma \\vec F|$"} />
      </span>
      <span className="kviz-meter-track" style={{ display: "block", position: "relative", flex: 1, width: "auto" }}>
        <span
          className={closed ? "kviz-meter-fill is-zero" : "kviz-meter-fill"}
          style={{ display: "block", width: `${closed ? 100 : Math.min(100, (100 * size) / size0).toFixed(1)}%` }}
        />
      </span>
      <span className="kviz-meter-v">{size.toFixed(2)}</span>
    </div>
  ) : null;

  const button = !done ? (
    <button className="kviz-btn kviz-btn--primary kviz-challenge-btn" onClick={check}>
      Sjekk
    </button>
  ) : null;
  const say = (s: string) => s.split("{n}").join(String(n));
  const feedback = (
    <p
      className={result === null ? "kviz-challenge-fb" : result ? "kviz-challenge-fb is-good" : "kviz-challenge-fb is-bad"}
      aria-live="polite"
    >
      <KMixed
        text={say(
          result === null
            ? done
              ? (params.riktig as string)
              : (params.hint as string)
            : result
              ? (params.riktig as string)
              : (params.feil as string)
        )}
      />
    </p>
  );
  const card = (
    <div className={side ? "kviz-challenge is-card" : "kviz-challenge"} style={COL}>
      <span className="kviz-challenge-h" style={{ display: "block" }}>
        Utfordring
      </span>
      <div className="kviz-challenge-row" style={side ? { ...ROW, alignItems: "flex-start" } : ROW}>
        <span className={done ? "kviz-challenge-box is-done" : "kviz-challenge-box"} aria-hidden="true">
          {done ? "✓" : ""}
        </span>
        <p className="kviz-challenge-t">
          <KMixed text={params.oppgave as string} />
        </p>
        {side ? null : button}
      </div>
      {side && button ? <div style={{ display: "block", width: "auto" }}>{button}</div> : null}
      {feedback}
    </div>
  );
  const figBlock = (
    <div className={field ? "kviz-field" : undefined} style={field ? FIELD : { display: "block", width: "auto" }}>
      {fig}
      {meterEl}
    </div>
  );
  return (
    <div className="kviz-widget kviz-kraft">
      {side ? (
        <div className="kviz-kraft-side" style={SIDE}>
          {card}
          {figBlock}
        </div>
      ) : (
        <>
          {figBlock}
          {card}
        </>
      )}
    </div>
  );
}

registerTemplate({
  id: "kraftbalanse",
  description:
    "Likevekt: én eller to krefter ligger fast, eleven drar den siste til summen blir null og trykker «Sjekk». Viser ΣF som en vektor; valgfritt kraftpolygon (kreftene spiss mot hale — polygonet lukker seg i likevekt), balansemåler, grått felt og oppgavekort ved siden av figuren. Emitterer quiz:correct når |ΣF| ≤ toleransen. For vektorsum, krefter og likevekt.",
  curriculum: ["R1", "FY1", "TMA4400"],
  params: {
    faste: { type: { kind: "numbers" }, default: [-3, 1.4], doc: "de faste kreftene, flatt: [x1, y1] eller [x1, y1, x2, y2]" },
    dra: { type: { kind: "numbers" }, default: [2.2, -1.6], doc: "startpunktet for kraften eleven drar [x, y]" },
    toleranse: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.15, doc: "|ΣF| som godtas som null" },
    snap: { type: { kind: "number", min: 0.01, max: 1 }, default: 0.1, doc: "kraften fester seg til dette rutenettet" },
    utsnitt: { type: { kind: "number", min: 2, max: 12 }, default: 4.6, doc: "halv bredde av utsnittet" },
    oppsett: { type: { kind: "string", oneOf: ["under", "side"] }, default: "under", doc: "utfordringen under figuren eller i et grått kort ved siden av" },
    kraftpolygon: { type: { kind: "boolean" }, default: false, doc: "kreftene spiss mot hale: polygonet lukker seg i likevekt (best med to faste krefter)" },
    maaler: { type: { kind: "boolean" }, default: false, doc: "en balansemåler for |ΣF| under figuren (i stedet for forklaringsboksen)" },
    felt: { type: { kind: "boolean" }, default: false, doc: "figuren ligger i et lysere grått felt" },
    oppgave: { type: { kind: "string" }, default: "Få kreftene til å oppheve hverandre.", doc: "oppgaveteksten ($…$ for matte)" },
    hint: { type: { kind: "string" }, default: "Dra $\\vec F_{n}$ og trykk «Sjekk».", doc: "linja under før første sjekk ({n} = kraften man drar)" },
    feil: { type: { kind: "string" }, default: "Ikke helt: flytt $\\vec F_{n}$ nærmere likevekt.", doc: "når summen ikke er null" },
    riktig: { type: { kind: "string" }, default: "Riktig. $\\Sigma \\vec F = \\vec 0$: kreftene er i likevekt.", doc: "når summen er null" },
    quizId: { type: { kind: "string" }, default: "kraftbalanse", doc: "id i quiz:correct-hendelsen (verten krysser av «widget»)" },
    height: { type: { kind: "number", min: 200, max: 640 }, default: 320, doc: "høyde i px" },
  },
  quizValue: "ingen (widgeten sjekker selv og sender quiz:correct)",
  example: {
    template: "kraftbalanse",
    title: "Balanser kreftene",
    params: { faste: [-2.4, 0.6, 0.6, 1.6], dra: [3.4, -2.0], kraftpolygon: true, maaler: true },
  },
  render: (params) => <Kraftbalanse params={params} />,
});
