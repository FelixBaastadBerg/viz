import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  resolve: {
    alias: {
      "@kateter/viz/core": path.resolve(__dirname, "src/core.ts"),
      "@kateter/viz/spec": path.resolve(__dirname, "src/spec.ts"),
      "@kateter/viz": path.resolve(__dirname, "src"),
    },
    dedupe: ["three", "react", "react-dom"],
  },
  build: {
    rollupOptions: {
      output: {
        // fast first paint: 2D pages must not pay for the 3D stack, and the
        // KaTeX/font layer loads as its own cacheable chunk
        manualChunks(id) {
          // keep Vite's preload helper out of the heavy chunks — every page
          // loads it, and rollup would otherwise weld it into three-stack
          if (id.includes("vite/preload-helper")) return "preload";
          if (/node_modules\/(three|@react-three|troika|three-stdlib)/.test(id)) return "three-stack";
          if (/node_modules\/katex/.test(id)) return "katex";
          if (/node_modules\/(react|react-dom|scheduler)\//.test(id)) return "react";
          if (/node_modules\/mafs/.test(id)) return "mafs";
        },
      },
      input: {
        gallery: path.resolve(__dirname, "index.html"),
        catalogue: path.resolve(__dirname, "catalogue.html"),
        specPreview: path.resolve(__dirname, "spec-preview.html"),
        derivative: path.resolve(__dirname, "artifacts/derivative.html"),
        quiz: path.resolve(__dirname, "artifacts/quiz.html"),
        volume3d: path.resolve(__dirname, "artifacts/volume3d.html"),
        flows: path.resolve(__dirname, "artifacts/flows.html"),
        riemann: path.resolve(__dirname, "riemann.html"),
        omdreining: path.resolve(__dirname, "omdreining.html"),
        dijkstra: path.resolve(__dirname, "dijkstra.html"),
        designLab: path.resolve(__dirname, "design-lab.html"),
      },
    },
  },
});
