// Plesk / Phusion Passenger application startup file.
//
// Set this file as the "Application Startup File" in the Plesk Node.js panel.
// It boots the self-contained Next.js standalone server produced by
// `pnpm build:plesk` (next.config.ts has output: "standalone").
//
// Passenger supplies PORT; the standalone server reads process.env.PORT
// (and HOSTNAME, defaulting to 0.0.0.0). Nothing else is required here.
const path = require("node:path");
const fs = require("node:fs");

const standaloneServer = path.join(__dirname, ".next", "standalone", "server.js");

if (!fs.existsSync(standaloneServer)) {
  console.error(
    "[server.js] .next/standalone/server.js not found.\n" +
      "Run `pnpm build:plesk` before starting the app.",
  );
  process.exit(1);
}

require(standaloneServer);
