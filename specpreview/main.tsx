/**
 * Spec preview page — renders one widget spec fetched from ?file= (or pasted
 * JSON via ?spec=), themed via ?theme=. This is the render stage of the
 * authoring loop and the eval harness's target.
 */
import { createRoot } from "react-dom/client";
import { ThemeProvider, getTheme, loadThemeFonts } from "@kateter/viz/core";
import { SpecRenderer, validateSpec, type WidgetSpec } from "@kateter/viz/spec";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../src/kviz.css";
import "../artifacts/artifact.css";

const q = new URLSearchParams(location.search);
const theme = getTheme(q.get("theme"));
loadThemeFonts(theme);

async function main() {
  let spec: WidgetSpec;
  if (q.get("spec")) {
    spec = JSON.parse(q.get("spec")!);
  } else {
    const file = q.get("file") ?? "authoring/eval/spec-01.json";
    spec = await (await fetch(`/${file}`)).json();
  }
  const v = validateSpec(spec);
  // expose for the eval harness
  (window as unknown as Record<string, unknown>).__specValidation = v;
  document.title = spec.title ?? spec.template;
  createRoot(document.getElementById("root")!).render(
    <ThemeProvider theme={theme} fill>
      <SpecRenderer spec={spec} />
    </ThemeProvider>
  );
}
main();
