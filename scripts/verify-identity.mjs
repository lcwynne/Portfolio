#!/usr/bin/env node
// Safety check: refuse to run if this repo's git identity could leak
// a work email into commit history. Run via `npm run verify-identity`
// or wire into a pre-commit hook.

import { execSync } from 'node:child_process';

const BLOCKLIST = ['klaviyo.com'];

function read(name) {
  try {
    return execSync(`git config ${name}`, { encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const email = read('user.email');
const name = read('user.name');

if (!email) {
  console.error('✗ git user.email is not set for this repo.');
  process.exit(1);
}

const hit = BLOCKLIST.find((needle) => email.toLowerCase().includes(needle));
if (hit) {
  console.error(`✗ git user.email "${email}" matches blocklist entry "${hit}".`);
  console.error('  Run:  git config --local user.email "your-personal@example.com"');
  process.exit(1);
}

console.log(`✓ git identity OK — ${name} <${email}>`);
