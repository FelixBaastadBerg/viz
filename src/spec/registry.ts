import type { ParamDef, TemplateDef, WidgetSpec } from "./types";
import { fn1, fn2 } from "./expr";

const registry = new Map<string, TemplateDef>();

export function registerTemplate(def: TemplateDef): void {
  registry.set(def.id, def);
}
export function getTemplate(id: string): TemplateDef | undefined {
  return registry.get(id);
}
export function allTemplates(): TemplateDef[] {
  return [...registry.values()];
}

export interface ValidationResult {
  ok: boolean;
  /** Human/AI-readable problems — fed back to the authoring model on retry. */
  errors: string[];
  /** Params with defaults filled in (only meaningful when ok). */
  params: Record<string, unknown>;
}

function checkParam(name: string, def: ParamDef, value: unknown): string | null {
  const t = def.type;
  switch (t.kind) {
    case "expr": {
      if (typeof value !== "string") return `param "${name}" must be a mathjs expression string`;
      try {
        (t.vars === 2 ? fn2 : fn1)(value);
      } catch (e) {
        return `param "${name}": ${(e as Error).message}`;
      }
      return null;
    }
    case "number": {
      if (typeof value !== "number" || !Number.isFinite(value))
        return `param "${name}" must be a finite number`;
      if (t.min !== undefined && value < t.min) return `param "${name}" must be ≥ ${t.min}`;
      if (t.max !== undefined && value > t.max) return `param "${name}" must be ≤ ${t.max}`;
      return null;
    }
    case "boolean":
      return typeof value === "boolean" ? null : `param "${name}" must be a boolean`;
    case "string": {
      if (typeof value !== "string") return `param "${name}" must be a string`;
      if (t.oneOf && !t.oneOf.includes(value))
        return `param "${name}" must be one of: ${t.oneOf.join(", ")}`;
      return null;
    }
    case "range": {
      if (!Array.isArray(value) || value.length !== 2 || value.some((v) => typeof v !== "number"))
        return `param "${name}" must be a [min, max] number pair`;
      if ((value[0] as number) >= (value[1] as number))
        return `param "${name}": min must be < max`;
      return null;
    }
    case "numbers":
      return Array.isArray(value) && value.every((v) => typeof v === "number")
        ? null
        : `param "${name}" must be a number array`;
    case "matrix2": {
      const ok =
        Array.isArray(value) &&
        value.length === 2 &&
        value.every((r) => Array.isArray(r) && r.length === 2 && r.every((v) => typeof v === "number"));
      return ok ? null : `param "${name}" must be a 2×2 number matrix [[a,b],[c,d]]`;
    }
  }
}

/** Validate a spec against its template; returns filled params + AI-friendly errors. */
export function validateSpec(spec: WidgetSpec): ValidationResult {
  const errors: string[] = [];
  const tpl = registry.get(spec.template);
  if (!tpl) {
    return {
      ok: false,
      errors: [
        `unknown template "${spec.template}". Available: ${[...registry.keys()].join(", ")}`,
      ],
      params: {},
    };
  }
  const params: Record<string, unknown> = {};
  for (const [name, def] of Object.entries(tpl.params)) {
    const given = spec.params?.[name];
    if (given === undefined) {
      if (def.required) errors.push(`missing required param "${name}" (${def.doc})`);
      else params[name] = def.default;
      continue;
    }
    const err = checkParam(name, def, given);
    if (err) errors.push(err);
    else params[name] = given;
  }
  for (const name of Object.keys(spec.params ?? {})) {
    if (!tpl.params[name]) errors.push(`unknown param "${name}" for template "${spec.template}"`);
  }
  if (spec.quiz) {
    if (!tpl.quizValue) errors.push(`template "${spec.template}" does not support a quiz wrapper`);
    const g = spec.quiz.goal;
    if (!g) errors.push(`quiz.goal is required`);
    else if (g.kind === "expr-zero") {
      try {
        fn1(g.expr);
      } catch (e) {
        errors.push(`quiz.goal.expr: ${(e as Error).message}`);
      }
    }
  }
  return { ok: errors.length === 0, errors, params };
}
