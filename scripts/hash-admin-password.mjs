#!/usr/bin/env node
/**
 * Generate an ADMIN_PASSWORD_HASH for .env.
 *
 *   node scripts/hash-admin-password.mjs
 *   node scripts/hash-admin-password.mjs "the password"
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
  return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${key.toString("hex")}`;
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

const fromArg = process.argv[2];
const password = (fromArg ?? (await prompt("Admin password (visible as you type): "))).trim();

if (!password || password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

console.log("\nAdd this to .env (and drop ADMIN_PASSWORD once every environment has it):\n");
console.log(`ADMIN_PASSWORD_HASH=${hash(password)}\n`);
