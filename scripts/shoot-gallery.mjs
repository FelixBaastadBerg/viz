/**
 * Screenshot verification for @kateter/viz (system Chrome via puppeteer-core —
 * no browser downloads, same approach as demos/scripts/shoot-themes.mjs).
 *
 * Shoots: the gallery (all components × all themes on one page) and the three
 * artifacts per theme. Fails on any console/page error.
 *
 * Usage: node scripts/shoot-gallery.mjs [outDir]   (dev server on :5175)
 */
import puppeteer from "puppeteer-core";
import { mkdirSync } from "fs";

const BASE = "http://localhost:5175";
const OUT = process.argv[2] ?? "evidence";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const THEMES = ["arv", "eigengrau", "nordlys"];

mkdirSync(OUT, { recursive: true });

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
});

let failures = 0;
const page = await browser.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("response", (r) => {
  if (r.status() >= 400 && !r.url().includes("favicon")) {
    errors.push(`${r.status()} ${r.url()}`);
  }
});
page.on("console", (m) => {
  // resource 404s are caught (with URLs) by the response listener above
  if (m.type() === "error" && !m.text().includes("Failed to load resource")) {
    errors.push(m.text());
  }
});

async function shoot(url, file, { settle = 2400, fullPage = false, width = 1280, height = 800 } = {}) {
  errors.length = 0;
  await page.setViewport({ width, height, deviceScaleFactor: fullPage ? 1 : 2 });
  await page.goto(url, { waitUntil: "networkidle0", timeout: 60000 });
  await new Promise((r) => setTimeout(r, settle));
  await page.screenshot({ path: `${OUT}/${file}`, fullPage });
  if (errors.length) {
    failures++;
    console.log(`ERRORS ${file}: ${errors.join(" | ")}`);
  } else {
    console.log(`ok    ${OUT}/${file}`);
  }
}

for (const artifact of ["derivative", "quiz", "volume3d"]) {
  for (const theme of THEMES) {
    await shoot(`${BASE}/artifacts/${artifact}.html?theme=${theme}`, `${artifact}--${theme}.png`);
  }
}
await shoot(`${BASE}/`, "gallery-full.png", { settle: 9000, fullPage: true, width: 1600, height: 1000 });

await browser.close();
process.exit(failures ? 1 : 0);
