/**
 * Exact 1D normalizing flow between two densities via the increasing
 * rearrangement (optimal-transport map) T = F_q⁻¹ ∘ F_p — in one dimension
 * this IS a valid normalizing flow (monotone ⇒ invertible), and McCann's
 * displacement interpolation T_t(x) = (1−t)·x + t·T(x) stays monotone for
 * every t ∈ [0,1], so each intermediate map is itself a flow.
 *
 * Discretisation (stated for the showcase):
 * - uniform grid of N points on [lo, hi] (default 2049 on [−4.5, 4.5]);
 * - CDFs by cumulative trapezoid, normalised to 1;
 * - quantile inversion by binary search + linear interpolation on the grid;
 * - T' by central differences on the grid;
 * - the pushforward density via the change of variables
 *     p_t(T_t(x)) = p(x) / T_t'(x);
 * - KL(p_t ‖ q) = ∫ p(x) · ln( p_t(T_t x) / q(T_t x) ) dx by the trapezoid
 *   rule on the same grid (change of variables back to x, so no inversion
 *   error enters the integral).
 */

export interface Flow1D {
  lo: number;
  hi: number;
  xs: Float64Array;
  /** The full transport map T on the grid. */
  T: Float64Array;
  /** T_t(x) for grid index i. */
  mapAt(t: number, i: number): number;
  /** The intermediate density as a sampled curve: arrays y (increasing) and p. */
  curve(t: number): { y: Float64Array; p: Float64Array };
  /** p_t evaluated at an arbitrary point (linear interp of curve(t)). */
  densityAt(t: number, y: number): number;
  /** KL(p_t ‖ q). */
  kl(t: number): number;
}

export function buildFlow1D(
  p: (x: number) => number,
  q: (x: number) => number,
  lo = -4.5,
  hi = 4.5,
  N = 2049
): Flow1D {
  const xs = new Float64Array(N);
  const ps = new Float64Array(N);
  const qs = new Float64Array(N);
  const h = (hi - lo) / (N - 1);
  for (let i = 0; i < N; i++) {
    xs[i] = lo + i * h;
    ps[i] = Math.max(p(xs[i]), 0);
    qs[i] = Math.max(q(xs[i]), 0);
  }
  // cumulative trapezoid CDFs, normalised
  const Fp = new Float64Array(N);
  const Fq = new Float64Array(N);
  for (let i = 1; i < N; i++) {
    Fp[i] = Fp[i - 1] + ((ps[i - 1] + ps[i]) / 2) * h;
    Fq[i] = Fq[i - 1] + ((qs[i - 1] + qs[i]) / 2) * h;
  }
  for (let i = 0; i < N; i++) {
    Fp[i] /= Fp[N - 1];
    Fq[i] /= Fq[N - 1];
  }

  /** Quantile of q at level u by binary search + linear interpolation. */
  const invFq = (u: number): number => {
    if (u <= 0) return lo;
    if (u >= 1) return hi;
    let a = 0,
      b = N - 1;
    while (b - a > 1) {
      const m = (a + b) >> 1;
      if (Fq[m] < u) a = m;
      else b = m;
    }
    const span = Fq[b] - Fq[a];
    const w = span > 1e-15 ? (u - Fq[a]) / span : 0.5;
    return xs[a] + w * h;
  };

  const T = new Float64Array(N);
  for (let i = 0; i < N; i++) T[i] = invFq(Fp[i]);

  // dT/dx by central differences (one-sided at the ends)
  const dT = new Float64Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.max(0, i - 1);
    const b = Math.min(N - 1, i + 1);
    dT[i] = (T[b] - T[a]) / ((b - a) * h);
  }

  const mapAt = (t: number, i: number) => (1 - t) * xs[i] + t * T[i];

  const curve = (t: number) => {
    const y = new Float64Array(N);
    const pd = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      y[i] = mapAt(t, i);
      const slope = (1 - t) + t * dT[i];
      pd[i] = slope > 1e-12 ? ps[i] / slope : 0;
    }
    return { y, p: pd };
  };

  const densityAt = (t: number, yq: number): number => {
    const { y, p: pd } = curve(t);
    if (yq <= y[0] || yq >= y[N - 1]) return 0;
    let a = 0,
      b = N - 1;
    while (b - a > 1) {
      const m = (a + b) >> 1;
      if (y[m] < yq) a = m;
      else b = m;
    }
    const span = y[b] - y[a];
    const w = span > 1e-15 ? (yq - y[a]) / span : 0.5;
    return pd[a] + w * (pd[b] - pd[a]);
  };

  const kl = (t: number): number => {
    // KL(p_t‖q) = ∫ p(x) ln( p(x) / (T_t'(x) · q(T_t x)) ) dx  (trapezoid)
    let s = 0;
    let prev = 0;
    for (let i = 0; i < N; i++) {
      let term = 0;
      if (ps[i] > 1e-14) {
        const slope = (1 - t) + t * dT[i];
        const qv = Math.max(q(mapAt(t, i)), 1e-300);
        term = ps[i] * Math.log(ps[i] / (slope * qv));
      }
      if (i > 0) s += ((prev + term) / 2) * h;
      prev = term;
    }
    return Math.max(s, 0);
  };

  return { lo, hi, xs, T, mapAt, curve, densityAt, kl };
}

/** Normal pdf. */
export const gauss = (mu: number, sigma: number) => (x: number) =>
  Math.exp(-((x - mu) ** 2) / (2 * sigma * sigma)) / (sigma * Math.sqrt(2 * Math.PI));

/** Convex mixture of gaussians (weights need not be normalised). */
export function mixture(
  parts: { w: number; mu: number; sigma: number }[]
): (x: number) => number {
  const W = parts.reduce((s, p) => s + p.w, 0);
  const fns = parts.map((p) => ({ w: p.w / W, f: gauss(p.mu, p.sigma) }));
  return (x) => fns.reduce((s, p) => s + p.w * p.f(x), 0);
}
