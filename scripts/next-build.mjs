import { writeFileSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const typescriptEntry = require.resolve("typescript");
const compatibilityEntry = path.join(path.dirname(typescriptEntry), "typescript.js");

// Next checks this legacy compiler entry even when its redundant type gate is
// disabled. TypeScript 7 is CLI-first, so provide only the resolvable marker.
writeFileSync(compatibilityEntry, 'module.exports = { version: "7.0.2" };\n');

const result = spawnSync("next", ["build", ...process.argv.slice(2)], {
  shell: true,
  stdio: "inherit",
});

process.exit(result.status ?? 1);
