/** Template: Dijkstra's algorithm — step through the run on a weighted graph.
 *
 * The play-with-it companion to the dijkstra video: SAME graph, SAME colours
 * (blue graph, orange current node/fresh update, green finished + final path).
 * Video style (W15, Felix 2026-10-12: the old Poppins/thin-circle look «liker jeg ikke»): pen-weight edges with
 * a faint bow, hand-drawn white paper nodes with a dark edge, Patrick Hand labels, an orange hand-drawn ring
 * on the node being processed, and the lu-steg controls + plain-words status line under the figure.
 *
 * The widget is deterministic: the full event log is precomputed, the step
 * index is the only state, so Tilbake is exact.
 */
import { useMemo, useState } from "react";
import { KMixed } from "../../chrome";
import { useKtTheme } from "../../theme/ThemeProvider";
import { registerTemplate } from "../registry";

type P = Record<string, unknown>;

/* same graph as video/scenes/dijkstra.py — SVG coords (y down) */
const NODES: Record<string, [number, number]> = {
  A: [-3.4, 0.0], B: [-1.5, -1.4], C: [-1.2, 1.5],
  D: [0.9, -0.6], E: [1.6, 1.3], F: [3.4, -0.2],
};
const EDGES: [string, string, number][] = [
  ["A", "B", 2], ["A", "C", 5], ["B", "C", 2], ["B", "D", 6],
  ["C", "D", 3], ["C", "E", 6], ["D", "E", 1], ["D", "F", 5], ["E", "F", 2],
];
/* weight-label side, mirroring the video's WSIDE (sign flipped for y-down) */
const WSIDE: Record<string, number> = {
  AB: -1, AC: 1, BC: 1, BD: -1, CD: 1, CE: 1, DE: 1, DF: -1, EF: 1,
};
/* dist-label offset per node (px) — keeps labels off incoming edges */
const DOFF: Record<string, [number, number]> = {
  A: [0, -31], B: [0, -31], C: [0, 40], D: [0, -31], E: [0, 40], F: [0, -31],
};

interface Step {
  kind: "select" | "relax" | "finish" | "done";
  u?: string;
  v?: string;
  w?: number;
  cand?: number;
  old?: number;
  status: string;
}

const INF = Infinity;
const fmtD = (d: number) => (d === INF ? "∞" : String(d));

function neighbours(u: string): [string, string, number][] {
  const out: [string, string, number][] = [];
  for (const [a, b, w] of EDGES) {
    if (a === u) out.push([b, a + b, w]);
    if (b === u) out.push([a, a + b, w]);
  }
  return out;
}

/** Precompute the whole run as narrated steps. */
function runDijkstra(source: string, target: string) {
  const dist: Record<string, number> = {};
  const prev: Record<string, string | null> = {};
  const done = new Set<string>();
  for (const n of Object.keys(NODES)) { dist[n] = INF; prev[n] = null; }
  dist[source] = 0;
  const steps: Step[] = [];
  for (;;) {
    let u: string | null = null;
    for (const n of Object.keys(NODES))
      if (!done.has(n) && dist[n] < INF && (u === null || dist[n] < dist[u]))
        u = n;
    if (u === null) break;
    steps.push({
      kind: "select", u,
      status: `Nærmeste uferdige node er ${u}, med dist(${u}) = ${dist[u]}.`,
    });
    for (const [v, , w] of neighbours(u)) {
      if (done.has(v)) continue;
      const cand = dist[u] + w;
      const old = dist[v];
      const improved = cand < old;
      steps.push({
        kind: "relax", u, v, w, cand, old,
        status: improved
          ? old === INF
            ? `Kanten ${u}–${v}: ${dist[u]} + ${w} = ${cand}. Første vei til ${v}.`
            : `Kanten ${u}–${v}: ${dist[u]} + ${w} = ${cand} < ${old}. Bedre vei, oppdaterer.`
          : `Kanten ${u}–${v}: ${dist[u]} + ${w} = ${cand} ≥ ${fmtD(old)}. Ikke bedre, beholder.`,
      });
      if (improved) { dist[v] = cand; prev[v] = u; }
    }
    done.add(u);
    steps.push({
      kind: "finish", u,
      status: `${u} er ferdig: dist(${u}) = ${dist[u]} kan aldri bli bedre.`,
    });
  }
  const path: string[] = [];
  for (let n: string | null = target; n; n = prev[n]) path.unshift(n);
  steps.push({
    kind: "done",
    status: `Ferdig! Korteste vei ${path.join("–")} har lengde ${dist[target]}.`,
  });
  return { steps, path };
}

function DijkstraGraf({ params }: { params: P }) {
  const t = useKtTheme();
  const source = (params.source as string) ?? "A";
  const target = (params.target as string) ?? "F";
  const { steps, path } = useMemo(() => runDijkstra(source, target), [source, target]);
  const [idx, setIdx] = useState(0);

  /* replay events 0..idx-1 into a render state */
  const state = useMemo(() => {
    const dist: Record<string, number> = {};
    for (const n of Object.keys(NODES)) dist[n] = INF;
    dist[source] = 0;
    const finished = new Set<string>();
    let current: string | null = null;
    let hotEdge: string | null = null;
    let hotNode: string | null = null;
    let isDone = false;
    for (let i = 0; i < idx; i++) {
      const s = steps[i];
      hotEdge = null; hotNode = null;
      if (s.kind === "select") current = s.u!;
      else if (s.kind === "relax") {
        hotEdge = [s.u!, s.v!].sort().join("");
        if (s.cand! < s.old!) { dist[s.v!] = s.cand!; hotNode = s.v!; }
      } else if (s.kind === "finish") { finished.add(s.u!); current = null; }
      else if (s.kind === "done") isDone = true;
    }
    return { dist, finished, current, hotEdge, hotNode, isDone };
  }, [idx, steps, source]);

  const status = idx === 0
    ? `Start: dist(${source}) = 0, alle andre ∞. Trykk «Neste steg».`
    : steps[idx - 1].status;

  const pathEdges = new Set(
    path.slice(1).map((n, i) => [path[i], n].sort().join(""))
  );

  const obj = t.accents.object;
  const touch = t.accents.touch;
  const right = t.accents.right;

  const S = 56; // px per graph unit
  const R = 22; // node radius px
  const px = ([x, y]: [number, number]) => [x * S, y * S];

  return (
    <div className="kviz-widget kviz-dij">
      {params.intro ? (
        <p className="kviz-intro"><KMixed text={params.intro as string} /></p>
      ) : null}

      <svg viewBox="-235 -132 470 276" style={{ width: "100%", display: "block" }}
        role="img" aria-label="graf for Dijkstras algoritme">
        {EDGES.map(([a, b, w]) => {
          const key = a + b;
          const [x1, y1] = px(NODES[a]);
          const [x2, y2] = px(NODES[b]);
          const dx = x2 - x1, dy = y2 - y1;
          const len = Math.hypot(dx, dy);
          const nx = -dy / len, ny = dx / len;
          const onPath = state.isDone && pathEdges.has(key);
          const hot = state.hotEdge === key;
          // a pen line: never ruler-straight — a faint bow, the same every render
          const bow = (seed(key) - 0.5) * 3.2;
          const d = `M ${x1} ${y1} Q ${(x1 + x2) / 2 + nx * bow} ${(y1 + y2) / 2 + ny * bow} ${x2} ${y2}`;
          return (
            <g key={key}>
              <path d={d} fill="none"
                stroke={onPath ? right.stroke : hot ? touch.stroke : obj.stroke}
                strokeWidth={onPath ? 5 : hot ? 4.6 : 2.8}
                strokeLinecap="round" />
              <text className="dij-w" x={(x1 + x2) / 2 + nx * WSIDE[key] * 16}
                y={(y1 + y2) / 2 + ny * WSIDE[key] * 16}
                textAnchor="middle" dominantBaseline="middle">{w}</text>
            </g>
          );
        })}
        {Object.entries(NODES).map(([name, pos]) => {
          const [x, y] = px(pos);
          const fin = state.finished.has(name);
          const cur = state.current === name;
          const dv = state.dist[name];
          const distColor = fin ? right.ink
            : state.hotNode === name ? touch.ink : t.text.muted;
          return (
            <g key={name}>
              {/* a white paper token with a dark pen edge (V45) */}
              <path d={handCircle(x, y, R, name)}
                fill={fin ? `color-mix(in srgb, ${right.stroke} 16%, #fff)` : "#fff"}
                stroke={fin ? right.stroke : "var(--kt-text)"} strokeWidth={2.4} strokeLinecap="round" />
              {cur && (
                <path d={handCircle(x, y, R + 7, name + "ring")} fill="none"
                  stroke={touch.stroke} strokeWidth={3.4} strokeLinecap="round" />
              )}
              <text className="dij-n" x={x} y={y + 1.5}
                textAnchor="middle" dominantBaseline="middle">{name}</text>
              <text className="dij-d" x={x + DOFF[name][0]} y={y + DOFF[name][1] + (DOFF[name][1] > 0 ? 2 : -1)}
                fill={distColor} textAnchor="middle">
                {dv === INF ? "∞" : dv}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="kviz-widget-controls lu-ctrl">
        <button className="kviz-btn lu-pill" disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Forrige</button>
        <button className="kviz-btn kviz-btn--primary lu-pill lu-main" disabled={idx >= steps.length}
          onClick={() => setIdx((i) => Math.min(steps.length, i + 1))}>Neste steg →</button>
        <button className="kviz-btn lu-pill" disabled={idx === 0}
          onClick={() => setIdx(0)}>Nullstill</button>
      </div>
      <p className="lu-status" aria-live="polite">{status}</p>
      <p className="lu-steps">steg {Math.min(idx, steps.length)} av {steps.length}</p>
    </div>
  );
}

/** A deterministic 0..1 from a string (the same wobble every render). */
function seed(k: string): number {
  let h = 2166136261;
  for (let i = 0; i < k.length; i++) h = Math.imul(h ^ k.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

/** A hand-drawn circle: a faint wobble in the radius and a small overshoot where the pen closes it. */
function handCircle(cx: number, cy: number, r: number, key: string): string {
  const s0 = seed(key) * Math.PI * 2;
  const n = 26;
  const pts: [number, number][] = [];
  for (let i = 0; i <= n + 2; i++) {
    const a = s0 + (i / n) * Math.PI * 2;
    const rr = r * (1 + 0.012 * Math.sin(3 * a + s0) + 0.006 * Math.sin(5 * a)) + (i > n ? 0.9 : 0);
    pts.push([cx + rr * Math.cos(a), cy + rr * Math.sin(a)]);
  }
  // Catmull-Rom → cubic Bézier
  let d = `M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C ${c1[0].toFixed(2)} ${c1[1].toFixed(2)} ${c2[0].toFixed(2)} ${c2[1].toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;
  }
  return d;
}

registerTemplate({
  id: "dijkstra-graf",
  description:
    "Dijkstras algoritme steg for steg på en vektet graf (samme graf som videoen): velg nærmeste uferdige node, relaksér naboene, les statuslinja. Avstander står ved nodene; ferdige noder og endelig vei blir grønne. For grafalgoritmer (Algdat).",
  curriculum: ["universitet"],
  params: {
    intro: { type: { kind: "string" }, default: "", doc: "introtekst over figuren; $...$ blir KaTeX" },
    source: { type: { kind: "string", oneOf: ["A", "B", "C", "D", "E", "F"] }, default: "A", doc: "startnode" },
    target: { type: { kind: "string", oneOf: ["A", "B", "C", "D", "E", "F"] }, default: "F", doc: "målnode (veien markeres til slutt)" },
  },
  example: {
    template: "dijkstra-graf",
    title: "Dijkstra steg for steg",
    params: {
      intro:
        "Grafen fra videoen. Trykk deg gjennom kjøringen: oransje ring er noden som behandles, tallet over hver node er $\\mathrm{dist}$, og grønt betyr ferdig. Regelen i hvert steg: $\\mathrm{dist}(v) = \\min(\\mathrm{dist}(v),\\ \\mathrm{dist}(u) + w(u,v))$.",
      source: "A",
      target: "F",
    },
  },
  render: (params) => <DijkstraGraf params={params} />,
});
