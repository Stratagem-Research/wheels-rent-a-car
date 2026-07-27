#!/usr/bin/env node
/**
 * Smoke-test the notification outbox worker (log-only or Resend).
 *
 * Usage:
 *   node scripts/validate-notifications.mjs [baseUrl]
 *
 * Requires NOTIFICATION_CRON_SECRET when set on the target environment.
 */
const baseUrl = process.argv[2] ?? process.env.WEBSITE_URL ?? "http://localhost:3000";
const secret = process.env.NOTIFICATION_CRON_SECRET?.trim();

const headers = { "Content-Type": "application/json" };
if (secret) headers.authorization = `Bearer ${secret}`;

const response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/notifications/process`, {
  method: "POST",
  headers,
});

const body = await response.text();
console.log(`POST /api/notifications/process → ${response.status}`);
console.log(body);

if (!response.ok) process.exit(1);
