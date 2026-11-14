// Offline export and script-level checks. This is not a real-browser audit.
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { Script } from "node:vm";

const root = fileURLToPath(new URL("../../", import.meta.url));
const html = readFileSync(`${root}generated-artifacts/afterglow-demo.html`, "utf8");
const markup = html.split("<script>")[0];
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
assert.equal(scripts.length, 1);
const program = new Script(scripts[0][1]);
assert.doesNotMatch(html, /transcript|presenter-notes|beatScript|copyScript|panel-timer|sourceMappingURL|__DS_CSS__|__EVIDENCE__/i);
assert.doesNotMatch(html, /<script[^>]+src=|@import\b|fetch\s*\(|sendBeacon|XMLHttpRequest/);
const ids = [...markup.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, "HTML IDs are unique");
for (const [, anchor] of markup.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(anchor), anchor);
assert.equal((markup.match(/class="ag-glass metric reveal"/g) || []).length, 3);

const scriptPath = `${root}presenter-notes/afterglow-two-minute.md`;
if (existsSync(scriptPath)) {
  const notes = readFileSync(scriptPath, "utf8");
  const segments = notes.split(/^## /m).slice(1);
  assert.equal(segments.length, 6);
  let previous = 0, words = 0;
  for (const segment of segments) {
    const time = segment.match(/^(\d):(\d\d)–(\d):(\d\d)/);
    assert.ok(time);
    const start = +time[1] * 60 + +time[2], end = +time[3] * 60 + +time[4];
    assert.equal(start, previous); previous = end;
    const spoken = segment.split("\n").slice(1).filter(l => l.trim() && !l.startsWith("*")).join(" ");
    words += spoken.split(/\s+/).filter(Boolean).length;
    assert.ok(!html.includes(spoken), "spoken paragraphs never appear in public output");
  }
  assert.equal(previous, 120);
  assert.ok(words >= 230 && words <= 260, `Script has ${words} words, expected 230–260`);
  console.log(`Speaker companion: ${words} spoken words / 120 seconds; not embedded.`);
} else {
  console.log("Local presenter companion absent (intentionally not in Git); public verification continues.");
}
for (const name of [".gitignore", ".replitignore"]) {
  assert.ok(readFileSync(`${root}${name}`, "utf8").includes("/presenter-notes/"));
}

// Minimal deterministic DOM fixture exercises our event handlers without
// network, real clipboard permissions, or app/API access.
function boot({ stored = "{}", blocked = false, copyOK = true, secure = true } = {}) {
  const nodes = new Map(), all = [], copied = [];
  let active = null, scrollCalls = 0, storage = stored;
  class Element {
    constructor(tag = "div") {
      this.tagName = tag.toUpperCase(); this.attributes = {}; this.listeners = {};
      this.style = {}; this.children = []; this.textContent = ""; this.value = ""; this.checked = false;
      const classes = new Set();
      this.classList = {
        add: c => classes.add(c),
        contains: c => classes.has(c),
        toggle: (c, on) => { const next = on ?? !classes.has(c); next ? classes.add(c) : classes.delete(c); return next; },
      };
      all.push(this);
    }
    set id(v) { this._id = v; nodes.set(v, this); }
    get id() { return this._id; }
    setAttribute(k, v) { this.attributes[k] = String(v); if (k === "id") this.id = v; }
    getAttribute(k) { return this.attributes[k]; }
    addEventListener(name, fn) { this.listeners[name] = fn; }
    appendChild(child) { this.children.push(child); }
    set innerHTML(v) { this._html = v; parse(v); }
    get innerHTML() { return this._html; }
    focus() { active = this; }
    select() {}
    scrollIntoView() { scrollCalls++; }
    querySelectorAll(selector) { return query(selector); }
    fire(name, event = {}) { this.listeners[name]?.({ preventDefault() {}, ...event }); }
  }
  function parse(source) {
    for (const [, tag, attrs] of source.matchAll(/<([a-z][a-z\d]*)\b([^>]*)>/gi)) {
      const el = new Element(tag);
      for (const [, k, v] of attrs.matchAll(/([\w-]+)="([^"]*)"/g)) el.setAttribute(k, v);
    }
  }
  function query(selector) {
    if (selector === "[data-scene]") return all.filter(e => e.getAttribute("data-scene"));
    if (selector === "[role=radio]") return all.filter(e => e.getAttribute("role") === "radio");
    return [];
  }
  parse(markup);
  const rootElement = new Element("html"); rootElement.classList.add("dark");
  const document = {
    documentElement: rootElement, getElementById: id => nodes.get(id),
    querySelectorAll: query, createElement: tag => new Element(tag),
    get activeElement() { return active; },
    execCommand: () => { if (copyOK) copied.push(nodes.get("copyFallback").value); return copyOK; },
  };
  program.runInNewContext({
    document,
    window: { isSecureContext: secure, matchMedia: () => ({ matches: false }) },
    navigator: { clipboard: { writeText: text => copyOK ? (copied.push(text), Promise.resolve()) : Promise.reject(new Error("blocked")) } },
    localStorage: {
      getItem: () => { if (blocked) throw Error("blocked"); return storage; },
      setItem: (_, value) => { if (blocked) throw Error("blocked"); storage = value; },
      removeItem: () => { if (blocked) throw Error("blocked"); storage = null; },
    },
  });
  return { nodes, query, copied, rootElement, get active() { return active; }, get scrollCalls() { return scrollCalls; }, get storage() { return storage; } };
}
const app = boot();
assert.equal(app.scrollCalls, 0, "load must not scroll past the opening story");
app.query("[data-scene]")[1].fire("click");
assert.equal(app.rootElement.classList.contains("dark"), false);
app.nodes.get("stNext").fire("click");
assert.equal(app.nodes.get("stage").getAttribute("aria-labelledby"), "tab-attend");
assert.equal(app.active.id, "stNext", "replacing the example preserves keyboard focus");
app.nodes.get("tab-attend").fire("keydown", { key: "End" });
assert.equal(app.active.id, "tab-track");
app.query("[role=radio]")[0].fire("keydown", { key: "ArrowRight" });
assert.equal(app.query("[role=radio]")[1].getAttribute("aria-checked"), "true");
assert.equal(app.nodes.get("visibility").textContent, "Access restricted");
assert.equal(app.nodes.get("intLink").href, "https://afterglow-cornell-tech.replit.app/integrations");
app.nodes.get("copyUrl").fire("click");
await new Promise(resolve => setImmediate(resolve));
assert.equal(app.copied[0], "https://afterglow-cornell-tech.replit.app");
assert.equal(app.nodes.get("chk-shared").checked, false, "copying is not proof of sharing");
app.nodes.get("chk-notes").checked = true;
app.nodes.get("chk-notes").fire("change");
assert.equal(JSON.parse(app.storage).notes, true);
app.nodes.get("clearChecks").fire("click");
assert.equal(app.storage, null);
assert.equal(app.nodes.get("chk-notes").checked, false);
const denied = boot({ blocked: true, copyOK: false });
denied.nodes.get("copyInvite").fire("click");
await new Promise(resolve => setImmediate(resolve));
assert.match(denied.nodes.get("shareStatus").textContent, /Copy blocked/);
denied.nodes.get("chk-notes").checked = true;
denied.nodes.get("chk-notes").fire("change");
assert.match(denied.nodes.get("progText").textContent, /not saved/);
const legacy = boot({ secure: false });
legacy.nodes.get("copyInvite").fire("click");
await new Promise(resolve => setImmediate(resolve));
assert.match(legacy.copied[0], /Access may be restricted/);
for (const raw of ['"invalid"', "[]", "null", '{"notes":"yes"}']) {
  assert.equal(boot({ stored: raw }).nodes.get("chk-notes").checked, false);
}
console.log("Public export checks passed: boundaries, links, theme, keyboard handlers, copy success/failure, and local checklist.");
