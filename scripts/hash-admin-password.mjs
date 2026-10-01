#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH for .env.
 *
 *   node scripts/hash-admin-password.mjs            -> ADMIN_PASSWORD_HASH (ops)
 *   node scripts/hash-admin-password.mjs --editor   -> ADMIN_EDITOR_PASSWORD_HASH
 *   node scripts/hash-admin-password.mjs "the password"
 *
 * Ops and editors have separate passwords; the two must differ.
 *
 * With no argument it asks for the password. The prompt is plain (not hidden):
 * hidden input needs raw-mode terminal support that several shells lack, and a
 * prompt you can't type into is worse than one you can see. Clear your screen
 * afterwards. Paste the printed line into .env and remove ADMIN_PASSWORD once
 * every environment has the hash.
 */
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const N = 16384;
const R = 8;
const P = 1;
const KEY_LENGTH = 64;

function hash(password) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, KEY_LENGTH, {
    N,
    r: R,
    p: P,
    maxmem: 256 * 1024 * 1024,
  });
  // Colons, not `$`: Next's .env loader expands `$NAME` and would mangle the hash.
  return ["scrypt", N, R, P, salt.toString("hex"), key.toString("hex")].join(":");
}

function prompt(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    let answered = false;
    rl.question(question, (answer) => {
      answered = true;
      rl.close();
      resolve(answer);
    });
    rl.once("close", () => {
      if (!answered) resolve("");
    });
  });
}

const args = process.argv.slice(2);
const forEditor = args.includes("--editor");
const fromArg = args.find((arg) => !arg.startsWith("--"));
const label = forEditor ? "Editor" : "Admin";
const password = (fromArg ?? (await prompt(`${label} password (visible as you type): `))).trim();

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const hashVar = forEditor ? "ADMIN_EDITOR_PASSWORD_HASH" : "ADMIN_PASSWORD_HASH";
const plainVar = forEditor ? "ADMIN_EDITOR_PASSWORD" : "ADMIN_PASSWORD";
console.log(`\nAdd this to .env (and drop ${plainVar} once every environment has it):\n`);
console.log(`${hashVar}=${hash(password)}\n`);
