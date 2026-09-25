// Copies the assets that Next.js does NOT bundle into `.next/standalone`
// automatically, so the standalone server can serve them on Plesk/Passenger:
//   - public/            -> .next/standalone/public/
//   - .next/static/      -> .next/standalone/.next/static/
// Run automatically after `next build` via the `build:plesk` script.
import { cp, access } from "node:fs/promises";
import { constants } from "node:fs";
import path from "node:path";

const root = process.cwd();
const standalone = path.join(root, ".next", "standalone");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function copyDir(from, to) {
  if (!(await exists(from))) {
    console.warn(`[plesk-postbuild] skip (not found): ${path.relative(root, from)}`);
    return;
  }
  await cp(from, to, { recursive: true });
  console.log(`[plesk-postbuild] copied ${path.relative(root, from)} -> ${path.relative(root, to)}`);
}

if (!(await exists(standalone))) {
  console.error(
    "[plesk-postbuild] .next/standalone not found. Ensure next.config has output: 'standalone' and that `next build` ran first.",
  );
  process.exit(1);
}

await copyDir(path.join(root, "public"), path.join(standalone, "public"));
await copyDir(path.join(root, ".next", "static"), path.join(standalone, ".next", "static"));

console.log("[plesk-postbuild] done. Startup file: .next/standalone/server.js (or root server.js).");
