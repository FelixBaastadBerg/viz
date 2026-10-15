/** Template: the LU machine, side by side (Felix 2026-10-15, round 3). ARBEIDSKOPI | KVITTERING | L in one row: two
    equally wide matrices and a receipt as wide and as tall as they are, labels on one line above (W18). Every number
    under a pivot takes three clear steps — Felix: «1. identifiser pivot og første tall under. 2. Finn multiplikator og
    sett inn i L 3. trekk fra rader» — shown by marks on the board and a small stepper, never by sentences or worked
    lines («de skal ha sett videoen og de trenger ikke få alle utledningene»):
      1 PIVOT             — the pivot in a blue frame, the number under it in an orange one
      2 MULTIPLIKATOR → L — the multiplier lands in L in an orange frame
      3 TREKK FRA         — a pen-drawn arrow from the pivot row to the row, the new row, the receipt line.
    Round 1 (the video's board stacked, m-rings by every 0) and round 2 (the m-fraction and the row sum under the
    matrix) were turned down. Doolittle without row exchanges, exact fractions (stacked), quiz:correct when done. */
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

/** Geometry of the board (STANDARDS W18). It depends on n only — never on the numbers — so nothing moves or resizes
    between steps: both matrices are equally wide (fixed column width, fractions stacked), the receipt is as wide and as
    tall as they are, the three share top and bottom, and the labels sit on one line above. Receipt lines sit level
    with the matrix rows when there are no more of them than rows. */
export interface Lay {
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
  arrowXl: number;
  card: {
    x: number;
    y: number;
    w: number;
    h: number;
    f: number;
    lineYs: number[];
  };
  cardLabelY: number;
  lxs: number[];
  lys: number[];
  lb: [number, number, number, number];
  lLabelY: number;
  capsF: number;
}

export function layout(n: number, nOps: number, narrow: boolean): Lay {
  const tiny = n < 3;
  const small = n > 3;
  const lineYs = (rows: number[], top: number, h: number) =>
    nOps <= n
      ? rows.slice(0, nOps)
      : Array.from(
          { length: nOps },
          (_, j) => top + 12 + (j + 0.5) * ((h - 24) / nOps),
        );
  const cols = (left: number, cw: number) =>
    Array.from({ length: n }, (_, c) => left + 6 + cw / 2 + c * cw);
  const rows = (top: number, rh: number) =>
    Array.from({ length: n }, (_, r) => top + 6 + rh / 2 + r * rh);
  if (!narrow) {
    // ARBEIDSKOPI | KVITTERING | L — three equal blocks in one row, centred; the pen arrow lives in the left margin
    const cw = tiny ? 80 : small ? 48 : 60;
    const rh = small ? 40 : 46;
    const w = n * cw + 12;
    const gap = small ? 24 : 36;
    const bl = (720 - (3 * w + 2 * gap)) / 2;
    const bt = 38;
    const ys = rows(bt, rh);
    const bb = bt + n * rh + 12;
    const cardX = bl + w + gap;
    const lbl = cardX + w + gap;
    return {
      vw: 720,
      h: bb + 12,
      f: small ? 24 : 28,
      cw,
      rh,
      xs: cols(bl, cw),
      ys,
      bl,
      br: bl + w,
      bt,
      bb,
      labelY: 22,
      arrowXl: bl - 26,
      card: {
        x: cardX,
        y: bt,
        w,
        h: bb - bt,
        f: small ? 16 : 17,
        lineYs: lineYs(ys, bt, bb - bt),
      },
      cardLabelY: 22,
      lxs: cols(lbl, cw),
      lys: ys,
      lb: [lbl, lbl + w, bt, bb],
      lLabelY: 22,
      capsF: 11,
    };
  }
  // phone: the working copy on top; the receipt and L side by side under it, each as wide and tall as the matrix
  const cw = tiny ? 66 : small ? 38 : 50;
  const rh = small ? 30 : 36;
  const w = n * cw + 12;
  const gap = Math.min(28, 380 - 2 * w - 24);
  const x0 = (380 - (2 * w + gap)) / 2;
  const bl = (380 - w) / 2;
  const bt = 34;
  const bb = bt + n * rh + 12;
  const bt2 = bb + 46;
  const bb2 = bt2 + (bb - bt);
  const ys2 = rows(bt2, rh);
  const lbl = x0 + w + gap;
  return {
    vw: 380,
    h: bb2 + 12,
    f: small ? 18 : 22,
    cw,
    rh,
    xs: cols(bl, cw),
    ys: rows(bt, rh),
    bl,
    br: bl + w,
    bt,
    bb,
    labelY: 20,
    arrowXl: bl - 26,
    card: {
      x: x0,
      y: bt2,
      w,
      h: bb2 - bt2,
      f: small ? 14 : 15,
      lineYs: lineYs(ys2, bt2, bb2 - bt2),
    },
    cardLabelY: bt2 - 14,
    lxs: cols(lbl, cw),
    lys: ys2,
    lb: [lbl, lbl + w, bt2, bb2],
    lLabelY: bt2 - 14,
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

  const matCx = (L.bl + L.br) / 2;
  let arrow: ReactNode = null;
  if (e && !finished && ph === 2) {
    // the row operation: a pen arrow from the pivot row to the row
    const y1 = L.ys[e.k];
    const y2 = L.ys[e.i];
    const x0 = L.bl - 6;
    const xl = L.arrowXl;
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
  }

  /* ---------------------------------------------------------------- the receipt */
  const C = L.card;
  const zig = (() => {
    const k = Math.round(C.w / 10);
    const body = C.h - 6; // the teeth end level with the matrices' bottom
    let d = `M ${C.x} ${C.y} H ${C.x + C.w} V ${C.y + body}`;
    for (let q = k - 1; q >= 0; q--)
      d += ` L ${C.x + (q + 0.5) * (C.w / k)} ${C.y + C.h} L ${C.x + q * (C.w / k)} ${C.y + body}`;
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
        x={C.x + 16}
        y={C.lineYs[q] + f * 0.34}
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
              className={isNew ? "lum-pop" : undefined}
            >
              {isNew ? frame(x, y, L.cw - 10, L.rh - 10, orange) : null}
              <Num a={m} x={x} y={y} f={L.f} fill={orange} />
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
            y={y + L.f * 0.34}
            textAnchor="middle"
            fontSize={L.f}
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
        {/* the receipt */}
        <path d={zig} fill="var(--kt-bg-panel)" />
        {caps(C.x + C.w / 2, L.cardLabelY, "KVITTERING", muted)}
        {lines}
        {/* L */}
        {caps((lbl + lbr) / 2, L.lLabelY, "L", orange)}
        <path
          d={brackets(lbl, lbr, lbt, lbb, 10)}
          stroke={ink}
          strokeWidth={1.8}
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
    "LU-maskinen side ved side: ARBEIDSKOPI | KVITTERING | L som tre like brede og like høye blokker med versal-etikett over (bredden avhenger bare av størrelsen, aldri av tallene). Tre tydelige trinn for hvert tall under en pivot: 1 pivot og tallet under rammes inn, 2 multiplikatoren lander i L, 3 pennepil fra pivotraden, ny rad og kvitteringslinje. Ingen utregninger eller setninger på widgeten — en liten trinnviser (1 PIVOT · 2 MULTIPLIKATOR → L · 3 TREKK FRA) viser hvor man er. Uten radbytter (Doolittle), eksakte brøker (stablet); quiz:correct når L og U er ferdige.",
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
