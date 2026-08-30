/** Safe math-expression compilation (mathjs) with helpful errors for the AI loop. */
import { compile } from "mathjs";

export type Fn1 = (x: number) => number;
export type Fn2 = (x: number, y: number) => number;

const cache = new Map<string, unknown>();

function compiled(expr: string) {
  let c = cache.get(expr);
  if (!c) {
    c = compile(expr);
    cache.set(expr, c);
  }
  return c as { evaluate: (scope: Record<string, number>) => unknown };
}

/** Compile a one-variable expression; throws a descriptive error if invalid. */
export function fn1(expr: string): Fn1 {
  const c = compiled(expr);
  const probe = c.evaluate({ x: 0.37 });
  if (typeof probe !== "number") {
    throw new Error(`Expression "${expr}" does not evaluate to a number of x`);
  }
  return (x) => c.evaluate({ x }) as number;
}

/** Compile a two-variable expression (3D surfaces). */
export function fn2(expr: string): Fn2 {
  const c = compiled(expr);
  const probe = c.evaluate({ x: 0.37, y: -0.21 });
  if (typeof probe !== "number") {
    throw new Error(`Expression "${expr}" does not evaluate to a number of (x, y)`);
  }
  return (x, y) => c.evaluate({ x, y }) as number;
}

/** mathjs → KaTeX-ish display string (light touch: the AI supplies TeX where it matters). */
export function exprToTex(expr: string): string {
  return expr
    .replace(/\*\*/g, "^")
    .replace(/\s*\*\s*/g, "\\,")
    .replace(/sqrt\(/g, "\\sqrt{(")
    .replace(/(sin|cos|tan|ln|log|exp)\(/g, "\\$1(");
}
