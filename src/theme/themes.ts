import type { KtTheme } from "./types";
import arvJson from "./themes/arv.json";
import eigengrauJson from "./themes/eigengrau.json";
import nordlysJson from "./themes/nordlys.json";

export const arv = arvJson as KtTheme;
export const eigengrau = eigengrauJson as KtTheme;
export const nordlys = nordlysJson as KtTheme;

export const themes: Record<string, KtTheme> = { arv, eigengrau, nordlys };
export const themeNames = Object.keys(themes);

/**
 * Resolve a theme by name; falls back to arv — Felix's Phase-0 decision
 * (2026-08-30): Kateter arv is the default direction for everything.
 */
export function getTheme(name?: string | null): KtTheme {
  return (name && themes[name]) || arv;
}
