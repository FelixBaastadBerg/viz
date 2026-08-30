/** Template: Dijkstra's algorithm — step through the run on a weighted graph.
 *
 * The play-with-it companion to the dijkstra video: SAME graph, SAME colours
 * (blue graph, orange current node/fresh update, green finished + final path).
 * Chrome per W1–W5: intro with KaTeX above, one font, a status line under the
 * figure narrating each step (the pedagogical readout — not a control twin),
 * step buttons at Brilliant scale.
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
const fmtD = (d: number) => (d === INF ? "\\infty" : String(d));

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
      status: `**Steg 1:** nærmeste uferdige node er $${u}$, med $\\mathrm{dist}(${u}) = ${dist[u]}$.`,
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
            ? `**Steg 2:** relaksérer $${u}$–$${v}$: $${dist[u]} + ${w} = ${cand}$ — første vei til $${v}$.`
            : `**Steg 2:** relaksérer $${u}$–$${v}$: $${dist[u]} + ${w} = ${cand} < ${old}$ — bedre vei, oppdaterer!`
          : `**Steg 2:** relaksérer $${u}$–$${v}$: $${dist[u]} + ${w} = ${cand} \\geq ${fmtD(old)}$ — ikke bedre, beholder.`,
      });
      if (improved) { dist[v] = cand; prev[v] = u; }
    }
    done.add(u);
    steps.push({
      kind: "finish", u,
      status: `$${u}$ er ferdig — $\\mathrm{dist}(${u}) = ${dist[u]}$ kan aldri bli bedre.`,
    });
  }
  const path: string[] = [];
  for (let n: string | null = target; n; n = prev[n]) path.unshift(n);
  steps.push({
    kind: "done",
    status: `**Ferdig!** Korteste vei ${path.join("–")} har lengde $${dist[target]}$.`,
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
    ? `Start: $\\mathrm{dist}(${source}) = 0$, alle andre $\\infty$. Trykk **Neste steg**.`
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
    <div className="kviz-widget">
      {params.intro ? (
        <p className="kviz-intro"><KMixed text={params.intro as string} /></p>
      ) : null}

      <svg viewBox="-235 -128 470 268" style={{ width: "100%", display: "block" }}
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
          return (
            <g key={key}>
              <line x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={onPath ? right.stroke : hot ? touch.stroke : obj.stroke}
                strokeWidth={onPath ? 4.5 : hot ? 4 : 2}
                strokeLinecap="round" />
              <text x={(x1 + x2) / 2 + nx * WSIDE[key] * 15}
                y={(y1 + y2) / 2 + ny * WSIDE[key] * 15}
                fill={t.text.muted} fontSize="13" textAnchor="middle"
                dominantBaseline="middle">{w}</text>
            </g>
          );
        })}
        {Object.entries(NODES).map(([name, pos]) => {
          const [x, y] = px(pos);
          const fin = state.finished.has(name);
          const cur = state.current === name;
          const d = state.dist[name];
          const distColor = fin ? right.ink
            : state.hotNode === name ? touch.ink : t.text.muted;
          return (
            <g key={name}>
              {cur && (
                <circle cx={x} cy={y} r={R + 6} fill="none"
                  stroke={touch.stroke} strokeWidth={3.5} />
              )}
              <circle cx={x} cy={y} r={R} fill={t.stage.canvas}
                stroke={fin ? right.stroke : obj.stroke} strokeWidth={2.4} />
              {fin && (
                <circle cx={x} cy={y} r={R} fill={right.stroke} fillOpacity={0.14} />
              )}
              <text x={x} y={y + 1} fill={t.text.primary} fontSize="15"
                fontWeight={600} textAnchor="middle"
                dominantBaseline="middle">{name}</text>
              <text x={x + DOFF[name][0]} y={y + DOFF[name][1]} fill={distColor}
                fontSize="13" fontWeight={600} textAnchor="middle">
                {d === INF ? "∞" : d}
              </text>
            </g>
          );
        })}
      </svg>

      <p className="kviz-intro" style={{ minHeight: "2.6em", marginTop: 4 }}>
        <KMixed text={status.replace(/\*\*(.*?)\*\*/g, "$1")} />
      </p>

      <div className="kviz-widget-controls" style={{ justifyContent: "center", gap: 10 }}>
        <button className="kviz-btn" disabled={idx === 0}
          onClick={() => setIdx((i) => Math.max(0, i - 1))}>← Tilbake</button>
        <button className="kviz-btn kviz-btn--primary" disabled={idx >= steps.length}
          onClick={() => setIdx((i) => Math.min(steps.length, i + 1))}>
          Neste steg →</button>
        <button className="kviz-btn" disabled={idx === 0}
          onClick={() => setIdx(0)}>Nullstill</button>
      </div>
    </div>
  );
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
