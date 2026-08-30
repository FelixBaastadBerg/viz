/**
 * Template catalogue — every archetype's worked example, rendered live from
 * its spec (the exact JSON an authoring AI would produce). Theme via ?theme=.
 */
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, getTheme, loadThemeFonts, themeNames } from "@kateter/viz/core";
import { allTemplates, SpecRenderer } from "@kateter/viz/spec";
import "mafs/core.css";
import "mafs/font.css";
import "katex/dist/katex.min.css";
import "../src/kviz.css";
import "../gallery/gallery.css";

const theme = getTheme(new URLSearchParams(location.search).get("theme"));
loadThemeFonts(theme);

function Catalogue() {
  const templates = allTemplates();
  const [open, setOpen] = useState<Record<string, boolean>>({});
  return (
    <>
      <header>
        <h1>Malkatalog — {templates.length} arketyper ({theme.label})</h1>
        <p>
          Hver widget under er rendret direkte fra sin <em>spec</em> — den deklarative
          JSON-en forfatter-AI-en produserer. Bytt tema:{" "}
          {themeNames.map((n) => (
            <a key={n} href={`?theme=${n}`} style={{ marginRight: 10 }}>
              {n}
            </a>
          ))}
        </p>
      </header>
      {templates.map((tpl) => (
        <section className="demo" key={tpl.id} id={tpl.id}>
          <h2>{tpl.id}</h2>
          <p className="what">
            {tpl.description} <em>({tpl.curriculum.join(", ")})</em>{" "}
            <button style={{ marginLeft: 8 }} onClick={() => setOpen((o) => ({ ...o, [tpl.id]: !o[tpl.id] }))}>
              {open[tpl.id] ? "skjul spec" : "vis spec"}
            </button>
          </p>
          {open[tpl.id] && (
            <pre
              style={{
                background: "#fff", border: "1px solid #e3e5e8", borderRadius: 8,
                padding: 12, fontSize: 12, overflow: "auto",
              }}
            >
              {JSON.stringify(tpl.example, null, 2)}
            </pre>
          )}
          <div className="cells" style={{ gridTemplateColumns: "1fr" }}>
            <div className="cell tall">
              <div className="cell-title">{tpl.example.title}</div>
              <ThemeProvider theme={theme}>
                <SpecRenderer spec={tpl.example} />
              </ThemeProvider>
            </div>
          </div>
        </section>
      ))}
    </>
  );
}

createRoot(document.getElementById("root")!).render(<Catalogue />);
