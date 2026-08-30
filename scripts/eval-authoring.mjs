/**
 * Authoring eval, stage 2: render every generated spec headless; a spec
 * passes if validation is clean AND the page renders with zero errors.
 * Screenshots land in authoring/eval/renders/ for the human rubric pass.
 *
 * Usage: node scripts/eval-authoring.mjs [theme]   (dev server on :5175)
 */
import puppeteer from "puppeteer-core";
import { mkdirSync, readdirSync } from "fs";

const BASE = "http://localhost:5175";
const CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const THEME = process.argv[2] ?? "arv";
const OUT = "authoring/eval/renders";

mkdirSync(OUT, { recursive: true });
const specs = readdirSync("authoring/eval").filter((f) => f.endsWith(".json"));

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--hide-scrollbars", "--force-device-scale-factor=2"],
});
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });

const errors = [];
page.on("pageerror", (e) => errors.push(String(e)));
page.on("console", (m) => {
  if (m.type() === "error" && !m.text().includes("Failed to load resource")) errors.push(m.text());
});
page.on("response", (r) => {
  if (r.status() >= 400 && !r.url().includes("favicon")) errors.push(`${r.status()} ${r.url()}`);
});

let failures = 0;
for (const f of specs.sort()) {
  errors.length = 0;
  await page.goto(`${BASE}/spec-preview.html?file=authoring/eval/${f}&theme=${THEME}`, {
    waitUntil: "networkidle0",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 2600));
  const validation = await page.evaluate(() => window.__specValidation);
  const invalidBox = await page.evaluate(() =>
    document.body.textContent.includes("Ugyldig spec")
  );
  const name = f.replace(".json", "");
  await page.screenshot({ path: `${OUT}/${name}--${THEME}.png` });
  const bad = !validation?.ok || invalidBox || errors.length > 0;
  if (bad) failures++;
  console.log(
    `${bad ? "FAIL" : "ok  "} ${name}  valid=${validation?.ok} rendered=${!invalidBox}${
      errors.length ? "  errors: " + errors.join(" | ") : ""
    }`
  );
}
console.log(`\n${specs.length - failures}/${specs.length} first-try success`);
await browser.close();
process.exit(failures ? 1 : 0);
