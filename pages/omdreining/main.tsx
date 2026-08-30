/**
 * Course page — «Omdreiningslegeme» (Matematikk 1 / Kalkulus 1, NTNU).
 * Factory page #2: intro → video (Felix voice) → formula box → worked example
 * (cone + geometric check) → 3D widget (omdreining-3d spec) → quiz.
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
    id: "omdreining-tverrsnitt",
    q: "Hva representerer $\\pi \\cdot f(x_i)^2$ i skivemetoden?",
    opts: [
      "Arealet av det sirkelformede tverrsnittet ved $x_i$",
      "Volumet av én skive",
      "Omkretsen av skiven ved $x_i$",
      "Radiusen i andre potens",
    ],
    answer: 0,
    expl: "Tverrsnittet er en sirkel med radius $f(x_i)$, så arealet er $\\pi r^2 = \\pi f(x_i)^2$. Ganget med tykkelsen $\\Delta x$ blir det volumet av én skive.",
  },
  {
    id: "omdreining-radius",
    q: "Vi roterer $y = f(x)$ rundt $x$-aksen. Hva er radiusen i skiven ved $x$?",
    opts: ["$f(x)$", "$x$", "$f(x)^2$", "$\\pi f(x)$"],
    answer: 0,
    expl: "Radiusen er avstanden fra rotasjonsaksen ($x$-aksen) opp til grafen — altså funksjonsverdien $f(x)$.",
  },
  {
    id: "omdreining-sylinder",
    q: "Den konstante funksjonen $y = 2$ på $[0, 3]$ roteres rundt $x$-aksen. Hva blir volumet?",
    opts: ["$12\\pi$", "$6\\pi$", "$36\\pi$", "$4\\pi$"],
    answer: 0,
    expl: "Dette er en sylinder: $V = \\pi \\int_0^3 2^2\\,dx = \\pi \\cdot 4 \\cdot 3 = 12\\pi$ — som stemmer med $\\pi r^2 h$.",
  },
  {
    id: "omdreining-kjegle2",
    q: "$y = x$ på $[0, 2]$ roteres rundt $x$-aksen. Hva blir volumet?",
    opts: ["$\\tfrac{8\\pi}{3}$", "$4\\pi$", "$8\\pi$", "$\\tfrac{2\\pi}{3}$"],
    answer: 0,
    expl: "$V = \\pi\\int_0^2 x^2\\,dx = \\pi\\left[\\tfrac{x^3}{3}\\right]_0^2 = \\tfrac{8\\pi}{3}$. Kjegleformelen gir det samme: $\\tfrac{1}{3}\\pi \\cdot 2^2 \\cdot 2$.",
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
          {results.every(Boolean) ? " — alt riktig! 🎉" : ". Se forklaringene over, og prøv widgeten en gang til."}
        </p>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- page */
const widgetSpec = {
  template: "omdreining-3d",
  title: "Skivemetoden i 3D",
  params: {
    f: "1.8 + 0.6*sin(1.2x - 0.5)",
    intro:
      "Dette er «vasen» fra videoen: $f(x) = 1.8 + 0.6\\sin(1.2x - 0.5)$ rotert rundt $x$-aksen. Hver skive er en sylinder med radius $f(x_i)$ og volum $\\pi f(x_i)^2 \\Delta x$. Dra i $n$ og se at $V_n \\to \\pi\\int_a^b f(x)^2\\,dx$ — og dra i selve figuren for å rotere den.",
    range: [0.9, 5.3],
    n0: 6,
    nMax: 80,
  },
};

function Page() {
  return (
    <>
      <div className="topbar">
        <span className="wordmark">k<span className="tri">◺</span>teter</span>
        <span className="crumbs">Kurs › Matematikk 1 › Integrasjon › <b>Omdreiningslegeme</b></span>
      </div>
      <main>
        <h1>Omdreiningslegeme</h1>
        <p className="lede">
          Sett et område i sving rundt en akse, og det tegner ut et tredimensjonalt legeme —
          som en vase på en dreiebenk. Med integralet kan vi regne ut volumet av et slikt
          legeme nøyaktig.
        </p>
        <p>
          Oppskriften er den samme som for riemannintegralet: del legemet i tynne skiver,
          regn ut volumet av én skive, summér — og la antallet gå mot uendelig. Hver skive
          er en tynn sylinder med radius <KFormula tex="f(x_i)" /> og tykkelse{" "}
          <KFormula tex="\Delta x" />, og i grensen blir summen et integral. Videoen bygger
          det opp fra én eneste skive.
        </p>

        <h2>Video</h2>
        <video controls preload="metadata">
          <source src="/video/omdreining.mp4" type="video/mp4" />
          <track kind="subtitles" src="/video/omdreining.vtt" srcLang="nb" label="Norsk" default />
        </video>

        <h2>Formelen</h2>
        <p>
          Når området under <KFormula tex="y = f(x)" /> på <KFormula tex="[a, b]" /> roteres
          én hel runde rundt <KFormula tex="x" />-aksen, er volumet
        </p>
        <div className="formula-box">
          <KFormula tex="\displaystyle V \;=\; \pi \int_a^b f(x)^2\,dx" />
        </div>
        <p>
          Hvert bidrag <KFormula tex="\pi f(x_i)^2\,\Delta x" /> er volumet av én tynn
          sirkelskive: sirkelarealet <KFormula tex="\pi f(x_i)^2" /> ganger tykkelsen.
        </p>

        <h2>Gjennomregnet eksempel</h2>
        <div className="example-box">
          <p style={{ marginBottom: 12 }}>
            <b>Oppgave:</b> linja <KFormula tex="y = x" /> på <KFormula tex="[0, 1]" />{" "}
            roteres rundt <KFormula tex="x" />-aksen. Finn volumet av kjeglen som oppstår.
          </p>
          <div className="step"><KFormula tex="f(x) = x \;\Rightarrow\; f(x)^2 = x^2" /></div>
          <div className="step"><KFormula tex="\displaystyle V = \pi \int_0^1 x^2\,dx = \pi\left[\tfrac{x^3}{3}\right]_0^1 = \tfrac{\pi}{3}" /></div>
          <p className="check" style={{ marginTop: 12 }}>
            ✓ Kontroll: kjegleformelen gir <KFormula tex="\tfrac{1}{3}\pi r^2 h = \tfrac{1}{3}\pi \cdot 1^2 \cdot 1 = \tfrac{\pi}{3}" />.
          </p>
        </div>

        <h2>Prøv selv: skivene fyller legemet</h2>
        <div className="widget-stage widget-stage--tall">
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
          Kateter · Matematikk 1 · Omdreiningslegeme — side generert i arv-temaet;
          video, figur og tekst deler notasjon og farger.
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
