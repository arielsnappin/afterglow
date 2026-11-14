/**
 * Generates the consumable web theme (src/index.css) and the portable token
 * object (src/generated/tokens.tsx) from tokens.json.
 *
 * tokens.json (DTCG) is the single source of truth. This runs on dev start and
 * on every tokens.json change (see vite.config.ts) and before build/typecheck
 * (see package.json). Do not edit the generated files by hand.
 *
 * - src/index.css        the design system's theme. The preview app imports it,
 *                        and consuming apps import this same file (web).
 * - src/generated/tokens.tsx  hex token object for mobile (Expo) and any other
 *                             platform, so web + mobile share one source.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const tokensPath = join(root, "tokens.json");
const templatePath = join(here, "theme-template.css");
const cssOut = join(root, "src", "index.css");
const tsOutDir = join(root, "src", "generated");
const indexHtmlPath = join(root, "index.html");
const faviconOut = join(root, "public", "favicon.svg");

/** Resolve a DTCG node's $value, following {alias} references. */
function resolveValue(node, tokens) {
  const raw = node?.$value;
  if (typeof raw === "string" && raw.startsWith("{") && raw.endsWith("}")) {
    const path = raw.slice(1, -1).split(".");
    let cur = tokens;
    for (const key of path) cur = cur?.[key];
    return resolveValue(cur, tokens);
  }
  return raw;
}

function hexToHslChannels(hex) {
  const rgba = String(hex).match(/^rgba?\(([^)]+)\)$/i);
  if (rgba) {
    const [r, g, b, a = "1"] = rgba[1].split(",").map((x) => x.trim());
    const toHex = (n) => Number(n).toString(16).padStart(2, "0");
    const base = hexToHslChannels(`#${toHex(r)}${toHex(g)}${toHex(b)}`);
    return Number(a) === 1 ? base : `${base} / ${Number(a)}`;
  }
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        hue = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        hue = (b - r) / d + 2;
        break;
      default:
        hue = (r - g) / d + 4;
    }
    hue /= 6;
  }
  const H = Math.round(hue * 360);
  const S = Math.round(s * 1000) / 10;
  const L = Math.round(l * 1000) / 10;
  return `${H} ${S}% ${L}%`;
}

function toFontStack(value) {
  return Array.isArray(value) ? value.join(", ") : value;
}

function normalizeHex(hex) {
  let h = hex.replace("#", "").trim();
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  return `#${h}`;
}

/** Pick black or white text for best contrast on the given background hex. */
function contrastColor(hex) {
  const h = normalizeHex(hex).slice(1);
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  const luminance = 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
  return luminance > 0.5 ? "#000000" : "#ffffff";
}

/** First alphanumeric character of the design system's title, uppercased. */
function faviconLetter() {
  let title = "";
  try {
    const html = readFileSync(indexHtmlPath, "utf8");
    title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  } catch {
    title = "";
  }
  const match = title.match(/[A-Za-z0-9]/);
  return (match?.[0] ?? "D").toUpperCase();
}

function escapeXml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function buildFavicon(tokens) {
  const primary = normalizeHex(resolveValue(tokens.color.light.primary, tokens));
  const letter = escapeXml(faviconLetter());
  const fgToken = resolveValue(tokens.color.light.primaryForeground, tokens);
  const fg = fgToken && /^#/.test(fgToken) ? normalizeHex(fgToken) : contrastColor(primary);
  return `<svg width="180" height="180" viewBox="0 0 180 180" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="180" height="180" rx="36" fill="${primary}"/>
  <text x="90" y="92" fill="${fg}" font-family="Bricolage Grotesque, Arial Black, system-ui, sans-serif" font-size="104" font-weight="800" text-anchor="middle" dominant-baseline="central">${letter}</text>
</svg>
`;
}

function colorEntries(scope, tokens) {
  const out = {};
  for (const [name, node] of Object.entries(tokens.color[scope])) {
    if (name.startsWith("$")) continue;
    out[name] = resolveValue(node, tokens);
  }
  return out;
}

function buildCss(tokens) {
  let css = readFileSync(templatePath, "utf8");
  const replacements = {};

  for (const scope of ["light", "dark"]) {
    for (const [name, hex] of Object.entries(colorEntries(scope, tokens))) {
      replacements[`__DS_${scope.toUpperCase()}_${name.toUpperCase()}__`] =
        hexToHslChannels(hex);
    }
  }

  replacements.__DS_FONT_SANS__ = toFontStack(
    resolveValue(tokens.typography.fontFamily.sans, tokens),
  );
  replacements.__DS_FONT_SERIF__ = toFontStack(
    resolveValue(tokens.typography.fontFamily.serif, tokens),
  );
  replacements.__DS_FONT_MONO__ = toFontStack(
    resolveValue(tokens.typography.fontFamily.mono, tokens),
  );
  replacements.__DS_RADIUS__ = resolveValue(tokens.radius.base, tokens);
  replacements.__DS_SPACING__ = resolveValue(tokens.spacing.base, tokens);

  for (const [token, value] of Object.entries(replacements)) {
    css = css.split(token).join(value);
  }

  const leftover = css.match(/__DS_[A-Z0-9_]+__/g);
  if (leftover) {
    throw new Error(
      `tokens.json is missing values for: ${[...new Set(leftover)].join(", ")}`,
    );
  }
  return applyExtensions(css, tokens);
}

/**
 * Optional Afterglow extensions: a loadable font import (emitted as the first
 * CSS import so every consumer of styles.css loads it), motion durations and
 * easing, and per-theme elevation shadows, plus a reduced-motion guard.
 */
function applyExtensions(css, tokens) {
  const fontImport = resolveValue(tokens.typography?.fontImport, tokens);
  if (fontImport) {
    css = css.replace(
      '@import "tailwindcss";',
      `@import url("${fontImport}");\n@import "tailwindcss";`,
    );
  }
  const lines = [];
  const motion = tokens.motion;
  const elevation = tokens.elevation;
  const rootVars = [];
  if (motion) {
    for (const [name, node] of Object.entries(motion.duration ?? {})) {
      if (name.startsWith("$")) continue;
      rootVars.push(`  --motion-duration-${name}: ${resolveValue(node, tokens)};`);
    }
    for (const [name, node] of Object.entries(motion.easing ?? {})) {
      if (name.startsWith("$")) continue;
      rootVars.push(`  --motion-ease-${name}: ${resolveValue(node, tokens)};`);
    }
  }
  const shadowScope = (scope) =>
    Object.entries(elevation?.[scope] ?? {})
      .filter(([name]) => !name.startsWith("$"))
      .map(([name, node]) => `  --elevation-${name}: ${resolveValue(node, tokens)};`);
  if (!motion && !elevation) return css + sourceExtensions(tokens);
  lines.push("", "/* AFTERGLOW EXTENSIONS: motion + elevation (generated from tokens.json). */");
  lines.push("@theme inline {");
  for (const name of Object.keys(elevation?.light ?? {})) {
    if (name.startsWith("$")) continue;
    lines.push(`  --shadow-${name}: var(--elevation-${name});`);
  }
  for (const name of Object.keys(motion?.easing ?? {})) {
    if (name.startsWith("$")) continue;
    lines.push(`  --ease-${name}: var(--motion-ease-${name});`);
  }
  lines.push(`  --default-transition-duration: var(--motion-duration-base, 150ms);`);
  lines.push(`  --default-transition-timing-function: var(--motion-ease-standard, ease);`);
  lines.push("}", "", ":root {", ...rootVars, ...shadowScope("light"), "}", "");
  lines.push(".dark {", ...shadowScope("dark"), "}", "");
  lines.push(
    "@media (prefers-reduced-motion: reduce) {",
    "  *, *::before, *::after {",
    "    animation-duration: 0.01ms !important;",
    "    animation-iteration-count: 1 !important;",
    "    transition-duration: 0.01ms !important;",
    "    scroll-behavior: auto !important;",
    "  }",
    "}",
    "",
  );
  return css + lines.join("\n") + sourceExtensions(tokens);
}

const sourceCssPath = join(here, "source", "afterglow-components.css");
const kebab = (s) => s.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);

/**
 * Uploaded Afterglow source system ($extensions.afterglow.source in
 * tokens.json): emit every source token as a CSS variable under its source
 * name, per theme (dark = Night out, light = Day party), register Tailwind
 * utilities for the source colors/radii/fonts/type styles, and append the
 * source component stylesheet (authoring input in scripts/source/).
 */
function sourceExtensions(tokens) {
  const src = tokens.$extensions?.afterglow?.source;
  if (!src) return "";
  const scope = { light: [], dark: [] };
  const both = (name, value) => {
    for (const th of ["light", "dark"]) {
      const v = typeof value === "string" ? value : value[th];
      scope[th].push(`  --${name}: ${v};`);
    }
  };
  for (const t of src.color.tokens) both(t.name, t.value);
  for (const t of src.shadow?.tokens ?? []) both(t.name, t.value);
  const root = [];
  for (const [k, v] of Object.entries(src.type.families)) root.push(`  --font-${k}: ${v};`);
  for (const t of src.spacing?.tokens ?? []) root.push(`  --${t.name}: ${t.value};`);
  for (const t of src.blur?.tokens ?? []) root.push(`  --${t.name}: ${t.value};`);
  for (const t of src.radius?.tokens ?? []) root.push(`  --ag-${t.name}: ${t.value};`);
  const dur = tokens.motion?.duration ?? {};
  root.push(`  --ag-duration-press: ${resolveValue(dur.fast, tokens)};`);
  root.push(`  --ag-duration-select: ${resolveValue(dur.base, tokens)};`);
  root.push(`  --ag-duration-enter: ${resolveValue(dur.slow, tokens)};`);

  const theme = [];
  for (const t of src.color.tokens) theme.push(`  --color-${t.name}: var(--${t.name});`);
  const r = Object.fromEntries((src.radius?.tokens ?? []).map((t) => [t.name, t.value]));
  for (const k of ["sm", "md", "lg", "xl"]) if (r[`radius-${k}`]) theme.push(`  --radius-${k}: ${r[`radius-${k}`]};`);
  if (r["radius-pill"]) theme.push(`  --radius-pill: ${r["radius-pill"]};`);
  theme.push(`  --font-display: ${src.type.families.display};`);
  theme.push(`  --font-accent: ${src.type.families.accent};`);
  theme.push(`  --shadow-glow-pop: var(--glow-pop);`, `  --shadow-glow-zap: var(--glow-zap);`, `  --shadow-glass: var(--shadow-card);`);
  theme.push(`  --ease-bounce: var(--ag-ease-bounce);`, `  --ease-out: var(--ag-ease-out);`);
  theme.push(`  --blur-glass: var(--blur-glass);`, `  --blur-heavy: var(--blur-heavy);`);

  const utils = [];
  for (const g of src.type.groups) {
    for (const st of g.styles) {
      const body = [`  font-family: var(--font-${g.family});`];
      for (const [k, v] of Object.entries(st)) {
        if (["name", "sample", "usage"].includes(k)) continue;
        body.push(`  ${kebab(k)}: ${v};`);
      }
      utils.push(`@utility type-${st.name} {`, ...body, "}");
    }
  }
  utils.push(
    "@utility glass {",
    "  background-color: var(--glass);",
    "  border: 1px solid var(--line);",
    "  -webkit-backdrop-filter: blur(var(--blur-glass));",
    "  backdrop-filter: blur(var(--blur-glass));",
    "}",
    "@utility glass-strong {",
    "  background-color: var(--glass-strong);",
    "  border: 1px solid var(--line);",
    "  -webkit-backdrop-filter: blur(var(--blur-glass));",
    "  backdrop-filter: blur(var(--blur-glass));",
    "}",
  );

  const componentCss = readFileSync(sourceCssPath, "utf8");
  return [
    "",
    "/* AFTERGLOW SOURCE SYSTEM (generated from tokens.json $extensions.afterglow.source). */",
    "@theme inline {",
    ...theme,
    "}",
    "",
    ":root {",
    ...root,
    ...scope.light,
    "}",
    "",
    ".dark {",
    ...scope.dark,
    "}",
    "",
    ...utils,
    "",
    "/* Source component styles (scripts/source/afterglow-components.css, from the uploaded bundle.css). */",
    "@layer components {",
    componentCss,
    "}",
    "",
  ].join("\n");
}

function buildTs(tokens) {
  const portable = {
    color: {
      light: colorEntries("light", tokens),
      dark: colorEntries("dark", tokens),
    },
    fontFamily: {
      sans: resolveValue(tokens.typography.fontFamily.sans, tokens),
      display: resolveValue(tokens.typography.fontFamily.display, tokens),
      serif: resolveValue(tokens.typography.fontFamily.serif, tokens),
      mono: resolveValue(tokens.typography.fontFamily.mono, tokens),
    },
    radius: resolveValue(tokens.radius.base, tokens),
    spacing: resolveValue(tokens.spacing.base, tokens),
    fontImport: resolveValue(tokens.typography.fontImport, tokens) ?? null,
    source: tokens.$extensions?.afterglow?.source ?? null,
    motion: tokens.motion
      ? {
          duration: Object.fromEntries(
            Object.entries(tokens.motion.duration ?? {})
              .filter(([k]) => !k.startsWith("$"))
              .map(([k, n]) => [k, resolveValue(n, tokens)]),
          ),
          easing: Object.fromEntries(
            Object.entries(tokens.motion.easing ?? {})
              .filter(([k]) => !k.startsWith("$"))
              .map(([k, n]) => [k, resolveValue(n, tokens)]),
          ),
        }
      : null,
    elevation: tokens.elevation
      ? Object.fromEntries(
          ["light", "dark"].map((scope) => [
            scope,
            Object.fromEntries(
              Object.entries(tokens.elevation[scope] ?? {})
                .filter(([k]) => !k.startsWith("$"))
                .map(([k, n]) => [k, resolveValue(n, tokens)]),
            ),
          ]),
        )
      : null,
  };
  return `/* GENERATED FROM tokens.json -- DO NOT EDIT. Run scripts/build-tokens.mjs. */
// Portable design tokens (colors as hex). Web consumes the theme via
// src/index.css; mobile (Expo) and any other platform import this object so the
// whole product shares one source of truth.
export const tokens = ${JSON.stringify(portable, null, 2)} as const;

export type Tokens = typeof tokens;
export default tokens;
`;
}

export function buildTokens() {
  const tokens = JSON.parse(readFileSync(tokensPath, "utf8"));
  writeFileSync(cssOut, buildCss(tokens));
  mkdirSync(tsOutDir, { recursive: true });
  writeFileSync(join(tsOutDir, "tokens.tsx"), buildTs(tokens));
  mkdirSync(dirname(faviconOut), { recursive: true });
  writeFileSync(faviconOut, buildFavicon(tokens));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  buildTokens();
  process.stdout.write(
    "Generated src/index.css, src/generated/tokens.tsx, and public/favicon.svg\n",
  );
}
