import { useMemo } from "react";
import type { WidgetSpec } from "./types";
import { validateSpec, getTemplate } from "./registry";
// registering side effects: the catalogue
import "./templates/funksjoner";
import "./templates/geometri";
import "./templates/data";
import "./templates/diverse";
import "./templates/vekst";
import "./templates/parametrisk";
import "./templates/riemann";
import "./templates/omdreining3d";

/**
 * Render a widget spec. Invalid specs render the validation errors instead of
 * crashing — the same strings are what the authoring loop feeds back to the
 * model on retry.
 */
export function SpecRenderer({ spec }: { spec: WidgetSpec }) {
  const result = useMemo(() => validateSpec(spec), [spec]);
  if (!result.ok) {
    return (
      <div style={{ padding: 24, fontFamily: "monospace", fontSize: 13, color: "var(--kt-wrong-ink)" }}>
        <strong>Ugyldig spec ({spec.template}):</strong>
        <ul>
          {result.errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </div>
    );
  }
  const tpl = getTemplate(spec.template)!;
  return <>{tpl.render(result.params, spec.quiz)}</>;
}
