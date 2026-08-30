/**
 * Typed progress events — the seam a future game/progression layer subscribes
 * to. Widgets emit; they never know who listens. Keep this surface tiny and
 * stable: everything gamification needs (attempts, streaks, mastery) derives
 * from these plain events.
 */

export type QuizEvent =
  | { type: "quiz:shown"; quizId: string; at: number }
  | { type: "quiz:attempt"; quizId: string; correct: boolean; attempt: number; at: number }
  | { type: "quiz:correct"; quizId: string; attempts: number; at: number }
  | { type: "quiz:reveal"; quizId: string; at: number }
  | { type: "quiz:streak"; quizId: string; streak: number; at: number };

export type QuizEventListener = (e: QuizEvent) => void;

const listeners = new Set<QuizEventListener>();

/** Subscribe to all quiz events (returns unsubscribe). */
export function onQuizEvent(fn: QuizEventListener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitQuizEvent(e: QuizEvent): void {
  for (const fn of listeners) fn(e);
}
