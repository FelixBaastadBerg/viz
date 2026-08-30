/**
 * Course page — «Dijkstras algoritme» (Algoritmer og datastrukturer, NTNU).
 * Factory page #3, the first non-calculus one: intro → video (Felix voice) →
 * the algorithm box (two steps + relaxation rule) → worked run (the table) →
 * step-through widget (dijkstra-graf spec, same graph as the video) → quiz.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, arv, loadThemeFonts, KFormula, KMixed, emitQuizEvent } from "@kateter/viz/core";
import { SpecRenderer } from "@kateter/viz/spec";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../../src/kviz.css";
import "../riemann/page.css";

loadThemeFonts(arv);

/* ------------------------------------------------------------- quiz data */
interface Item { id: string; q: string; opts: string[]; answer: number; expl: string }
const ITEMS: Item[] = [
  {
    id: "dijkstra-relaks",
    q: "Hva gjør relakseringssteget $\\mathrm{dist}(v) = \\min(\\mathrm{dist}(v),\\ \\mathrm{dist}(u) + w(u,v))$?",
    opts: [
      "Sjekker om veien gjennom $u$ er kortere enn den beste vi kjenner til $v$ — og oppdaterer i så fall",
      "Fjerner kanten $(u, v)$ fra grafen",
      "Markerer $v$ som ferdig",
      "Legger $w(u,v)$ til alle avstander",
    ],
    answer: 0,
    expl: "Relaksering spør: «blir det kortere å gå via $u$?» Hvis $\\mathrm{dist}(u) + w(u,v)$ er mindre enn dagens $\\mathrm{dist}(v)$, har vi funnet en bedre vei til $v$ — da oppdaterer vi.",
  },
  {
    id: "dijkstra-neste",
    q: "Underveis i en kjøring er avstandene til de uferdige nodene $\\{X: 7,\\ Y: 4,\\ Z: \\infty\\}$. Hvilken node behandles nå?",
    opts: ["$Y$", "$X$", "$Z$", "Den med flest naboer"],
    answer: 0,
    expl: "Dijkstra velger alltid den uferdige noden med minst avstand — her $Y$ med 4. Det er nettopp dette grådige valget som er trygt når alle vekter er ikke-negative.",
  },
  {
    id: "dijkstra-negativ",
    q: "Hvorfor krever Dijkstras algoritme at alle kantvekter er ikke-negative?",
    opts: [
      "Fordi en negativ kant senere kunne gitt en snarvei til en node vi allerede har erklært ferdig",
      "Fordi $\\min$-funksjonen ikke er definert for negative tall",
      "Fordi avstander ikke kan lagres som negative tall",
      "Det er bare en konvensjon — algoritmen virker fint med negative vekter",
    ],
    answer: 0,
    expl: "Garantien «nærmeste uferdige node er ferdig» hviler på at ingen omvei kan bli billigere senere. En negativ kant bryter det — da kan en «ferdig» avstand plutselig forbedres, og svaret blir feil. (Da trenger man Bellman–Ford.)",
  },
  {
    id: "dijkstra-kompleksitet",
    q: "Hva er kjøretiden til Dijkstra med en binærheap som prioritetskø?",
    opts: [
      "$O((V + E) \\log V)$",
      "$O(V^2 \\log V)$",
      "$O(V + E)$",
      "$O(E^2)$",
    ],
    answer: 0,
    expl: "Hver node tas ut av heapen én gang ($V$ uttak à $O(\\log V)$), og hver kant kan gi én oppdatering i heapen ($E$ oppdateringer à $O(\\log V)$) — til sammen $O((V+E)\\log V)$.",
  },
];

function QuizItem({ item, onDone }: { item: Item; onDone: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="quiz-item">
      <div className="q"><KMixed text={item.q} /></div>
      <div className="opts">
        {item.opts.map((o, i) => (
          <button key={i}
            className={["kviz-choice",
              picked !== null && i === item.answer ? "correct" : "",
              picked === i && i !== item.answer ? "incorrect" : "",
            ].filter(Boolean).join(" ")}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              const ok = i === item.answer;
              emitQuizEvent({ type: "quiz:attempt", quizId: item.id, correct: ok, attempt: 1, at: Date.now() });
              onDone(ok);
            }}>
            <KMixed text={o} />
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={`expl ${picked === item.answer ? "correct" : ""}`}>
          {picked === item.answer ? "Riktig! " : "Ikke helt — "}
          <KMixed text={item.expl} />
        </div>
      )}
    </div>
  );
}

function Quiz() {
  const [results, setResults] = useState<boolean[]>([]);
  return (
    <>
      {ITEMS.map((item) => (
        <QuizItem key={item.id} item={item} onDone={(ok) => setResults((r) => [...r, ok])} />
      ))}
      {results.length === ITEMS.length && (
        <p className="quiz-score">
          Du fikk {results.filter(Boolean).length} av {ITEMS.length} riktige
          {results.every(Boolean) ? " — alt riktig! 🎉" : ". Se forklaringene over, og trykk deg gjennom widgeten en gang til."}
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- page */
const widgetSpec = {
  template: "dijkstra-graf",
  title: "Dijkstra steg for steg",
  params: {
    intro:
      "Grafen fra videoen. Trykk deg gjennom kjøringen: oransje ring er noden som behandles, tallet over hver node er $\\mathrm{dist}$, og grønt betyr ferdig. Statuslinja under figuren forteller hva som skjer i hvert steg.",
    source: "A",
    target: "F",
  },
};

function Page() {
  return (
    <>
      <div className="topbar">
        <span className="wordmark">k<span className="tri">◺</span>teter</span>
        <span className="crumbs">Kurs › Algoritmer og Datastrukturer › Korteste vei fra én til alle › <b>Dijkstras algoritme</b></span>
      </div>
      <main>
        <h1>Dijkstras algoritme</h1>
        <p className="lede">
          Hvordan finner kartappen den raskeste ruten blant millioner av veier — uten å prøve
          alle? Dijkstras algoritme løser korteste-vei-problemet med ett smart, grådig valg
          om gangen, og er en av de mest brukte algoritmene som finnes.
        </p>
        <p>
          Gitt en vektet graf og en startnode finner algoritmen den korteste avstanden til{" "}
          <em>alle</em> andre noder. Oppskriften er to steg som gjentas: velg den uferdige
          noden med minst avstand, og <em>relaksér</em> naboene — sjekk om veien gjennom den
          nye noden er bedre enn den beste vi kjenner. Videoen bygger opp hele kjøringen på
          en liten graf.
        </p>

        <h2>Video</h2>
        <video controls preload="metadata">
          <source src="/video/dijkstra.mp4" type="video/mp4" />
          <track kind="subtitles" src="/video/dijkstra.vtt" srcLang="nb" label="Norsk" default />
        </video>

        <h2>Algoritmen</h2>
        <p>
          Startnoden får avstand 0, alle andre <KFormula tex="\infty" />. Så gjentas to steg
          til alle noder er ferdige:
        </p>
        <div className="formula-box">
          <p style={{ marginBottom: 10 }}><b>1.</b> Velg den uferdige noden <KFormula tex="u" /> med minst avstand — den er nå ferdig.</p>
          <p style={{ marginBottom: 14 }}><b>2.</b> Relaksér alle uferdige naboer <KFormula tex="v" />:</p>
          <KFormula tex="\displaystyle \mathrm{dist}(v) \;=\; \min\bigl(\mathrm{dist}(v),\; \mathrm{dist}(u) + w(u,v)\bigr)" />
        </div>
        <p>
          Det grådige valget i steg 1 er trygt så lenge ingen kantvekter er negative: den
          nærmeste uferdige noden kan aldri få en snarvei senere, for enhver annen vei dit
          måtte gått gjennom noe som allerede er lenger unna.
        </p>

        <h2>Gjennomregnet eksempel</h2>
        <div className="example-box">
          <p style={{ marginBottom: 12 }}>
            <b>Oppgave:</b> finn korteste vei fra <KFormula tex="A" /> til <KFormula tex="F" />{" "}
            i grafen fra videoen. Tabellen viser avstandene etter hvert som nodene gjøres
            ferdige (verdier som forbedres er streket ut):
          </p>
          <div style={{ overflowX: "auto" }}>
            <table className="run-table">
              <thead>
                <tr><th>ferdig node</th><th>A</th><th>B</th><th>C</th><th>D</th><th>E</th><th>F</th></tr>
              </thead>
              <tbody>
                <tr><td>—</td><td>0</td><td>∞</td><td>∞</td><td>∞</td><td>∞</td><td>∞</td></tr>
                <tr><td>A (0)</td><td>✓</td><td>2</td><td>5</td><td>∞</td><td>∞</td><td>∞</td></tr>
                <tr><td>B (2)</td><td>✓</td><td>✓</td><td><s>5</s> 4</td><td>8</td><td>∞</td><td>∞</td></tr>
                <tr><td>C (4)</td><td>✓</td><td>✓</td><td>✓</td><td><s>8</s> 7</td><td>10</td><td>∞</td></tr>
                <tr><td>D (7)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td><s>10</s> 8</td><td>12</td></tr>
                <tr><td>E (8)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td><s>12</s> 10</td></tr>
                <tr><td>F (10)</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td><td>✓</td></tr>
              </tbody>
            </table>
          </div>
          <p className="check" style={{ marginTop: 12 }}>
            ✓ Korteste vei: A–B–C–D–E–F med lengde 2+2+3+1+2 = 10.
          </p>
        </div>

        <h2>Kjøretid</h2>
        <p>
          Med en prioritetskø (binærheap) gjør algoritmen bare to ting: hver node hentes ut
          av køen én gang (<KFormula tex="V" /> uttak), og hver kant kan gi maks én
          oppdatering i køen (<KFormula tex="E" /> oppdateringer). Hver kø-operasjon koster{" "}
          <KFormula tex="O(\log V)" />, så totalen er
        </p>
        <div className="formula-box">
          <KFormula tex="\displaystyle O\bigl((V + E)\cdot \log V\bigr)" />
        </div>
        <p>
          I verste fall er grafen tett — kanter nesten overalt, altså{" "}
          <KFormula tex="E \approx V^2" /> — så det er antall kanter som virkelig teller.
          For grafen på denne siden, med <KFormula tex="V = 6" /> og <KFormula tex="E = 9" />,
          gir det en øvre grense på omtrent{" "}
          <KFormula tex="(6+9)\cdot\log_2 6 \approx 39" /> kø-operasjoner. Dette dukker ofte
          opp på eksamen: husk både formelen og hvor faktorene kommer fra.
        </p>

        <h2>Prøv selv: kjør algoritmen steg for steg</h2>
        <div className="widget-stage widget-stage--auto">
          <ThemeProvider theme={arv} fill>
            <SpecRenderer spec={widgetSpec} />
          </ThemeProvider>
        </div>

        <h2>Quiz</h2>
        <p>Test forståelsen — forklaring på hvert svar.</p>
        <ThemeProvider theme={arv}>
          <Quiz />
        </ThemeProvider>

        <footer>
          Kateter · Algoritmer og Datastrukturer · Dijkstras algoritme — side generert i
          arv-temaet; video, figur og tekst deler graf, notasjon og farger.
        </footer>
      </main>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={arv}>
    <Page />
  </ThemeProvider>
);
