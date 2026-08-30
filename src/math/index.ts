/** Math helpers used across components — pure, unit-tested. */

/** Manim's smooth() (smootherstep): 6t⁵ − 15t⁴ + 10t³, clamped to [0,1]. */
export function smooth(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return x * x * x * (x * (6 * x - 15) + 10);
}

/** Numeric derivative (central difference). */
export function ddx(f: (x: number) => number, x: number, h = 1e-4): number {
  return (f(x + h) - f(x - h)) / (2 * h);
}

/** Composite 1D Simpson on [a,b]. n must be even (rounded up if not). */
export function simpson(f: (x: number) => number, a: number, b: number, n = 64): number {
  if (n % 2) n += 1;
  const h = (b - a) / n;
  let s = f(a) + f(b);
  for (let i = 1; i < n; i++) s += f(a + i * h) * (i % 2 ? 4 : 2);
  return (s * h) / 3;
}

/** Composite 2D Simpson of f over [a,b]×[c,d]. n must be even (rounded up). */
export function simpson2d(
  f: (x: number, y: number) => number,
  a: number,
  b: number,
  c: number,
  d: number,
  n = 64
): number {
  if (n % 2) n += 1;
  const w = (i: number) => (i === 0 || i === n ? 1 : i % 2 ? 4 : 2);
  const hx = (b - a) / n;
  const hy = (d - c) / n;
  let s = 0;
  for (let i = 0; i <= n; i++) {
    const wi = w(i);
    const x = a + i * hx;
    for (let j = 0; j <= n; j++) s += wi * w(j) * f(x, c + j * hy);
  }
  return (s * hx * hy) / 9;
}

/** Sample f on [a,b] into [x,y] pairs (n+1 points). */
export function sample(
  f: (x: number) => number,
  a: number,
  b: number,
  n = 128
): [number, number][] {
  const pts: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = a + ((b - a) * i) / n;
    pts.push([x, f(x)]);
  }
  return pts;
}

/** Display formatter: proper minus sign, fixed decimals. */
export function fmt(v: number, digits = 2): string {
  const r = Math.abs(v).toFixed(digits);
  // avoid "−0.00"
  const neg = v < 0 && Number(r) !== 0;
  return (neg ? "−" : "") + r;
}

/** Clamp v to [lo, hi]. */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(Math.max(v, lo), hi);
}
