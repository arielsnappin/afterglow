import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "afterglow-tests-"));
try {
  await build({
    entryPoints: ["src/lib/luma-scenario.test.ts", "src/lib/demo-store.test.ts"],
    outdir: dir, bundle: true, platform: "node", format: "cjs", external: ["pg-native"],
  });
  const result = spawnSync(process.execPath, ["--test", ...["luma-scenario", "demo-store"].map(name => join(dir, `${name}.test.js`))], { stdio: "inherit", env: process.env });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
