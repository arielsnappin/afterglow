// Standalone export: inlines runtime CSS from the authoritative Afterglow design system
// (artifacts/afterglow-design-system/src/index.css) plus the evidence snapshot into one HTML file.
// Usage (from repo root): node presentation/afterglow-demo/build.mjs
// Add --preview only when temporarily checking the export in the existing sandbox.
// --app also prepares the standalone public asset for the app's dev/build lifecycle.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const css = readFileSync(resolve(root, "artifacts/afterglow-design-system/src/index.css"), "utf8");
const evidence = JSON.parse(readFileSync(resolve(here, "evidence.json"), "utf8"));
const template = readFileSync(resolve(here, "template.html"), "utf8");
if (!evidence.publishedApp?.checkedAt || new URL(evidence.publishedApp.url).protocol !== "https:") {
  throw new Error("A verified, dated HTTPS published-app URL is required");
}

// Speaker notes must never be inputs to this public export. Fail closed if
// presenter controls or a note link return to the template.
if (/transcript|presenter-notes|beatScript|copyScript|panel-timer|var BEATS\b|sourceMappingURL/i.test(template)) {
  throw new Error("Presenter-only content found in public HTML");
}
for (const marker of ["/*__DS_CSS__*/", "/*__EVIDENCE__*/null"]) {
  if (template.split(marker).length !== 2) throw new Error(`Expected exactly one ${marker} placeholder`);
}

/** Return [start,end) of the brace block that begins at index i (i points at the selector start). */
function blockAt(src, i) {
  const open = src.indexOf("{", i);
  let depth = 0;
  for (let j = open; j < src.length; j++) {
    if (src[j] === "{") depth++;
    else if (src[j] === "}" && --depth === 0) return { open, end: j + 1 };
  }
  throw new Error("Unbalanced CSS");
}

const out = [];
// Walk top-level statements; keep browser-valid :root / .dark / @media blocks, convert @utility to classes,
// unwrap @layer components; drop @import/@plugin/@source/@custom-variant/@theme/@layer base|utilities (Tailwind compile-time).
let i = 0;
while (i < css.length) {
  const rest = css.slice(i);
  const ws = rest.match(/^(\s+|\/\*[\s\S]*?\*\/)/);
  if (ws) { i += ws[0].length; continue; }
  if (/^@(import|plugin|source|custom-variant)\b/.test(rest)) { i += rest.indexOf(";") + 1; continue; }
  const { open, end } = blockAt(css, i);
  const head = css.slice(i, open).trim();
  const body = css.slice(open + 1, end - 1);
  if (head.startsWith("@theme")) {
    // compile-time only; lift literal radius values so source CSS var(--radius-*) resolves
    const decls = body.match(/--radius-[a-z]+:\s*[^;]+;/g) || [];
    if (decls.length) out.push(`:root { ${decls.join(" ")} }`);
  } else if (head.startsWith("@utility")) {
    out.push(`.${head.replace("@utility", "").trim()} {${body}}`);
  } else if (head === "@layer components") {
    out.push(body.trim());
  } else if (head.startsWith("@layer")) {
    // Tailwind base/utilities layers use @apply: not runtime CSS
  } else {
    out.push(`${head} {${body}}`);
  }
  i = end;
}
const dsCss = out.join("\n\n");
if (/@apply|@theme|@utility|@import/.test(dsCss)) throw new Error("Compile-time CSS leaked into export");

const html = template
  .replace("/*__DS_CSS__*/", () => dsCss)
  .replace("/*__EVIDENCE__*/null", () => JSON.stringify(evidence, null, 2).replace(/</g, "\\u003c"));

// HTML must open offline with no page-load requests. External navigation links
// are allowed, but styles/scripts/media must be inline or data URLs.
if (/@import\b|(?:src|srcset)\s*=\s*["'](?!data:)|url\(\s*["']?(?!data:)[a-z/]/i.test(html)) {
  throw new Error("External or relative load-time resource found in standalone HTML");
}

const targets = ["generated-artifacts/afterglow-demo.html"];
if (process.argv.includes("--app")) targets.push("artifacts/afterglow/public/afterglow-demo.html");
if (process.argv.includes("--preview")) targets.push("artifacts/mockup-sandbox/public/afterglow-presenter-preview.html");
for (const target of targets) {
  const p = resolve(root, target);
  mkdirSync(dirname(p), { recursive: true });
  writeFileSync(p, html);
  console.log("wrote", target, html.length, "bytes");
}
