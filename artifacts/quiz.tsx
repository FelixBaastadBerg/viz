/**
 * Phase-0 artifact #2 rebuilt ON the library: guided quiz — drag the point
 * to a stationary point. Emits typed quiz events (see src/quiz/events.ts).
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import {
  ThemeProvider, KPlot, KCurve, KTangent, KPoint,
  QuizCard, useQuiz, useKtTheme, fmt,
} from "@kateter/viz/core";
import { bootTheme } from "./shared";

const theme = bootTheme();

const f = (x: number) => x ** 3 / 3 - x + 1;
const df = (x: number) => x * x - 1;
const TOLERANCE = 0.08;
const START_X = 2.2;

function Quiz() {
  const t = useKtTheme();
  const [x0, setX0] = useState(START_X);
  const quiz = useQuiz("stasjonaert-punkt-1");

  const touched = x0 !== START_X;
  const m = df(x0);
  const correct = Math.abs(m) < TOLERANCE;

  const feedback = correct
    ? `Riktig! f′(${fmt(x0)}) ≈ 0 — tangenten er vannrett i et stasjonært punkt.`
    : touched
      ? `Ikke helt: f′(x) = ${fmt(m)}. Se på helningen til tangenten — når blir den flat?`
      : `Dra i ${t.touchNameNb} for å begynne.`;

  return (
    <>
      <KPlot viewBox={{ x: [-4.5, 4.5], y: [-2.5, 4.5] }}>
        <KCurve f={f} />
        <KTangent f={f} df={df} x={x0} role={correct ? "right" : "touch"} />
        <KPoint
          point={[x0, f(x0)]}
          constrain={(x) => [x, f(x)]}
          onMove={([x]) => {
            setX0(x);
            quiz.check(Math.abs(df(x)) < TOLERANCE);
          }}
        />
      </KPlot>
      <QuizCard
        className="kviz-panel--readout"
        question="Dra punktet dit hvor $f'(x) = 0$."
        subtitleTex="f(x) = \tfrac{1}{3}x^3 - x + 1"
        status={correct ? "correct" : touched ? "incorrect" : "neutral"}
        feedback={feedback}
      />
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <ThemeProvider theme={theme} fill>
    <Quiz />
  </ThemeProvider>
);
