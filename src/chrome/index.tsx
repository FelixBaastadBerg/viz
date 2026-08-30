import { useId, useMemo, type ReactNode } from "react";
import katex from "katex";
import { useKtTheme } from "../theme/ThemeProvider";
import type { KtRole } from "../theme/types";
import { useIntro } from "../hooks";
import { fmt } from "../math";

/* ---------------------------------------------------------------- KFormula */
/** Inline KaTeX in Computer Modern (output: html — never mathml). */
export function KFormula({
  tex,
  className,
}: {
  tex: string;
  className?: string;
}) {
  const html = useMemo(
    () => katex.renderToString(tex, { output: "html", trust: true }),
    [tex]
  );
  return (
    <span className={className} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

/** Wrap a tex fragment in a semantic colour (ink tier) for the active theme. */
export function useTexColor(): (role: KtRole, tex: string) => string {
  const theme = useKtTheme();
  return (role, tex) => `{\\color{${theme.accents[role].ink}} ${tex}}`;
}

/** Render a string with `$...$` segments as inline KaTeX, rest as text. */
export function KMixed({ text }: { text: string }) {
  return (
    <>
      {text.split(/\$([^$]*)\$/g).map((seg, i) =>
        i % 2 ? <KFormula key={i} tex={seg} /> : <span key={i}>{seg}</span>
      )}
    </>
  );
}

/* ------------------------------------------------------------------ KPanel */
export interface KPanelProps {
  /** Standard corners; "custom" positions via className/style. */
  position?: "readout" | "controls" | "custom";
  /** Fade in after the given delay (ms); false = visible immediately. */
  fadeInDelay?: number | false;
  className?: string;
  children: ReactNode;
}

/** Widget chrome panel (readouts, controls) with the token look. */
export function KPanel({
  position = "custom",
  fadeInDelay = false,
  className,
  children,
}: KPanelProps) {
  const theme = useKtTheme();
  const fade = useIntro(
    fadeInDelay === false ? 1 : theme.motion.durFade,
    fadeInDelay === false ? 0 : fadeInDelay
  );
  const visible = fadeInDelay === false || fade > 0.02;
  return (
    <div
      className={[
        "kviz-panel",
        position !== "custom" ? `kviz-panel--${position}` : "",
        visible ? "kviz-visible" : "",
        className ?? "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- KReadout */
export interface KReadoutItem {
  /** Label, rendered as KaTeX. */
  label: string;
  value: number | string;
  digits?: number;
  role?: KtRole;
}

/** Live values row: muted labels, accent-ink tabular numbers. */
export function KReadout({ items }: { items: KReadoutItem[] }) {
  const theme = useKtTheme();
  return (
    <p className="kviz-readout">
      {items.map((it, i) => (
        <span key={i}>
          <KFormula tex={it.label} />
          {" = "}
          <span
            className="kviz-value"
            style={it.role ? { color: theme.accents[it.role].ink } : undefined}
          >
            {typeof it.value === "number" ? fmt(it.value, it.digits ?? 2) : it.value}
          </span>
        </span>
      ))}
    </p>
  );
}

/** Muted caption line (instructions). Display-font voice in themes that have one. */
export function KCaption({ children }: { children: ReactNode }) {
  return <p className="kviz-caption">{children}</p>;
}

/* ----------------------------------------------------------------- KSlider */
export interface KSliderProps {
  /** Label, rendered as KaTeX. */
  label: string;
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (v: number) => void;
  digits?: number;
}

/** Token slider: touch-coloured thumb, tabular value, ≥24px hit target. */
export function KSlider({
  label,
  min,
  max,
  step = 0.01,
  value,
  onChange,
  digits = 2,
}: KSliderProps) {
  const id = useId();
  return (
    <div className="kviz-slider-row">
      <label htmlFor={id}>
        <KFormula tex={label} />
        &nbsp;=
      </label>
      <input
        id={id}
        type="range"
        className="kviz-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <output htmlFor={id}>{fmt(value, digits)}</output>
    </div>
  );
}
