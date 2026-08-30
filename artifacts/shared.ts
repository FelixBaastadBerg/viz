/** Shared bootstrap for the artifact pages (theme from ?theme= URL param). */
import { getTheme, loadThemeFonts, type KtTheme } from "@kateter/viz/core";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../src/kviz.css";
import "./artifact.css";

export function bootTheme(): KtTheme {
  const name = new URLSearchParams(window.location.search).get("theme");
  const theme = getTheme(name);
  loadThemeFonts(theme);
  document.title = `${document.title.split(" · ")[0]} · ${theme.label}`;
  return theme;
}
