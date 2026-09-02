import { useId, useMemo, type CSSProperties, type ReactNode } from "react";
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

/** Live values as instrument chips: one pill per value, muted label +
    accent-ink tabular number. Sits on the instrument line below the figure. */
export function KReadout({ items }: { items: KReadoutItem[] }) {
  const theme = useKtTheme();
  return (
    <p className="kviz-readout">
      {items.map((it, i) => (
        <span key={i} className="kviz-chip">
          <KFormula tex={it.label} />
          <span className="kviz-chip-eq">=</span>
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

/* ----------------------------------------------------------------- KLegend */
export type KLegendCorner = "tl" | "tr" | "bl" | "br";

export interface KLegendItem {
  /** Label, rendered as KaTeX. */
  label: string;
  /** Live value. Omit for a label-only row (curve identification). */
  value?: number | string;
  digits?: number;
  role?: KtRole;
}

export interface KLegendProps {
  /** Which corner of the figure the box sits in (default "tl"). */
  corner?: KLegendCorner;
  items: KLegendItem[];
}

/**
 * W7: matplotlib-style legend box INSIDE the figure — white card, thin
 * border, one row per value with a round marker in the value's role colour.
 * Render it as a sibling of <KPlot> inside <KFig> (which provides the
 * position:relative wrapper). Critical styles are inline: embedded contexts
 * (TipTap node views) carry a hostile `div[data-node-view-wrapper] div`
 * rule that overrides class CSS — inline always wins.
 */
export function KLegend({ corner = "tl", items }: KLegendProps) {
  const theme = useKtTheme();
  const pos: CSSProperties = {
    ...(corner[0] === "t" ? { top: 10 } : { bottom: 10 }),
    ...(corner[1] === "l" ? { left: 12 } : { right: 12 }),
  };
  return (
    <div
      className="kviz-legend"
      style={{
        position: "absolute",
        ...pos,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        flex: "none",
        gap: 3,
        width: "max-content",
        maxWidth: "calc(100% - 24px)",
        boxSizing: "border-box",
        background: "#fff",
        border: "1px solid var(--kt-border)",
        borderRadius: 8,
        boxShadow: "0 1px 4px rgba(28,25,23,.10)",
        padding: "8px 12px",
        zIndex: 2,
        pointerEvents: "none",
        fontSize: "var(--kt-size-readout)",
        lineHeight: 1.4,
      }}
    >
      {items.map((it, i) => {
        const acc = it.role ? theme.accents[it.role] : undefined;
        return (
          <div
            key={i}
            className="kviz-legend-row"
            style={{
              display: "flex",
              // the host's `div[data-node-view-wrapper] div { flex-direction:
              // inherit }` would inherit the box's column — pin every flex
              // property inline
              flexDirection: "row",
              justifyContent: "flex-start",
              flex: "none",
              alignItems: "center",
              gap: 7,
              width: "auto",
              whiteSpace: "nowrap",
            }}
          >
            <span
              className="kviz-legend-marker"
              style={{
                display: "inline-block",
                width: 10,
                height: 10,
                borderRadius: "50%",
                flex: "0 0 10px",
                background: acc ? acc.stroke : "var(--kt-text-muted)",
              }}
            />
            <span style={{ display: "inline-block", width: "auto", color: acc ? acc.ink : "var(--kt-text)" }}>
              <KFormula tex={it.label} />
            </span>
            {it.value !== undefined && (
              <>
                <span style={{ display: "inline-block", width: "auto", color: "var(--kt-text-muted)" }}>=</span>
                <span
                  className="kviz-legend-value"
                  style={{
                    display: "inline-block",
                    width: "auto",
                    fontVariantNumeric: "tabular-nums",
                    color: acc ? acc.ink : "var(--kt-text)",
                  }}
                >
                  {typeof it.value === "number" ? fmt(it.value, it.digits ?? 2) : it.value}
                </span>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}

/* -------------------------------------------------------------------- KFig */
/**
 * Figure wrapper: position:relative around the plot so a <KLegend> can be
 * absolutely positioned over it (W7). Critical styles inline — see KLegend.
 */
export function KFig({ legend, children }: { legend?: ReactNode; children: ReactNode }) {
  return (
    <div
      className="kviz-figwrap"
      style={{ position: "relative", display: "block", width: "auto" }}
    >
      {children}
      {legend}
    </div>
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
    <div
      className="kviz-slider-row"
      style={{
        // pin the flex layout inline: the host's `div[data-node-view-wrapper]
        // div { display/width/gap: inherit }` rule turns the row into a
        // full-width block otherwise
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        width: "auto",
        flex: "none",
      }}
    >
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
        style={{ "--kviz-fill": `${((value - min) / (max - min)) * 100}%` } as CSSProperties}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <output htmlFor={id}>{fmt(value, digits)}</output>
    </div>
  );
}
