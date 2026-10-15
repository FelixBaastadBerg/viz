/** Template: Dijkstra's algorithm in the current style (Felix 2026-10-15: «dijktras må bytte til nåværende stil. både at
    deler er håndtegnet og skriften. er bedre med en tabell / liste med distanser … sånn som dijktras faktisk har som er
    i grått»). The same graph and the same run as dijkstra-graf (the video's graph), drawn like the LU machine (W17/W18):
    GRAFEN | AVSTANDER side by side with caps labels on one line, sharing top and bottom — straight edges, round nodes,
    NewCM numerals; the distances live in a grey card as the algorithm keeps them (node, distance, from), not on the
    figure. Colours in the video's order: the node being processed blue, the edge being tried and the value it updates
    yellow, finished nodes and the shortest path orange (the answer). A small stepper (① velg nærmeste · ② oppdater
    naboene · ③ ferdig) instead of status sentences. Geometry depends on nothing but the layout (tests/dijkstramaskin). */
import {
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";
import { EDGES, NODES, WSIDE, runDijkstra } from "./dijkstra";

type P = Record<string, unknown>;

const MATH = '"Kateter NewCM", "KaTeX_Main", "Times New Roman", serif';
const INF = Infinity;
const PHASES = ["Velg nærmeste", "Oppdater naboene", "Ferdig"];
const NAMES = Object.keys(NODES);

/** Board geometry: the graph block and the distance card side by side (phone: stacked), same top and bottom. */
export interface DLay {
  vw: number;
  h: number;
  labelY: number;
  graph: {
    x: number;
    y: number;
    w: number;
    h: number;
    s: number;
    cx: number;
    cy: number;
    r: number;
    f: number;
  };
  card: {
    x: number;
    y: number;
    w: number;
    h: number;
    rowH: number;
    y0: number;
    cols: [number, number, number];
    f: number;
  };
  cardLabelY: number;
  capsF: number;
}

export function dlayout(narrow: boolean): DLay {
  const xs = NAMES.map((n) => NODES[n][0]);
  const ys = NAMES.map((n) => NODES[n][1]);
  const spanX = Math.max(...xs) - Math.min(...xs);
  const spanY = Math.max(...ys) - Math.min(...ys);
  const midX = (Math.max(...xs) + Math.min(...xs)) / 2;
  const midY = (Math.max(...ys) + Math.min(...ys)) / 2;
  const rows = NAMES.length + 1; // header + one row per node
  if (!narrow) {
    const top = 36;
    const h = 250;
    const gw = 440;
    const gap = 30;
    const cw = 196;
    const x0 = (720 - (gw + gap + cw)) / 2;
    const r = 19;
    const s = Math.min((gw - 2 * (r + 26)) / spanX, (h - 2 * (r + 22)) / spanY);
    const rowH = (h - 20) / rows;
    const cx = x0 + gw + gap;
    return {
      vw: 720,
      h: top + h + 14,
      labelY: 22,
      graph: {
        x: x0,
        y: top,
        w: gw,
        h,
        s,
        cx: x0 + gw / 2 - midX * s,
        cy: top + h / 2 - midY * s,
        r,
        f: 18,
      },
      card: {
        x: cx,
        y: top,
        w: cw,
        h,
        rowH,
        y0: top + 10 + rowH / 2,
        cols: [cx + 30, cx + 104, cx + 166],
        f: 18,
      },
      cardLabelY: 22,
      capsF: 11,
    };
  }
  const top = 32;
  const gh = 200;
  const gw = 356;
  const x0 = 12;
  const r = 16;
  const s = Math.min((gw - 2 * (r + 18)) / spanX, (gh - 2 * (r + 16)) / spanY);
  const ctop = top + gh + 40;
  const ch = 214;
  const rowH = (ch - 16) / rows;
  return {
    vw: 380,
    h: ctop + ch + 12,
    labelY: 20,
    graph: {
      x: x0,
      y: top,
      w: gw,
      h: gh,
      s,
      cx: x0 + gw / 2 - midX * s,
      cy: top + gh / 2 - midY * s,
      r,
      f: 16,
    },
    card: {
      x: x0,
      y: ctop,
      w: gw,
      h: ch,
      rowH,
      y0: ctop + 8 + rowH / 2,
      cols: [x0 + 60, x0 + 180, x0 + 296],
      f: 16,
    },
    cardLabelY: ctop - 14,
    capsF: 10.5,
  };
}

function DijkstraMaskin({ params }: { params: P }) {
  const t = useKtTheme();
  const source = (params.source as string) ?? "A";
  const target = (params.target as string) ?? "F";
  const { steps, path } = useMemo(
    () => runDijkstra(source, target),
    [source, target],
  );
  const [idx, setIdx] = useState(0);
  const total = steps.length;
  const go = (k: number) => setIdx(Math.max(0, Math.min(total, k)));

  const root = useRef<HTMLDivElement>(null);
  const [narrow, setNarrow] = useState(false);
  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const fit = () => setNarrow(el.clientWidth > 0 && el.clientWidth < 600);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // replay the run up to idx
  const st = useMemo(() => {
    const dist: Record<string, number> = {};
    const prev: Record<string, string | null> = {};
    for (const n of NAMES) {
      dist[n] = INF;
      prev[n] = null;
    }
    dist[source] = 0;
    const finished = new Set<string>();
    let current: string | null = null;
    let hotEdge: string | null = null;
    let hotNode: string | null = null;
    let tried: string | null = null;
    let kind: string | null = null;
    for (let i = 0; i < idx; i++) {
      const s = steps[i];
      hotEdge = null;
      hotNode = null;
      tried = null;
      kind = s.kind;
      if (s.kind === "select") current = s.u!;
      else if (s.kind === "relax") {
        hotEdge = [s.u!, s.v!].sort().join("");
        tried = s.v!;
        if (s.cand! < s.old!) {
          dist[s.v!] = s.cand!;
          prev[s.v!] = s.u!;
          hotNode = s.v!;
        }
      } else if (s.kind === "finish") {
        finished.add(s.u!);
        current = null;
      }
    }
    return {
      dist,
      prev,
      finished,
      current,
      hotEdge,
      hotNode,
      tried,
      kind,
      isDone: kind === "done",
    };
  }, [idx, steps, source]);

  const L = dlayout(narrow);
  const G = L.graph;
  const C = L.card;
  const ink = t.text.primary;
  const muted = t.text.muted;
  const orange = t.accents.touch.ink;
  const blue = t.accents.object.ink;
  const yellow = t.accents.alt.ink;
  const edgeInk = t.structure.axis;
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
  const P = (n: string): [number, number] => [
    G.cx + NODES[n][0] * G.s,
    G.cy + NODES[n][1] * G.s,
  ];
  const pathEdges = new Set(
    path.slice(1).map((n, i) => [path[i], n].sort().join("")),
  );

  /* ---------------------------------------------------------------- the graph */
  const edges: ReactNode[] = [];
  const weights: ReactNode[] = [];
  for (const [a, b, w] of EDGES) {
    const key = a + b;
    const [x1, y1] = P(a);
    const [x2, y2] = P(b);
    const len = Math.hypot(x2 - x1, y2 - y1);
    const nx = -(y2 - y1) / len;
    const ny = (x2 - x1) / len;
    const onPath = st.isDone && pathEdges.has(key);
    const hot = st.hotEdge === key;
    edges.push(
      <line
        key={key}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={onPath ? orange : hot ? yellow : edgeInk}
        strokeWidth={onPath ? 3.6 : hot ? 3 : 1.6}
        strokeLinecap="round"
      />,
    );
    const wx = (x1 + x2) / 2 + nx * WSIDE[key] * (G.f * 0.8);
    const wy = (y1 + y2) / 2 + ny * WSIDE[key] * (G.f * 0.8);
    weights.push(
      <text
        key={`w${key}`}
        x={wx}
        y={wy + G.f * 0.3}
        textAnchor="middle"
        fontSize={G.f * 0.85}
        fill={hot ? yellow : muted}
        stroke="var(--kt-bg)"
        strokeWidth={4}
        paintOrder="stroke"
        style={{ fontFamily: MATH }}
      >
        {w}
      </text>,
    );
  }
  const nodes = NAMES.map((n) => {
    const [x, y] = P(n);
    const fin = st.finished.has(n);
    const cur = st.current === n;
    const tried = st.tried === n;
    const stroke = cur ? blue : tried ? yellow : fin ? orange : ink;
    return (
      <g key={n}>
        <circle
          cx={x}
          cy={y}
          r={G.r}
          fill={fin ? t.stage.panelRaised : "var(--kt-bg)"}
          stroke={stroke}
          strokeWidth={cur || tried ? 2.6 : 1.6}
        />
        <text
          x={x}
          y={y + G.f * 0.34}
          textAnchor="middle"
          fontSize={G.f}
          fill={cur ? blue : fin ? orange : ink}
          style={{ fontFamily: MATH }}
        >
          {n}
        </text>
      </g>
    );
  });

  /* ---------------------------------------------------------------- the distance card (as the algorithm keeps it) */
  const rows = NAMES.map((n, i) => {
    const y = C.y0 + (i + 1) * C.rowH;
    const d = st.dist[n];
    const fin = st.finished.has(n);
    const cur = st.current === n;
    const fresh = st.hotNode === n;
    const dv = d === INF ? "∞" : String(d);
    const dFill = fresh ? yellow : fin ? orange : d === INF ? muted : ink;
    return (
      <g key={n}>
        {cur ? (
          <rect
            x={C.x + 8}
            y={y - C.rowH / 2 + 2}
            width={C.w - 16}
            height={C.rowH - 4}
            rx={7}
            fill="none"
            stroke={blue}
            strokeWidth={1.6}
          />
        ) : null}
        <text
          x={C.cols[0]}
          y={y + C.f * 0.34}
          textAnchor="middle"
          fontSize={C.f}
          fill={cur ? blue : fin ? orange : ink}
          style={{ fontFamily: MATH }}
        >
          {n}
        </text>
        <g
          key={`${n}${fresh ? idx : ""}`}
          className={fresh ? "lum-pop" : undefined}
        >
          <text
            x={C.cols[1]}
            y={y + C.f * 0.34}
            textAnchor="middle"
            fontSize={C.f}
            fill={dFill}
            style={{ fontFamily: MATH }}
          >
            {dv}
          </text>
        </g>
        <text
          x={C.cols[2]}
          y={y + C.f * 0.34}
          textAnchor="middle"
          fontSize={C.f * 0.9}
          fill={st.prev[n] ? (fin ? orange : ink) : muted}
          style={{ fontFamily: MATH }}
        >
          {st.prev[n] ?? "–"}
        </text>
      </g>
    );
  });

  const phase =
    st.kind === "select"
      ? 0
      : st.kind === "relax"
        ? 1
        : st.kind === "finish"
          ? 2
          : -1;
  const status = st.isDone
    ? `Korteste vei ${path.join("–")} = ${st.dist[target]}`
    : idx === 0
      ? `Mål · korteste vei fra ${source} til ${target}`
      : null;

  return (
    <div className="kviz-widget kviz-chrome kviz-dijm" ref={root}>
      <svg
        viewBox={`0 0 ${L.vw} ${L.h}`}
        role="img"
        aria-label={`Dijkstras algoritme, steg ${idx} av ${total}`}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          overflow: "visible",
        }}
      >
        {caps(G.x + G.w / 2, L.labelY, "GRAFEN", muted)}
        {edges}
        {weights}
        {nodes}
        {caps(C.x + C.w / 2, L.cardLabelY, "AVSTANDER", muted)}
        <rect
          x={C.x}
          y={C.y}
          width={C.w}
          height={C.h}
          rx={10}
          fill="var(--kt-bg-panel)"
        />
        {caps(C.cols[0], C.y0 + C.f * 0.3, "NODE", muted)}
        {caps(C.cols[1], C.y0 + C.f * 0.3, "AVSTAND", muted)}
        {caps(C.cols[2], C.y0 + C.f * 0.3, "FRA", muted)}
        <line
          x1={C.x + 12}
          x2={C.x + C.w - 12}
          y1={C.y0 + C.rowH / 2}
          y2={C.y0 + C.rowH / 2}
          stroke={muted}
          strokeOpacity={0.35}
          strokeWidth={1}
        />
        {rows}
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
          className={st.isDone ? "kviz-capline is-done" : "kviz-capline"}
          aria-live="polite"
        >
          {status}
        </p>
      ) : (
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
              className={
                k === phase ? "is-on" : k < phase ? "is-done" : undefined
              }
            >
              <span className="lum-n">{k + 1}</span>
              <span className="lum-t">{label}</span>
            </span>
          ))}
        </div>
      )}
      <p className="kviz-capline is-small">{`steg ${Math.min(idx, total)} / ${total}`}</p>
    </div>
  );
}

registerTemplate({
  id: "dijkstra-maskin",
  description:
    "Dijkstras algoritme i dagens stil (som LU-maskinen): GRAFEN og AVSTANDER side ved side — rette kanter, runde noder, NewCM-tall; avstandene står i et grått kort slik algoritmen fører dem (node, avstand, fra). Noden som behandles er blå, kanten som prøves og verdien som oppdateres gul, ferdige noder og korteste vei oransje. Trinnviser (velg nærmeste · oppdater naboene · ferdig) i stedet for statussetninger. Samme graf som videoen.",
  curriculum: ["universitet"],
  params: {
    source: {
      type: { kind: "string", oneOf: ["A", "B", "C", "D", "E", "F"] },
      default: "A",
      doc: "startnode",
    },
    target: {
      type: { kind: "string", oneOf: ["A", "B", "C", "D", "E", "F"] },
      default: "F",
      doc: "målnode (veien markeres til slutt)",
    },
  },
  example: {
    template: "dijkstra-maskin",
    title: "Dijkstra steg for steg",
    params: { source: "A", target: "F" },
  },
  render: (params) => <DijkstraMaskin params={params} />,
});
