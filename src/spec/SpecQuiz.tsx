import { useEffect } from "react";
import { QuizCard } from "../quiz/QuizCard";
import { useQuiz } from "../quiz/useQuiz";
import type { QuizWrapper } from "./types";
import { fn1 } from "./expr";
import { fmt } from "../math";

/** Evaluate a quiz goal against the widget's live value v. */
export function goalMet(quiz: QuizWrapper, v: number): boolean {
  const g = quiz.goal;
  if (g.kind === "value-near") return Math.abs(v - g.target) < g.tolerance;
  return Math.abs(fn1(g.expr)(v)) < g.tolerance;
}

function interpolate(s: string, v: number, fv?: number): string {
  return s
    .replace(/\{v\}/g, fmt(v))
    .replace(/\{fv\}/g, fv === undefined ? "" : fmt(fv));
}

/**
 * The spec-driven quiz card: give it the wrapper and the widget's live value
 * (plus whether the student has engaged) and it handles status, feedback
 * interpolation and progress events.
 */
export function SpecQuiz({
  quiz,
  value,
  fValue,
  touched,
}: {
  quiz: QuizWrapper;
  value: number;
  fValue?: number;
  touched: boolean;
}) {
  const q = useQuiz(quiz.quizId);
  const correct = goalMet(quiz, value);
  useEffect(() => {
    if (touched) q.check(correct);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touched, correct]);
  const status = correct ? "correct" : touched ? "incorrect" : "neutral";
  const feedback = interpolate(
    correct ? quiz.correct : touched ? quiz.incorrect : quiz.neutral,
    value,
    fValue
  );
  return (
    <QuizCard
      className="kviz-panel--readout"
      question={quiz.question}
      subtitleTex={quiz.subtitleTex}
      status={status}
      feedback={feedback}
    />
  );
}
