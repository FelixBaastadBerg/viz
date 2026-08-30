/**
 * Course page — «Riemannintegralet» (Matematikk 1 / Kalkulus 1, NTNU).
 * The end-to-end factory test: intro text → video (Felix voice) → formula box
 * → worked example → interactive widget (riemann-sum spec) → quiz.
 * Composition per STANDARDS P1–P5; notation matches the video (P3).
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, arv, loadThemeFonts, KFormula } from "@kateter/viz/core";
import { SpecRenderer } from "@kateter/viz/spec";
import { emitQuizEvent } from "@kateter/viz/core";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../../src/kviz.css";
import "./page.css";

loadThemeFonts(arv);

/* ------------------------------------------------------------- quiz data */
interface Item {
  id: string;
  q: string;
  opts: string[];
  answer: number;
  expl: string;
}
const ITEMS: Item[] = [
  {
    id: "riemann-ledd",
    q: "Hva er tolkningen av leddet $f(x_i)\\cdot\\Delta x$ i en riemannsum?",
    opts: [
      "Arealet av ett rektangel med bredde $\\Delta x$ og høyde $f(x_i)$",
      "Stigningen til $f$ i punktet $x_i$",
      "Lengden av kurven over den $i$-te biten",
      "Gjennomsnittsverdien av $f$ på $[a, b]$",
    ],
    answer: 0,
    expl: "Bredde $\\Delta x$, høyde $f(x_i)$ — arealet av én bit av tilnærmingen. Summen av alle slike ledd er riemannsummen.",
  },
  {
    id: "riemann-grense",
    q: "La $f$ være kontinuerlig på $[a,b]$. Hva skjer med $S_n$ når $n \\to \\infty$?",
    opts: [
      "$S_n \\to \\int_a^b f(x)\\,dx$",
      "$S_n$ vokser mot uendelig",
      "$S_n \\to f(b) - f(a)$",
      "Det avhenger av endepunktvalget — grensen finnes ofte ikke",
    ],
    answer: 0,
    expl: "For kontinuerlige funksjoner konvergerer riemannsummene mot integralet — uavhengig av om vi velger venstre, høyre eller midtpunkt.",
  },
  {
    id: "riemann-dx",
    q: "Intervallet $[2, 6]$ deles i $n = 8$ like biter. Hva er $\\Delta x$?",
    opts: ["0.5", "1", "0.25", "4"],
    answer: 0,
    expl: "$\\Delta x = \\frac{b-a}{n} = \\frac{6-2}{8} = 0.5$.",
  },
  {
    id: "riemann-s2",
    q: "$f(x) = x$ på $[0, 1]$ med høyre endepunkter og $n = 2$. Hva er $S_2$?",
    opts: ["0.75", "0.5", "0.25", "1"],
    answer: 0,
    expl: "$\\Delta x = 0.5$, $x_1 = 0.5$, $x_2 = 1$: $S_2 = 0.5\\cdot 0.5 + 1\\cdot 0.5 = 0.75$. Et overslag — $f$ er voksende og vi bruker høyre endepunkt (sml. figuren i videoen).",
  },
];

function renderMixed(s: string) {
  return s.split(/\$([^$]*)\$/g).map((seg, i) =>
    i % 2 ? <KFormula key={i} tex={seg} /> : <span key={i}>{seg}</span>
  );
}

function QuizItem({ item, onDone }: { item: Item; onDone: (ok: boolean) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="quiz-item">
      <div className="q">{renderMixed(item.q)}</div>
      <div className="opts">
        {item.opts.map((o, i) => (
          <button
            key={i}
            className={[
              "kviz-choice",
              picked !== null && i === item.answer ? "correct" : "",
              picked === i && i !== item.answer ? "incorrect" : "",
            ].filter(Boolean).join(" ")}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              const ok = i === item.answer;
              emitQuizEvent({ type: "quiz:attempt", quizId: item.id, correct: ok, attempt: 1, at: Date.now() });
              onDone(ok);
            }}
          >
            {renderMixed(o)}
          </button>
        ))}
      </div>
      {picked !== null && (
        <div className={`expl ${picked === item.answer ? "correct" : ""}`}>
          {picked === item.answer ? "Riktig! " : "Ikke helt — "}
          {renderMixed(item.expl)}
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
  template: "riemann-sum",
  title: "Riemannsummer for funksjonen fra videoen",
  params: {
    f: "2.4 + 0.9*sin(1.1x - 0.4)",
    intro:
      "Dette er funksjonen fra videoen, $f(x) = 2.4 + 0.9\\sin(1.1x - 0.4)$, på intervallet $[a, b]$. Riemannsummen $S_n = \\sum_{i=1}^{n} f(x_i)\\,\\Delta x$ er samlet areal av rektanglene. Dra i $n$ og se at $S_n \\to \\int_a^b f(x)\\,dx$ når antallet vokser.",
    range: [0.9, 5.5],
    method: "hoyre",
    n0: 4,
    nMax: 200,
    viewX: [-0.3, 6.3],
    viewY: [-0.7, 4.3],
  },
};

function Page() {
  return (
    <>
      <div className="topbar">
        <span className="wordmark">k<span className="tri">◺</span>teter</span>
        <span className="crumbs">Kurs › Matematikk 1 › Integrasjon › <b>Riemannintegralet</b></span>
      </div>
      <main>
        <h1>Riemannintegralet</h1>
        <p className="lede">
          Hvordan måler man arealet under en buet graf? Det finnes ingen formel for områder
          med buede kanter — men det finnes et triks, og det trikset er selve definisjonen
          av integralet.
        </p>
        <p>
          Ideen er å fylle området med rektangler. Rektangler kan vi måle. Med noen få
          rektangler bommer vi litt; med flere bommer vi mindre — og i grensen, når antallet
          går mot uendelig, bommer vi ikke i det hele tatt. Denne grensen kalles{" "}
          <em>riemannintegralet</em> av funksjonen, og videoen under bygger den opp fra ett
          eneste rektangel.
        </p>

        <h2>Video</h2>
        <video controls preload="metadata">
          <source src="/video/riemann.mp4" type="video/mp4" />
          <track kind="subtitles" src="/video/riemann.vtt" srcLang="nb" label="Norsk" default />
        </video>

        <h2>Definisjonen</h2>
        <p>
          Del intervallet <KFormula tex="[a,b]" /> i <KFormula tex="n" /> like biter med
          bredde <KFormula tex="\Delta x = \tfrac{b-a}{n}" />, og la{" "}
          <KFormula tex="x_i" /> være høyre endepunkt i bit <KFormula tex="i" />. Da er
        </p>
        <div className="formula-box">
          <KFormula tex="\displaystyle \int_a^b f(x)\,dx \;=\; \lim_{n\to\infty} \sum_{i=1}^{n} f(x_i)\,\Delta x" />
        </div>
        <p>
          Hvert ledd <KFormula tex="f(x_i)\,\Delta x" /> er arealet av ett rektangel; summen{" "}
          <KFormula tex="S_n" /> er en <em>riemannsum</em>, og integralet er grensen av
          disse summene.
        </p>

        <h2>Gjennomregnet eksempel</h2>
        <div className="example-box">
          <p style={{ marginBottom: 12 }}>
            <b>Oppgave:</b> regn ut <KFormula tex="\int_0^1 x\,dx" /> som grense av
            riemannsummer.
          </p>
          <div className="step"><KFormula tex="\Delta x = \tfrac{1}{n}, \qquad x_i = \tfrac{i}{n}" /></div>
          <div className="step"><KFormula tex="\displaystyle S_n = \sum_{i=1}^{n} \tfrac{i}{n}\cdot\tfrac{1}{n} = \tfrac{1}{n^2}\sum_{i=1}^{n} i = \tfrac{1}{n^2}\cdot\tfrac{n(n+1)}{2} = \tfrac{n+1}{2n}" /></div>
          <div className="step"><KFormula tex="\displaystyle \int_0^1 x\,dx = \lim_{n\to\infty}\tfrac{n+1}{2n} = \tfrac{1}{2}" /></div>
          <p className="check" style={{ marginTop: 12 }}>
            ✓ Kontroll: området er en trekant med areal <KFormula tex="\tfrac{1}{2}\cdot 1\cdot 1 = \tfrac{1}{2}" />.
          </p>
        </div>

        <h2>Prøv selv: flere rektangler, mindre feil</h2>
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
          Kateter · Matematikk 1 · Riemannintegralet — side generert i arv-temaet;
          video, figur og tekst deler notasjon og farger.
        </footer>
      </main>
    </>
  );
}

const root = document.getElementById("root")!;
createRoot(root).render(
  <ThemeProvider theme={arv}>
    <Page />
  </ThemeProvider>
);
