import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const dir = await mkdtemp(join(tmpdir(), "afterglow-experience-"));
try {
  await build({
    entryPoints: ["tests/experience.test.tsx"],
    outfile: join(dir, "experience.cjs"),
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    define: { "import.meta.env.BASE_URL": '"/"' },
    plugins: [{
      name: "workspace-api-fixture",
      setup(build) {
        build.onResolve({ filter: /^@workspace\/api-client-react$/ }, () => ({
          path: resolve("tests/api-fixture.ts"),
        }));
      },
    }],
  });
  const result = spawnSync(process.execPath, ["--test", join(dir, "experience.cjs")], { stdio: "inherit" });
  process.exitCode = result.status ?? 1;
} finally {
  await rm(dir, { recursive: true, force: true });
}
