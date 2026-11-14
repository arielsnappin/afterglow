import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = (path) => readFileSync(`${root}${path}`, 'utf8');
const tokens = JSON.parse(read('tokens.json'));
const roles = [
  'background', 'foreground', 'card', 'cardForeground', 'popover',
  'popoverForeground', 'primary', 'primaryForeground', 'secondary',
  'secondaryForeground', 'muted', 'mutedForeground', 'accent',
  'accentForeground', 'destructive', 'destructiveForeground', 'border',
  'input', 'ring', 'chart1', 'chart2', 'chart3', 'chart4', 'chart5',
  'sidebar', 'sidebarForeground', 'sidebarBorder', 'sidebarPrimary',
  'sidebarPrimaryForeground', 'sidebarAccent', 'sidebarAccentForeground',
  'sidebarRing',
];
function resolve(node, seen = new Set()) {
  const value = node?.$value;
  if (typeof value !== 'string' || !value.startsWith('{')) return value;
  assert(!seen.has(value), `Circular alias: ${value}`);
  seen.add(value);
  return resolve(value.slice(1, -1).split('.').reduce((n, k) => n?.[k], tokens), seen);
}
function rgba(color) {
  if (color.startsWith('#')) return [...color.slice(1).match(/../g).map((c) => parseInt(c, 16)), 1];
  const channels = color.match(/[\d.]+/g)?.map(Number);
  assert(channels?.length === 4, `Unsupported color: ${color}`);
  return channels;
}
function composite(color, ground) {
  const [r, g, b, a] = rgba(color);
  const bg = rgba(ground);
  return [r, g, b].map((c, i) => Math.round(c * a + bg[i] * (1 - a)));
}
function luminance(channels) {
  const linear = channels.map((c) => {
    const n = c / 255;
    return n <= 0.04045 ? n / 12.92 : ((n + 0.055) / 1.055) ** 2.4;
  });
  return linear[0] * 0.2126 + linear[1] * 0.7152 + linear[2] * 0.0722;
}
function contrast(a, b, ground) {
  const bg = composite(b, ground);
  const bgHex = `#${bg.map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  const [lo, hi] = [luminance(composite(a, bgHex)), luminance(bg)].sort((x, y) => x - y);
  return (hi + 0.05) / (lo + 0.05);
}
const source = JSON.parse(read('docs/references/uploaded-system/tokens.json'));
assert.deepEqual(tokens.$extensions.afterglow.source, source, 'Retained uploaded tokens must match the theme source');
for (const mode of ['light', 'dark']) {
  const palette = tokens.color[mode];
  assert.deepEqual(Object.keys(palette).filter((k) => !k.startsWith('$')).sort(), [...roles].sort());
  for (const role of roles) rgba(resolve(palette[role]));
  const ground = resolve(palette.background);
  const pairs = [
    ['foreground', 'background'], ['cardForeground', 'card'],
    ['popoverForeground', 'popover'], ['primaryForeground', 'primary'],
    ['secondaryForeground', 'secondary'], ['mutedForeground', 'muted'],
    ['mutedForeground', 'background'], ['mutedForeground', 'card'],
    ['accentForeground', 'accent'], ['destructiveForeground', 'destructive'],
    ['destructive', 'background'], ['sidebarForeground', 'sidebar'],
    ['sidebarPrimaryForeground', 'sidebarPrimary'],
    ['sidebarAccentForeground', 'sidebarAccent'],
  ];
  for (const [fg, bg] of pairs) {
    const ratio = contrast(resolve(palette[fg]), resolve(palette[bg]), ground);
    assert(ratio >= 4.5, `${mode}: ${fg}/${bg} is ${ratio.toFixed(2)}:1; needs 4.5:1`);
    console.info(`${mode} ${fg}/${bg}: ${ratio.toFixed(2)}:1`);
  }
  for (const [fg, bg] of [['ring', 'background'], ['ring', 'card'], ['sidebarRing', 'sidebar']]) {
    const ratio = contrast(resolve(palette[fg]), resolve(palette[bg]), ground);
    assert(ratio >= 3, `${mode}: ${fg}/${bg} is ${ratio.toFixed(2)}:1; needs 3:1`);
  }
  for (const sourceName of ['bg', 'ink', 'pop', 'on-bright', 'focus']) {
    const role = { bg: 'background', ink: 'foreground', pop: 'primary', 'on-bright': 'primaryForeground', focus: 'ring' }[sourceName];
    const value = source.color.tokens.find((t) => t.name === sourceName).value;
    assert.equal(resolve(palette[role]), typeof value === 'string' ? value : value[mode], `Source fidelity: ${mode}.${sourceName}`);
  }
  for (const fill of ['pop', 'zap', 'sun', 'sky', 'grape']) {
    const value = source.color.tokens.find((t) => t.name === fill).value;
    assert(contrast('#17121f', value, ground) >= 4.5, `Neon ${fill} needs dark text`);
  }
}
assert.notEqual(resolve(tokens.color.light.background), resolve(tokens.color.dark.background));
assert.equal(resolve(tokens.radius.base), '24px');
assert.equal(resolve(tokens.spacing.base), '0.25rem');
for (const family of ['sans', 'serif', 'mono']) {
  assert(Array.isArray(resolve(tokens.typography.fontFamily[family])), family);
}
const registry = read('src/preview/registry.tsx');
const demos = readdirSync(`${root}src/preview/demos`).filter((f) => f.endsWith('.tsx'));
const modules = readdirSync(`${root}src/components/ui`).filter((f) => f.endsWith('.tsx'));
const grouped = { toaster: 'toast' };
for (const module of modules) {
  const name = module.replace('.tsx', '');
  const family = grouped[name] ?? name;
  assert(demos.includes(`${family}.tsx`), `Missing story for ${name}`);
}
for (const demo of demos) {
  const name = demo.replace('.tsx', '');
  if (name === 'afterglow-source') continue;
  const occurrences = registry.match(new RegExp(`import\\(['"]\\./demos/${name}['"]\\)`, 'g')) ?? [];
  assert.equal(occurrences.length, 1, `${name} must have exactly one lazy registry import`);
}
for (const name of ['Button', 'Rsvp', 'GlassCard', 'EventCard', 'AvatarStack', 'Sticker', 'TextField']) {
  assert.equal((registry.match(new RegExp(`Page: Source${name}Demo\\b`, 'g')) ?? []).length, 1, `Source family ${name} needs one registered story`);
}
for (const generated of ['src/index.css', 'src/generated/tokens.tsx']) {
  assert(!read(generated).includes('__DS_'), `Unresolved placeholder in ${generated}`);
}
assert(!read('index.html').includes('maximum-scale=1'), 'Preview must allow browser zoom');
console.info(`Verified source fidelity, alpha-composited AA text pairs, focus contrast, ${modules.length} compatibility modules, and seven uploaded component families.`);
