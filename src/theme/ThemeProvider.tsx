import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { KtTheme } from "./types";
import { arv, getTheme } from "./themes";
import { cssVars } from "./cssVars";

const ThemeContext = createContext<KtTheme>(arv);

/** The active theme. Components read ALL visual values from this (or CSS vars). */
export function useKtTheme(): KtTheme {
  return useContext(ThemeContext);
}

/**
 * Scoped theme root: injects the theme's --kt-* custom properties on a wrapper
 * element (not :root), so several themes can live on one page. All @kateter/viz
 * components must be rendered inside one.
 */
export function ThemeProvider({
  theme,
  className,
  fill = false,
  children,
}: {
  theme: KtTheme | string;
  className?: string;
  /** Stretch to fill the parent (position: relative stage). */
  fill?: boolean;
  children: ReactNode;
}) {
  const resolved = typeof theme === "string" ? getTheme(theme) : theme;
  const style = useMemo(
    () =>
      ({
        ...cssVars(resolved),
        ...(fill ? { position: "relative", width: "100%", height: "100%" } : {}),
      }) as React.CSSProperties,
    [resolved, fill]
  );
  return (
    <ThemeContext.Provider value={resolved}>
      <div
        className={`kviz-root${className ? ` ${className}` : ""}`}
        data-kt-theme={resolved.name}
        data-kt-mode={resolved.mode}
        style={style}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

/** CSS filter string for the theme's stroke glow, or undefined when off. */
export function glowFilter(theme: KtTheme, colorHex: string): string | undefined {
  return theme.effects.glow
    ? `drop-shadow(0 0 ${theme.effects.glowBlur}px ${colorHex}66)`
    : undefined;
}

/** Lazy-load the bundled webfonts a theme declares (no CDN, per token sheet). */
export function loadThemeFonts(theme: KtTheme): void {
  for (const pkg of theme.typography.fontPackages) {
    if (pkg === "@fontsource/poppins") {
      import("@fontsource/poppins/400.css");
      import("@fontsource/poppins/500.css");
      import("@fontsource/poppins/600.css");
    } else if (pkg === "@fontsource/caveat") {
      import("@fontsource/caveat/600.css");
      import("@fontsource/caveat/700.css");
    } else if (pkg === "@fontsource/space-grotesk") {
      import("@fontsource/space-grotesk/400.css");
      import("@fontsource/space-grotesk/500.css");
      import("@fontsource/space-grotesk/700.css");
    }
  }
}
