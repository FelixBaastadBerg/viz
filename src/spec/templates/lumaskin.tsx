/** Template: the LU machine, side by side (Felix 2026-10-15). Round 1 (the video's board stacked: receipt over L,
    readout left, m-rings by every 0) was turned down: «jeg likte faktisk side ved side utseende slik vi har det nå
    bedre … du trenger ikke lagre huskelapper … bare før det rett inn i [L], men skrittene kan godt være tydeligere:
    1. identifiser pivot og første tall under. 2. Finn multiplikator og sett inn i L 3. trekk fra rader».
    So: ARBEIDSKOPI | KVITTERING | L in one row with caps labels on top (the live LU machine's look, L's rows level with
    the working copy's), and every number under a pivot takes three clear steps, shown by a small stepper instead of
    status sentences (W17):
      1 PIVOT            — the pivot in a blue frame, the number under it in an orange one
      2 MULTIPLIKATOR → L — m = under ÷ pivot under the matrix (under orange, pivot blue), a dashed arrow carries it
                           into L, where it lands in orange
      3 TREKK FRA         — a pen-drawn arrow from the pivot row to the row, the row sum under the matrix
                           ((−1, 0, −2) − (−1)·(1, 2, −1) = (0, 2, −3)), the new row and the receipt line.
    Doolittle without row exchanges, exact fractions (stacked on the board), quiz:correct when L and U are done. */
import {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { emitQuizEvent } from "../../quiz/events";
import { fromNumber, fTxt, luSteps, type Frac } from "./steg";

type P = Record<string, unknown>;

/** The video's numerals (Computer Modern); the host loads «Kateter NewCM», KaTeX_Main is the fallback. */
const MATH = '"Kateter NewCM", "KaTeX_Main", "Times New Roman", serif';
const PHASES = ["Pivot", "Multiplikator → L", "Trekk fra"];

let measureCtx: CanvasRenderingContext2D | null = null;
function textW(s: string, size: number, italic = false): number {
  if (typeof document === "undefined") return s.length * size * 0.55;
  measureCtx ??= document.createElement("canvas").getContext("2d");
  if (!measureCtx) return s.length * size * 0.55;
  measureCtx.font = `${italic ? "italic " : ""}${size}px ${MATH}`;
  return measureCtx.measureText(s).width;
}

/** An open arrow head at (x, y) pointing along angle a (radians). */
function head(x: number, y: number, a: number, s = 7): string {
  const l = a + Math.PI - 0.5;
  const r = a + Math.PI + 0.5;
  return `M ${x + s * Math.cos(l)} ${y + s * Math.sin(l)} L ${x} ${y} L ${x + s * Math.cos(r)} ${y + s * Math.sin(r)}`;
}

/** Square brackets around a block, ticks inward. */
function brackets(
  l: number,
  r: number,
  t: number,
  b: number,
  tick: number,
): string {
  return `M ${l + tick} ${t} H ${l} V ${b} H ${l + tick} M ${r - tick} ${t} H ${r} V ${b} H ${r - tick}`;
}

/** Width of a number as `Num` draws it. */
function numW(a: Frac, f: number): number {
  if (a.d === 1) return textW(fTxt(a), f);
  const s = f * 0.62;
  const w =
    Math.max(textW(String(Math.abs(a.n)), s), textW(String(a.d), s)) + 4;
  return (a.n < 0 ? textW("−", f * 0.85) + 1 : 0) + w;
}

/** A number centred on (x, y) as on the video's board: integers as text, fractions stacked (sign, numerator over
    denominator) so «5/2» never runs into its neighbour. */
function Num({
  a,
  x,
  y,
  f,
  fill,
}: {
  a: Frac;
  x: number;
  y: number;
  f: number;
  fill: string;
}) {
  if (a.d === 1)
    return (
      <text
        x={x}
        y={y + f * 0.34}
        textAnchor="middle"
        fontSize={f}
        fill={fill}
        style={{ fontFamily: MATH }}
      >
        {fTxt(a)}
      </text>
    );
  const s = f * 0.62;
  const sw = a.n < 0 ? textW("−", f * 0.85) + 1 : 0;
  const w =
    Math.max(textW(String(Math.abs(a.n)), s), textW(String(a.d), s)) + 4;
  const left = x - (sw + w) / 2;
  const cx = left + sw + w / 2;
  return (
    <g fill={fill} style={{ fontFamily: MATH }}>
      {a.n < 0 ? (
        <text x={left} y={y + f * 0.22} fontSize={f * 0.85}>
          −
        </text>
      ) : null}
      <text x={cx} y={y - s * 0.22} textAnchor="middle" fontSize={s}>
        {Math.abs(a.n)}
      </text>
      <line
        x1={left + sw}
        x2={left + sw + w}
        y1={y}
        y2={y}
        stroke={fill}
        strokeWidth={Math.max(0.9, f * 0.045)}
      />
      <text x={cx} y={y + s * 0.92} textAnchor="middle" fontSize={s}>
        {a.d}
      </text>
    </g>
  );
}

interface Lay {
  vw: number;
  h: number;
  f: number;
  cw: number;
  rh: number;
  xs: number[];
  ys: number[];
  bl: number;
  br: number;
  bt: number;
  bb: number;
  labelY: number;
  mathY: number; // axis of the line under the working copy
  card: {
    x: number;
    y: number;
    w: number;
    h: number;
    f: number;
    y0: number;
    step: number;
  };
  lf: number;
  lcw: number;
  lxs: number[];
  lys: number[];
  lb: [number, number, number, number];
  lLabelY: number;
  capsF: number;
}

function layout(n: number, nOps: number, narrow: boolean): Lay {
  const small = n > 3;
  if (!narrow) {
    // ARBEIDSKOPI | KVITTERING | L, one row, L's rows level with the working copy's
    const f = small ? 26 : 30;
    const cw = small ? 52 : 60;
    const rh = small ? 42 : 48;
    const lf = small ? 19 : 22;
    const lcw = small ? 34 : 40;
    const arrow = 40;
    const gap = 36;
    const cardW = small ? 196 : 186;
    const matW = n * cw + 12;
    const lW = n * lcw + 12;
    const x0 = (720 - (arrow + matW + gap + cardW + gap + lW)) / 2;
    const bl = x0 + arrow;
    const br = bl + matW;
    const labelY = 26;
    const bt = 44;
    const xs = Array.from({ length: n }, (_, c) => bl + 6 + cw / 2 + c * cw);
    const ys = Array.from({ length: n }, (_, r) => bt + 6 + rh / 2 + r * rh);
    const bb = ys[n - 1] + rh / 2 + 6;
    const cardX = br + gap;
    const cardY = labelY - 18;
    const step = 24;
    const card = {
      x: cardX,
      y: cardY,
      w: cardW,
      h: Math.max(bb - cardY, 46 + nOps * step),
      f: 17,
      y0: bt + 20,
      step,
    };
    const lbl = cardX + cardW + gap;
    const lxs = Array.from(
      { length: n },
      (_, c) => lbl + 6 + lcw / 2 + c * lcw,
    );
    const mathY = Math.max(bb, card.y + card.h + 6) + 32;
    return {
      vw: 720,
      h: mathY + 34,
      f,
      cw,
      rh,
      xs,
      ys,
      bl,
      br,
      bt,
      bb,
      labelY,
      mathY,
      card,
      lf,
      lcw,
      lxs,
      lys: ys,
      lb: [lbl, lbl + lW, bt, bb],
      lLabelY: labelY,
      capsF: 11,
    };
  }
  // phone: the working copy on top, the line under it, then the receipt and L side by side
  const f = small ? 21 : 24;
  const cw = small ? 46 : 54;
  const rh = small ? 36 : 40;
  const lf = small ? 15 : 17;
  const lcw = small ? 28 : 32;
  const matW = n * cw + 12;
  const bl = (380 - matW) / 2 + 14;
  const br = bl + matW;
  const labelY = 22;
  const bt = 36;
  const xs = Array.from({ length: n }, (_, c) => bl + 6 + cw / 2 + c * cw);
  const ys = Array.from({ length: n }, (_, r) => bt + 6 + rh / 2 + r * rh);
  const bb = ys[n - 1] + rh / 2 + 6;
  const mathY = bb + 30;
  const top2 = mathY + 34;
  const step = 22;
  const card = {
    x: 12,
    y: top2,
    w: 196,
    h: 40 + nOps * step,
    f: 15,
    y0: top2 + 44,
    step,
  };
  const lW = n * lcw + 12;
  const lbl = 232 + (136 - lW) / 2;
  const lrh = small ? 24 : 27;
  const lt = top2 + 26;
  const lxs = Array.from({ length: n }, (_, c) => lbl + 6 + lcw / 2 + c * lcw);
  const lys = Array.from({ length: n }, (_, r) => lt + 4 + lrh / 2 + r * lrh);
  const lbb = lys[n - 1] + lrh / 2 + 4;
  return {
    vw: 380,
    h: Math.max(card.y + card.h + 10, lbb) + 14,
    f,
    cw,
    rh,
    xs,
    ys,
    bl,
    br,
    bt,
    bb,
    labelY,
    mathY,
    card,
    lf,
    lcw,
    lxs,
    lys,
    lb: [lbl, lbl + lW, lt, lbb],
    lLabelY: top2 + 14,
    capsF: 10.5,
  };
}

function LuMaskin({ params }: { params: P }) {
  const t = useKtTheme();
  const flat = params.matrise as number[];
  const navn = (params.navn as string) || "M";
  const quizId = (params.quizId as string) || "lu-maskin";
  const data = useMemo(() => {
    const n = Math.round(Math.sqrt(flat.length));
    if (n < 2 || n > 4 || n * n !== flat.length) return null;
    const m0: Frac[][] = [];
    for (let r = 0; r < n; r++)
      m0.push(flat.slice(r * n, (r + 1) * n).map(fromNumber));
    return { n, m0, ...luSteps(m0) };
  }, [flat]);
  const [idx, setIdx] = useState(0);
  const elims = data ? data.steps.length : 0;
  const total = elims * 3; // three steps per number under a pivot
  const finished = !!data && !data.error && elims > 0 && idx >= total;

  // the board is drawn for a wide column or a phone; measure the host, and re-measure text once the fonts are in
  const root = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  const [, setFontsReady] = useState(0);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setNarrow(el.clientWidth > 0 && el.clientWidth < 600);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    let alive = true;
    document.fonts?.ready.then(() => alive && setFontsReady((k) => k + 1));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    if (finished)
      emitQuizEvent({
        type: "quiz:correct",
        quizId,
        attempts: 1,
        at: Date.now(),
      });
  }, [finished, quizId]);

  if (!data) {
    return (
      <div
        className="kviz-widget"
        style={{ padding: 24, color: "var(--kt-wrong-ink)" }}
      >
        Ugyldig matrise: «matrise» må være kvadratisk (2×2 til 4×4), skrevet
        radvis.
      </div>
    );
  }
  const { n, m0, steps, error } = data;
  const L = layout(n, elims, narrow);

  // idx 0 = the start; then step p = idx − 1 is phase (p mod 3) of elimination ⌊p / 3⌋
  const p = idx - 1;
  const j = idx === 0 ? -1 : Math.floor(p / 3);
  const ph = idx === 0 ? -1 : p % 3; // 0 pivot · 1 multiplier → L · 2 subtract
  const e = idx === 0 ? null : steps[j];
  const before = j > 0 ? steps[j - 1].after : m0;
  const cur = ph === 2 ? e!.after : before;
  const inL = steps.slice(0, Math.max(0, j)).concat(e && ph >= 1 ? [e] : []);
  const onReceipt = steps
    .slice(0, Math.max(0, j))
    .concat(e && ph === 2 ? [e] : []);
  const stuck = !!error && idx >= total;

  const ink = t.text.primary;
  const muted = t.text.muted;
  const orange = t.accents.touch.ink;
  const blue = t.accents.object.ink;
  const capsStyle = {
    fontFamily: "var(--kt-font-caps, var(--kt-font-ui))",
    fontWeight: 600,
    letterSpacing: "0.14em",
  } as const;
  const caps = (x: number, y: number, s: string, fill: string) => (
    <text
      x={x}
      y={y}
      textAnchor="middle"
      fontSize={L.capsF}
      fill={fill}
      style={capsStyle}
    >
      {s}
    </text>
  );
  const go = (k: number) => setIdx(Math.max(0, Math.min(total, k)));
  const frame = (
    x: number,
    y: number,
    w: number,
    h: number,
    stroke: string,
    fill = "none",
    key?: string,
  ) => (
    <rect
      key={key}
      x={x - w / 2}
      y={y - h / 2}
      width={w}
      height={h}
      rx={8}
      fill={fill}
      stroke={stroke}
      strokeWidth={1.6}
    />
  );

  /* ---------------------------------------------------------------- the working copy */
  const marks: ReactNode[] = [];
  const cells: ReactNode[] = [];
  const showPair = !!e && !finished && ph <= 1; // steps 1–2: the pivot and the number under it
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const x = L.xs[c];
      const y = L.ys[r];
      let fill = ink;
      if (finished) fill = c >= r ? blue : muted;
      else if (e && r === e.k && c === e.k) fill = blue;
      else if (showPair && r === e!.i && c === e!.k) fill = orange;
      else if (c < r && cur[r][c].n === 0) fill = muted;
      const fresh = !!e && ph === 2 && r === e.i;
      cells.push(
        <g
          key={`${r},${c}${fresh ? `@${idx}` : ""}`}
          className={fresh ? "lum-in lum-late" : undefined}
        >
          <Num a={cur[r][c]} x={x} y={y} f={L.f} fill={fill} />
        </g>,
      );
    }
  if (e && !finished) {
    marks.push(
      frame(L.xs[e.k], L.ys[e.k], L.cw - 10, L.rh - 10, blue, "none", "piv"),
    );
    if (ph <= 1)
      marks.push(
        frame(
          L.xs[e.k],
          L.ys[e.i],
          L.cw - 10,
          L.rh - 10,
          orange,
          "none",
          `tgt${j}`,
        ),
      );
    if (ph === 2)
      for (let c = 0; c < n; c++)
        marks.push(
          <g key={`new${idx}-${c}`} className="lum-in">
            {frame(
              L.xs[c],
              L.ys[e.i],
              L.cw - 10,
              L.rh - 10,
              "none",
              "var(--kt-bg-panel-raised)",
            )}
          </g>,
        );
  }

  /* ---------------------------------------------------------------- step 2 / 3: the line under the working copy */
  let below: ReactNode = null;
  const matCx = (L.bl + L.br) / 2;
  if (e && !finished && ph === 1) {
    // m = under / pivot = value, then a dashed arrow into L
    const f = narrow ? 18 : 20;
    const fs = f * 0.86;
    const under = fTxt(e.under);
    const piv = fTxt(e.pivot);
    const gap = f * 0.32;
    const wm = textW("m", f, true);
    const weq = textW("=", f);
    const wfr = Math.max(textW(under, fs), textW(piv, fs)) + 8;
    const wval = numW(e.l, f);
    const wAll = wm + gap + weq + gap + wfr + gap + weq + gap + wval;
    const axis = L.mathY;
    const base = axis + f * 0.26;
    const fx = matCx - wAll / 2;
    const xEq1 = fx + wm + gap;
    const xFr = xEq1 + weq + gap;
    const xEq2 = xFr + wfr + gap;
    const xVal = xEq2 + weq + gap;
    // into L: along the line, then up/down beside L (in the gap before it, or past it on a phone) and in at row i —
    // never through L's other cells; the new entry gets its own frame
    const a0 = xVal + wval + 12;
    const [lbl0, lbr0] = L.lb;
    const fromLeft = a0 < lbl0 - 24;
    const vx = fromLeft ? lbl0 - 18 : lbr0 + 16;
    const ex = fromLeft ? lbl0 - 5 : lbr0 + 5;
    const yi = L.lys[e.i];
    const dir = yi < axis ? -1 : 1;
    const rr = 8;
    const d = `M ${a0} ${axis} H ${vx - rr} Q ${vx} ${axis} ${vx} ${axis + dir * rr} V ${yi - dir * rr} Q ${vx} ${yi} ${vx + (fromLeft ? rr : -rr)} ${yi} H ${ex}`;
    below = (
      <g key={`m${idx}`}>
        <g className="lum-in" style={{ fontFamily: MATH }}>
          <text x={fx} y={base} fontSize={f} fontStyle="italic" fill={orange}>
            m
          </text>
          <text x={xEq1} y={base} fontSize={f} fill={ink}>
            =
          </text>
          <text
            x={xFr + wfr / 2}
            y={axis - 5}
            textAnchor="middle"
            fontSize={fs}
            fill={orange}
          >
            {under}
          </text>
          <line
            x1={xFr}
            x2={xFr + wfr}
            y1={axis}
            y2={axis}
            stroke={ink}
            strokeWidth={1.1}
          />
          <text
            x={xFr + wfr / 2}
            y={axis + fs * 0.98}
            textAnchor="middle"
            fontSize={fs}
            fill={blue}
          >
            {piv}
          </text>
          <text x={xEq2} y={base} fontSize={f} fill={ink}>
            =
          </text>
          <Num
            a={e.l}
            x={xVal + wval / 2}
            y={e.l.d === 1 ? base - f * 0.34 : axis}
            f={f}
            fill={orange}
          />
        </g>
        <path
          className="lum-in lum-late"
          d={d}
          stroke={orange}
          strokeWidth={1.5}
          strokeDasharray="5 4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="lum-in lum-later"
          d={head(ex, yi, fromLeft ? 0 : Math.PI, 6)}
          stroke={orange}
          strokeWidth={1.5}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
  }
  let arrow: ReactNode = null;
  if (e && !finished && ph === 2) {
    // the row operation: pen arrow from the pivot row, and the row sum under the matrix
    const y1 = L.ys[e.k];
    const y2 = L.ys[e.i];
    const x0 = L.bl - 6;
    const xl = L.bl - 30;
    const rr = 9;
    const d = `M ${x0} ${y1} H ${xl + rr} Q ${xl} ${y1} ${xl} ${y1 + rr} V ${y2 - rr} Q ${xl} ${y2} ${xl + rr} ${y2} H ${x0}`;
    arrow = (
      <g key={`arr${idx}`}>
        <path
          className="lum-draw"
          pathLength={1}
          d={d}
          stroke={orange}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
        <path
          className="lum-in lum-late"
          d={head(x0, y2, 0, 7)}
          stroke={orange}
          strokeWidth={2}
          fill="none"
          strokeLinecap="round"
        />
      </g>
    );
    const f = narrow ? 15 : 18;
    const tup = (row: Frac[], hi: string) =>
      row.map((v, c) => (
        <tspan key={c} fill={c === e.k ? hi : ink}>
          {(c ? ", " : "") + fTxt(v)}
        </tspan>
      ));
    const neg = e.l.n < 0;
    const parts = [
      ...before[e.i].map(fTxt),
      ...before[e.k].map(fTxt),
      ...e.after[e.i].map(fTxt),
    ].join(", ");
    const w = textW(`(${parts}) − (${fTxt(e.l)}) · () = ()`, f);
    const x = Math.max(8, Math.min(matCx - w / 2, L.vw - 8 - w));
    below = (
      <text
        key={`sum${idx}`}
        className="lum-in lum-late"
        x={x}
        y={L.mathY + f * 0.3}
        fontSize={f}
        fill={ink}
        style={{ fontFamily: MATH }}
      >
        ({tup(before[e.i], orange)}) − {neg ? "(" : ""}
        <tspan fill={orange}>{fTxt(e.l)}</tspan>
        {neg ? ")" : ""} · ({tup(before[e.k], blue)}) = (
        {tup(e.after[e.i], ink)})
      </text>
    );
  }

  /* ---------------------------------------------------------------- the receipt */
  const C = L.card;
  const zig = (() => {
    const k = Math.round(C.w / 10);
    let d = `M ${C.x} ${C.y} H ${C.x + C.w} V ${C.y + C.h}`;
    for (let q = k - 1; q >= 0; q--)
      d += ` L ${C.x + (q + 0.5) * (C.w / k)} ${C.y + C.h + 6} L ${C.x + q * (C.w / k)} ${C.y + C.h}`;
    return d + " Z";
  })();
  const lines = onReceipt.map((s, q) => {
    const neg = s.l.n < 0;
    const f = C.f;
    const sb = f * 0.66;
    return (
      <text
        key={q}
        className={
          ph === 2 && q === onReceipt.length - 1 && !finished
            ? "lum-in lum-late"
            : undefined
        }
        x={C.x + 18}
        y={C.y0 + q * C.step}
        fontSize={f}
        fill={ink}
        style={{ fontFamily: MATH }}
      >
        <tspan fontStyle="italic">R</tspan>
        <tspan fontSize={sb} dy={f * 0.22}>
          {s.i + 1}
        </tspan>
        <tspan dy={-f * 0.22}>{" − "}</tspan>
        {neg ? "(" : ""}
        <tspan fill={orange}>{fTxt(s.l)}</tspan>
        {neg ? ")" : ""}
        {" · "}
        <tspan fontStyle="italic">R</tspan>
        <tspan fontSize={sb} dy={f * 0.22}>
          {s.k + 1}
        </tspan>
      </text>
    );
  });

  /* ---------------------------------------------------------------- L */
  const lcells: ReactNode[] = [];
  const known = new Map(inL.map((s) => [`${s.i},${s.k}`, s.l]));
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const x = L.lxs[c];
      const y = L.lys[r];
      if (c < r) {
        const m = known.get(`${r},${c}`);
        const isNew = !!e && ph === 1 && e.i === r && e.k === c;
        lcells.push(
          m ? (
            <g
              key={`l${r}${c}${isNew ? idx : ""}`}
              className={isNew ? "lum-pop lum-later" : undefined}
            >
              {isNew ? frame(x, y, L.lcw - 6, L.lf * 1.5, orange) : null}
              <Num a={m} x={x} y={y} f={L.lf} fill={orange} />
            </g>
          ) : (
            <circle
              key={`l${r}${c}`}
              cx={x}
              cy={y}
              r={2.6}
              fill={muted}
              opacity={0.6}
            />
          ),
        );
      } else
        lcells.push(
          <text
            key={`l${r}${c}`}
            x={x}
            y={y + L.lf * 0.34}
            textAnchor="middle"
            fontSize={L.lf}
            fill={c === r ? ink : muted}
            style={{ fontFamily: MATH }}
          >
            {c === r ? "1" : "0"}
          </text>,
        );
    }
  const [lbl, lbr, lbt, lbb] = L.lb;

  const matLabel = idx === 0 ? navn : finished ? "U" : "Arbeidskopi";
  const aria = `LU-faktorisering, steg ${idx} av ${total}`;
  const status = stuck
    ? "Pivoten er 0 · radbytte trengs"
    : finished
      ? `${navn} = LU`
      : idx === 0
        ? "Mål · nuller under pivoten"
        : null;

  return (
    <div className="kviz-widget kviz-lum" ref={root}>
      <svg
        viewBox={`0 0 ${L.vw} ${L.h}`}
        role="img"
        aria-label={aria}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          overflow: "visible",
        }}
      >
        {/* the working copy */}
        {caps(matCx, L.labelY, matLabel.toUpperCase(), finished ? blue : muted)}
        {marks}
        <path
          d={brackets(L.bl, L.br, L.bt, L.bb, 10)}
          stroke={finished ? blue : ink}
          strokeWidth={1.8}
          fill="none"
        />
        {cells}
        {arrow}
        {below}
        {/* the receipt */}
        <path d={zig} fill="var(--kt-bg-panel)" />
        {caps(C.x + C.w / 2, L.card.y + 18, "KVITTERING", muted)}
        {lines}
        {/* L */}
        {caps((lbl + lbr) / 2, L.lLabelY, "L", orange)}
        <path
          d={brackets(lbl, lbr, lbt, lbb, 7)}
          stroke={ink}
          strokeWidth={1.4}
          fill="none"
        />
        {lcells}
      </svg>
      <div
        className="kviz-widget-controls lu-ctrl"
        style={{
          display: "flex",
          flexDirection: "row",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          gap: 8,
          width: "auto",
        }}
      >
        <button
          className="kviz-btn lu-pill"
          disabled={idx === 0}
          onClick={() => go(idx - 1)}
        >
          ← Forrige
        </button>
        <button
          className="kviz-btn kviz-btn--primary lu-pill lu-main"
          disabled={idx >= total}
          onClick={() => go(idx + 1)}
        >
          Neste steg →
        </button>
        <button
          className="kviz-btn lu-pill"
          disabled={idx === 0}
          onClick={() => go(0)}
        >
          Nullstill
        </button>
      </div>
      {status ? (
        <p
          className={finished ? "kviz-capline is-done" : "kviz-capline"}
          aria-live="polite"
        >
          {status}
        </p>
      ) : (
        // the three steps for this number, the one you are on in orange
        <div
          className="lum-stepper"
          aria-live="polite"
          style={{
            display: "flex",
            flexDirection: "row",
            flexWrap: "wrap",
            justifyContent: "center",
            alignItems: "center",
            width: "auto",
          }}
        >
          {PHASES.map((label, k) => (
            <span
              key={k}
              className={k === ph ? "is-on" : k < ph ? "is-done" : undefined}
            >
              <span className="lum-n">{k + 1}</span>
              {label}
            </span>
          ))}
        </div>
      )}
      <p className="kviz-capline is-small">{`steg ${Math.min(idx, total)} / ${total}`}</p>
    </div>
  );
}

registerTemplate({
  id: "lu-maskin",
  description:
    "LU-maskinen side ved side (ARBEIDSKOPI | KVITTERING | L, versal-etiketter over) med tre tydelige trinn for hvert tall under en pivot: 1 pivot og tallet under markeres, 2 multiplikatoren m = under ÷ pivot vises under matrisen og føres med en pil rett inn i L, 3 pennepil fra pivotraden, radregningen under matrisen og ny rad + kvitteringslinje. En liten trinnviser (1 PIVOT · 2 MULTIPLIKATOR → L · 3 TREKK FRA) i stedet for statussetninger (W17). Uten radbytter (Doolittle), eksakte brøker (stablet); quiz:correct når L og U er ferdige.",
  curriculum: ["universitet", "TMA4400"],
  params: {
    matrise: {
      type: { kind: "numbers" },
      required: true,
      doc: "kvadratisk matrise (2×2 til 4×4) som flat radmajor-liste, f.eks. [[1,2],[3,4]] skrives [1, 2, 3, 4]. Velg en matrise som ikke trenger radbytter.",
    },
    navn: {
      type: { kind: "string" },
      default: "M",
      doc: "navnet på matrisen slik den heter i videoen/teksten",
    },
    quizId: {
      type: { kind: "string" },
      default: "lu-maskin",
      doc: "id i quiz:correct-hendelsen (verten krysser av «widget»)",
    },
  },
  example: {
    template: "lu-maskin",
    title: "LU-maskinen",
    params: { matrise: [1, 2, -1, -1, 0, -2, -2, -2, -2], navn: "M" },
  },
  render: (params) => <LuMaskin params={params} />,
});
