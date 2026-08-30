import { useCallback, useEffect, useRef, useState } from "react";
import { emitQuizEvent } from "./events";

export type QuizStatus = "neutral" | "incorrect" | "correct";

export interface QuizState {
  status: QuizStatus;
  attempts: number;
  /** Evaluate a candidate value; emits attempt/correct/streak events. */
  check: (correct: boolean) => void;
  /** Back to neutral (e.g. new sub-question). */
  reset: () => void;
}

/**
 * Quiz bookkeeping around any interaction: call `check(predicate)` whenever
 * the student commits (or continuously for drag-to-target widgets — it only
 * counts an attempt on neutral/incorrect → correct-or-new-wrong transitions).
 */
export function useQuiz(quizId: string): QuizState {
  const [status, setStatus] = useState<QuizStatus>("neutral");
  const attemptsRef = useRef(0);
  const streakRef = useRef(0);
  const [, force] = useState(0);

  useEffect(() => {
    emitQuizEvent({ type: "quiz:shown", quizId, at: Date.now() });
  }, [quizId]);

  const check = useCallback(
    (correct: boolean) => {
      setStatus((prev) => {
        const next: QuizStatus = correct ? "correct" : "incorrect";
        if (prev === "correct") return correct ? prev : "incorrect";
        if (next === "correct") {
          attemptsRef.current += 1;
          streakRef.current += 1;
          emitQuizEvent({
            type: "quiz:attempt",
            quizId,
            correct: true,
            attempt: attemptsRef.current,
            at: Date.now(),
          });
          emitQuizEvent({
            type: "quiz:correct",
            quizId,
            attempts: attemptsRef.current,
            at: Date.now(),
          });
          emitQuizEvent({
            type: "quiz:streak",
            quizId,
            streak: streakRef.current,
            at: Date.now(),
          });
        } else if (prev === "neutral") {
          // first engagement that is wrong: one attempt
          attemptsRef.current += 1;
          streakRef.current = 0;
          emitQuizEvent({
            type: "quiz:attempt",
            quizId,
            correct: false,
            attempt: attemptsRef.current,
            at: Date.now(),
          });
        }
        force((n) => n + 1);
        return next;
      });
    },
    [quizId]
  );

  const reset = useCallback(() => setStatus("neutral"), []);

  return { status, attempts: attemptsRef.current, check, reset };
}
