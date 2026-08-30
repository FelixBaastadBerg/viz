import { useState, type ReactNode } from "react";
import { KFormula } from "../chrome";
import type { QuizStatus } from "./useQuiz";

export interface QuizCardProps {
  /** Question text; segments in `$...$` render as KaTeX. */
  question: string;
  /** Secondary line (e.g. the function definition), rendered as KaTeX. */
  subtitleTex?: string;
  status: QuizStatus;
  /** Feedback line for the current status. */
  feedback: string;
  className?: string;
  children?: ReactNode;
}

/** Split "Dra punktet dit hvor $f'(x) = 0$." into text + KaTeX segments. */
function renderMixed(s: string): ReactNode[] {
  return s.split(/\$([^$]*)\$/g).map((seg, i) =>
    i % 2 ? <KFormula key={i} tex={seg} /> : <span key={i}>{seg}</span>
  );
}

/**
 * Brilliant-style guided-interaction card: question → manipulation (the widget
 * around it) → immediate feedback. No modals, no confetti — the colour system
 * encodes right/wrong.
 */
export function QuizCard({
  question,
  subtitleTex,
  status,
  feedback,
  className,
  children,
}: QuizCardProps) {
  return (
    <div className={`kviz-panel kviz-quiz-card kviz-visible ${className ?? ""}`}>
      <p className="kviz-quiz-question">{renderMixed(question)}</p>
      {subtitleTex && (
        <p className="kviz-caption">
          <KFormula tex={subtitleTex} />
        </p>
      )}
      {children}
      <p className={`kviz-quiz-feedback ${status}`} role="status">
        {feedback}
      </p>
    </div>
  );
}

/* ----------------------------------------------------------- PredictReveal */
export interface PredictRevealProps {
  /** Prompt shown before the reveal. */
  prompt: string;
  /** Choices the student commits to (predict step). */
  choices: string[];
  /** Index of the right choice. */
  answer: number;
  /** Called when the student picks (predict committed). */
  onPredict?: (choice: number, correct: boolean) => void;
  /** The visualization to reveal after committing. */
  children: ReactNode;
}

/**
 * Predict-then-reveal: the student must commit to an expectation before the
 * visualization renders — the pedagogy is prediction → evidence.
 */
export function PredictReveal({
  prompt,
  choices,
  answer,
  onPredict,
  children,
}: PredictRevealProps) {
  const [picked, setPicked] = useState<number | null>(null);
  return (
    <div className="kviz-predict">
      <p className="kviz-quiz-question">{prompt}</p>
      <div className="kviz-predict-choices">
        {choices.map((c, i) => (
          <button
            key={i}
            className={[
              "kviz-choice",
              picked !== null && i === answer ? "correct" : "",
              picked === i && i !== answer ? "incorrect" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            disabled={picked !== null}
            onClick={() => {
              setPicked(i);
              onPredict?.(i, i === answer);
            }}
          >
            {renderMixed(c)}
          </button>
        ))}
      </div>
      {picked !== null && <div className="kviz-reveal">{children}</div>}
    </div>
  );
}
