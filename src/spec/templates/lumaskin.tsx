/** Template: the LU machine in the W17 style (Felix 2026-10-15: «lag LU maskinen med nye settinger … det kan fortsatt
    være labels og piler og sirkler og andre ting som vi bruker i videoene»). The video's board (LU v7) as a widget:
    square brackets and NewCM numerals, «PIVOT» in blue with its arrow, the number under it in orange, a pen-drawn
    orange arrow from the pivot row to the row being cleared with the MULTIPLIKATOR readout beside it (under ÷ pivot,
    coloured like the matrix), a small orange ring with m beside every new 0, the KVITTERING card that collects the row
    operations and an arrow down to L, whose orange dots fill with the multipliers. Text is only the W17 voices: caps
    labels, the card, and one centred caps status («MÅL · NULLER UNDER PIVOTEN» → «M = LU»). The next orange number can
    be pressed to do the step (Brilliant: act on the figure); «Neste steg» does the same. Doolittle without row
    exchanges; exact fractions; quiz:correct when L and U are complete. */
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
  big: number;
  xs: number[];
  ys: number[];
  bl: number;
  br: number;
  bt: number;
  bb: number;
  cw: number;
  pivY: number;
  capY: number | null;
  arrX0: number;
  arrXl: number;
  readout:
    { side: "left"; right: number } | { side: "below"; cx: number; y: number };
  card: {
    x: number;
    y: number;
    w: number;
    h: number;
    f: number;
    y0: number;
    step: number;
  };
  recArrow: [number, number, number, number] | null;
  lf: number;
  lxs: number[];
  lys: number[];
  lb: [number, number, number, number];
  capsF: number;
}

function layout(n: number, nOps: number, narrow: boolean): Lay {
  const small = n > 3;
  if (!narrow) {
    const big = small ? 25 : 30;
    const cw = small ? 54 : 64;
    const rh = small ? 44 : 52;
    const bx = 344;
    const y0 = 128;
    const xs = Array.from({ length: n }, (_, c) => bx + (c - (n - 1) / 2) * cw);
    const ys = Array.from({ length: n }, (_, r) => y0 + r * rh);
    const bl = xs[0] - cw / 2 - 2;
    const br = xs[n - 1] + cw / 2 + 2;
    const bt = ys[0] - rh / 2 - 4;
    const bb = ys[n - 1] + rh / 2 + 4;
    const pivY = bt - 24;
    const cardY = pivY - 6;
    const f = 18;
    const card = {
      x: 486,
      y: cardY,
      w: 200,
      h: 50 + nOps * 26,
      f,
      y0: cardY + 54,
      step: 26,
    };
    const lf = small ? 17 : 19;
    const lcw = small ? 34 : 38;
    const lrh = small ? 26 : 30;
    const lcx = 600;
    const lt = card.y + card.h + 40;
    const lxs = Array.from(
      { length: n },
      (_, c) => lcx + (c - (n - 1) / 2) * lcw,
    );
    const lys = Array.from({ length: n }, (_, r) => lt + 4 + lrh / 2 + r * lrh);
    const lb: [number, number, number, number] = [
      lxs[0] - lcw / 2 - 2,
      lxs[n - 1] + lcw / 2 + 2,
      lt,
      lys[n - 1] + lrh / 2 + 4,
    ];
    const capY = bb + 24;
    return {
      vw: 720,
      h: Math.max(capY, lb[3]) + 20,
      big,
      xs,
      ys,
      bl,
      br,
      bt,
      bb,
      cw,
      pivY,
      capY,
      arrX0: bl - 8,
      arrXl: bl - 38,
      readout: { side: "left", right: bl - 54 },
      card,
      recArrow: [
        card.x + card.w / 2,
        card.y + card.h + 14,
        card.x + card.w / 2,
        lt - 6,
      ],
      lf,
      lxs,
      lys,
      lb,
      capsF: 11,
    };
  }
  const big = small ? 20 : 24;
  const cw = small ? 50 : 62;
  const rh = small ? 36 : 42;
  const bx = 222;
  const y0 = 96;
  const xs = Array.from({ length: n }, (_, c) => bx + (c - (n - 1) / 2) * cw);
  const ys = Array.from({ length: n }, (_, r) => y0 + r * rh);
  const bl = xs[0] - cw / 2 - 2;
  const br = xs[n - 1] + cw / 2 + 2;
  const bt = ys[0] - rh / 2 - 4;
  const bb = ys[n - 1] + rh / 2 + 4;
  const pivY = bt - 22;
  const ry = bb + 28;
  const cardY = ry + 76;
  const card = {
    x: 14,
    y: cardY,
    w: 186,
    h: 46 + nOps * 24,
    f: 16,
    y0: cardY + 50,
    step: 24,
  };
  const lf = small ? 15 : 17;
  const lcw = small ? 30 : 34;
  const lrh = small ? 24 : 27;
  const lcx = 300;
  const lt = cardY + 22;
  const lxs = Array.from(
    { length: n },
    (_, c) => lcx + (c - (n - 1) / 2) * lcw,
  );
  const lys = Array.from({ length: n }, (_, r) => lt + 4 + lrh / 2 + r * lrh);
  const lb: [number, number, number, number] = [
    lxs[0] - lcw / 2 - 2,
    lxs[n - 1] + lcw / 2 + 2,
    lt,
    lys[n - 1] + lrh / 2 + 4,
  ];
  return {
    vw: 380,
    h: Math.max(card.y + card.h + 12, lb[3]) + 16,
    big,
    xs,
    ys,
    bl,
    br,
    bt,
    bb,
    cw,
    pivY,
    capY: null,
    arrX0: bl - 8,
    arrXl: bl - 34,
    readout: { side: "below", cx: bx, y: ry },
    card,
    recArrow: null,
    lf,
    lxs,
    lys,
    lb,
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
  const total = data ? data.steps.length : 0;
  const finished = !!data && !data.error && total > 0 && idx >= total;

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
  const L = layout(n, (n * (n - 1)) / 2, narrow);
  const cur = idx === 0 ? m0 : steps[idx - 1].after;
  const last = idx > 0 ? steps[idx - 1] : null;
  const next = idx < total ? steps[idx] : null;
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
  const caps = (
    x: number,
    y: number,
    s: string,
    fill: string,
    anchor: "start" | "middle" | "end" = "middle",
  ) => (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize={L.capsF}
      fill={fill}
      style={capsStyle}
    >
      {s}
    </text>
  );
  const go = (k: number) => setIdx(Math.max(0, Math.min(total, k)));

  // which cells have been cleared, and with which multiplier
  const cleared = new Map<string, Frac>();
  steps.slice(0, idx).forEach((s) => cleared.set(`${s.i},${s.k}`, s.l));
  const pk = next ? next.k : -1; // the pivot in play

  /* ---------------------------------------------------------------- the working copy */
  const cells: ReactNode[] = [];
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const x = L.xs[c];
      const y = L.ys[r];
      const v = fTxt(cur[r][c]);
      const isCleared = cleared.has(`${r},${c}`);
      let fill = ink;
      if (finished) fill = c >= r ? blue : muted;
      else if (isCleared) fill = muted;
      else if (r === pk && c === pk) fill = blue;
      else if (c === pk && r > pk) fill = orange;
      const fresh = !!last && r === last.i; // the row that just changed
      const isNext = !!next && !stuck && r === next.i && c === next.k;
      cells.push(
        <g
          key={`${r},${c}${fresh ? `@${idx}` : ""}`}
          className={fresh ? "lum-in" : undefined}
        >
          {isNext ? (
            <circle
              className="lum-halo"
              cx={x}
              cy={y}
              r={L.big * 0.78}
              fill="none"
              stroke={orange}
              strokeOpacity={0.55}
              strokeWidth={1.5}
            />
          ) : null}
          <Num a={cur[r][c]} x={x} y={y} f={L.big} fill={fill} />
          {isNext ? (
            <rect
              x={x - L.cw / 2}
              y={y - L.big * 0.8}
              width={L.cw}
              height={L.big * 1.6}
              fill="transparent"
              style={{ cursor: "pointer" }}
              role="button"
              tabIndex={0}
              aria-label={`Gjør ${v} under pivoten til 0`}
              onClick={() => go(idx + 1)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  go(idx + 1);
                }
              }}
            />
          ) : null}
        </g>,
      );
    }

  // the multiplier left beside each new 0 (the video's small orange ring)
  const rings: ReactNode[] = [];
  cleared.forEach((m, key) => {
    const [r, c] = key.split(",").map(Number);
    const f = L.big * 0.42;
    const rad = Math.max(f * 0.9, numW(m, f) / 2 + 4, m.d === 1 ? 0 : f * 1.15);
    const cx = L.xs[c] + L.big * 0.42 + rad;
    const cy = L.ys[r] + L.big * 0.4;
    const isNew = !!last && last.i === r && last.k === c;
    rings.push(
      <g
        key={`ring${key}`}
        className={isNew ? "lum-pop" : undefined}
        style={{ opacity: finished ? 0.45 : 1 }}
      >
        <circle
          cx={cx}
          cy={cy}
          r={rad}
          fill="none"
          stroke={orange}
          strokeWidth={1.3}
        />
        <Num a={m} x={cx} y={cy} f={f} fill={orange} />
      </g>,
    );
  });

  /* ---------------------------------------------------------------- PIVOT label and its arrow */
  let pivot: ReactNode = null;
  if (next && !stuck) {
    const px = L.xs[pk];
    const py = L.ys[pk];
    const top = py - L.big * 0.78;
    if (pk === 0) {
      pivot = (
        <g key={`piv${pk}`} className="lum-in">
          {caps(px, L.pivY, "PIVOT", blue)}
          <path
            d={`M ${px} ${L.pivY + 6} V ${top}`}
            stroke={blue}
            strokeWidth={1.4}
            fill="none"
          />
          <path
            d={head(px, top, Math.PI / 2, 6)}
            stroke={blue}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    } else {
      // from above the matrix, down the gap between two columns, then in to the pivot (as in the video)
      const lx = px + L.cw / 2;
      const ex = px + L.big * 0.42;
      const ey = py - L.big * 0.62;
      const turn = ey - 14;
      const a = Math.atan2(ey - turn, ex - lx);
      pivot = (
        <g key={`piv${pk}`} className="lum-in">
          {caps(lx, L.pivY, "PIVOT", blue)}
          <path
            d={`M ${lx} ${L.pivY + 6} V ${turn} L ${ex} ${ey}`}
            stroke={blue}
            strokeWidth={1.4}
            fill="none"
            strokeLinejoin="round"
          />
          <path
            d={head(ex, ey, a, 6)}
            stroke={blue}
            strokeWidth={1.4}
            fill="none"
            strokeLinecap="round"
          />
        </g>
      );
    }
  }

  /* ---------------------------------------------------------------- the row operation: arrow + multiplier readout */
  let op: ReactNode = null;
  if (last && !finished) {
    const y1 = L.ys[last.k];
    const y2 = L.ys[last.i];
    const x0 = L.arrX0;
    const xl = L.arrXl;
    const rr = 10;
    const d = `M ${x0} ${y1} H ${xl + rr} Q ${xl} ${y1} ${xl} ${y1 + rr} V ${y2 - rr} Q ${xl} ${y2} ${xl + rr} ${y2} H ${x0}`;
    // MULTIPLIKATOR  m = under / pivot = l   — under orange, pivot blue, as in the matrix
    const f = narrow ? 18 : 20;
    const fs = f * 0.86;
    const under = fTxt(last.under);
    const piv = fTxt(last.pivot);
    const val = last.l;
    const gap = f * 0.32;
    const wm = textW("m", f, true);
    const weq = textW("=", f);
    const wfr = Math.max(textW(under, fs), textW(piv, fs)) + 8;
    const wval = numW(val, f);
    const wAll = wm + gap + weq + gap + wfr + gap + weq + gap + wval;
    const capH = 26;
    let fx: number;
    let axis: number;
    let capX: number;
    let capAnchor: "start" | "middle" | "end";
    if (L.readout.side === "left") {
      fx = L.readout.right - wAll;
      axis = (y1 + y2) / 2 + 12;
      capX = L.readout.right;
      capAnchor = "end";
    } else {
      fx = L.readout.cx - wAll / 2;
      axis = L.readout.y + capH + 6;
      capX = L.readout.cx;
      capAnchor = "middle";
    }
    const capY = L.readout.side === "left" ? axis - capH - 4 : L.readout.y;
    const base = axis + f * 0.26;
    let x = fx;
    const xEq1 = x + wm + gap;
    const xFr = xEq1 + weq + gap;
    const xEq2 = xFr + wfr + gap;
    const xVal = xEq2 + weq + gap;
    x = xVal;
    op = (
      <g key={`op${idx}`}>
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
        <g className="lum-in">
          {caps(capX, capY, "MULTIPLIKATOR", orange, capAnchor)}
          <g style={{ fontFamily: MATH }}>
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
              a={val}
              x={x + wval / 2}
              y={val.d === 1 ? base - f * 0.34 : axis}
              f={f}
              fill={orange}
            />
          </g>
        </g>
      </g>
    );
  }

  /* ---------------------------------------------------------------- name / caption of the working copy */
  const nameLeft = idx === 0 ? navn : finished ? "U" : null;
  const nameFill = finished ? blue : ink;
  const name = nameLeft ? (
    <text
      key={`name${nameLeft}`}
      className="lum-in"
      x={L.bl - 14}
      y={(L.ys[0] + L.ys[n - 1]) / 2 + L.big * 0.34}
      textAnchor="end"
      fontSize={L.big}
      fontStyle="italic"
      fill={nameFill}
      style={{ fontFamily: MATH }}
    >
      {nameLeft}
    </text>
  ) : null;

  /* ---------------------------------------------------------------- the receipt */
  const C = L.card;
  const zig = (() => {
    const tooth = 10;
    const k = Math.round(C.w / tooth);
    let d = `M ${C.x} ${C.y} H ${C.x + C.w} V ${C.y + C.h}`;
    for (let j = k - 1; j >= 0; j--)
      d += ` L ${C.x + (j + 0.5) * (C.w / k)} ${C.y + C.h + 6} L ${C.x + j * (C.w / k)} ${C.y + C.h}`;
    return d + " Z";
  })();
  const lines = steps.slice(0, idx).map((s, j) => {
    const m = fTxt(s.l);
    const neg = s.l.n < 0;
    const f = C.f;
    const sb = f * 0.66;
    return (
      <text
        key={j}
        className={j === idx - 1 ? "lum-in" : undefined}
        x={C.x + 18}
        y={C.y0 + j * C.step}
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
        <tspan fill={orange}>{m}</tspan>
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
  for (let r = 0; r < n; r++)
    for (let c = 0; c < n; c++) {
      const x = L.lxs[c];
      const y = L.lys[r];
      if (c < r) {
        const m = cleared.get(`${r},${c}`);
        const isNew = !!last && last.i === r && last.k === c;
        lcells.push(
          m ? (
            <g key={`l${r}${c}`} className={isNew ? "lum-pop" : undefined}>
              <Num a={m} x={x} y={y} f={L.lf} fill={orange} />
            </g>
          ) : (
            <circle key={`l${r}${c}`} cx={x} cy={y} r={3.2} fill={orange} />
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

  const status = stuck
    ? "Pivoten er 0 · radbytte trengs"
    : finished
      ? `${navn} = LU`
      : "Mål · nuller under pivoten";
  const aria = `LU-faktorisering, steg ${idx} av ${total}`;

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
        <path
          d={brackets(L.bl, L.br, L.bt, L.bb, 10)}
          stroke={finished ? blue : ink}
          strokeWidth={1.8}
          fill="none"
        />
        {name}
        {cells}
        {rings}
        {pivot}
        {op}
        {L.capY !== null && idx > 0 && !finished
          ? caps((L.bl + L.br) / 2, L.capY, "ARBEIDSKOPI", muted)
          : null}
        {/* the receipt */}
        <path d={zig} fill="var(--kt-bg-panel)" />
        {caps(C.x + C.w / 2, C.y + 24, "KVITTERING", muted)}
        {lines}
        {L.recArrow ? (
          <g>
            <path
              d={`M ${L.recArrow[0]} ${L.recArrow[1]} V ${L.recArrow[3]}`}
              stroke={orange}
              strokeWidth={1.6}
              fill="none"
            />
            <path
              d={head(L.recArrow[2], L.recArrow[3], Math.PI / 2, 6)}
              stroke={orange}
              strokeWidth={1.6}
              fill="none"
              strokeLinecap="round"
            />
          </g>
        ) : null}
        {/* L */}
        <path
          d={brackets(lbl, lbr, lbt, lbb, 7)}
          stroke={ink}
          strokeWidth={1.4}
          fill="none"
        />
        <text
          x={lbl - 12}
          y={(lbt + lbb) / 2 + L.lf * 0.4}
          textAnchor="end"
          fontSize={L.lf * 1.2}
          fontStyle="italic"
          fill={orange}
          style={{ fontFamily: MATH }}
        >
          L
        </text>
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
      <p
        className={finished ? "kviz-capline is-done" : "kviz-capline"}
        aria-live="polite"
      >
        {status}
      </p>
      <p className="kviz-capline is-small">{`steg ${Math.min(idx, total)} / ${total}`}</p>
    </div>
  );
}

registerTemplate({
  id: "lu-maskin",
  description:
    "LU-maskinen i W17-stil (videoens tavle som widget): arbeidskopien med «PIVOT»-pil i blått og tallet under i oransje, en pennetegnet pil fra pivotraden til raden som nulles med MULTIPLIKATOR-avlesningen m = under ÷ pivot, en liten oransje ring med m ved hver ny 0, KVITTERING-kortet med radoperasjonene og pil ned til L, der de oransje prikkene fylles. Bare versal-etiketter, kortet og én sentrert versal-status («MÅL · NULLER UNDER PIVOTEN» → «M = LU»). Det oransje tallet kan trykkes for å gjøre steget. Uten radbytter (Doolittle), eksakte brøker; quiz:correct når L og U er ferdige.",
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
