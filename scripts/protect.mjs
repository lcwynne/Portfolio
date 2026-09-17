#!/usr/bin/env node
/**
 * Encrypt (and decrypt) the case-study pages.
 *
 *   node scripts/protect.mjs lock   <password>   # plaintext -> encrypted pages
 *   node scripts/protect.mjs unlock <password>   # encrypted pages -> _source/
 *
 * "lock" reads each page from _source/ (or, the first time, from the live page
 * if it is still plaintext), encrypts it with AES-256-GCM under a key derived
 * from the password via PBKDF2-SHA256, and writes a small shell page that holds
 * only ciphertext plus a decryptor.
 *
 * The ciphertext contains the complete original page, so "unlock" round-trips it
 * back. The encrypted page in the repo is therefore also the backup — _source/
 * is a convenience, not the only copy.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { webcrypto as crypto } from 'node:crypto';
import { dirname } from 'node:path';

const SLUGS = ['multiproductexperience', 'machine-learning', 'aidincopilot', 'appbuilder'];
const ITERATIONS = 250000;
const MARKER = 'lw-encrypted-payload';

const [, , cmd, password] = process.argv;
if (!cmd || !password) {
  console.error('usage: node scripts/protect.mjs <lock|unlock> <password>');
  process.exit(1);
}

const enc = new TextEncoder();
const dec = new TextDecoder();

async function deriveKey(password, salt) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: ITERATIONS, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

const b64 = (buf) => Buffer.from(buf).toString('base64');
const unb64 = (s) => new Uint8Array(Buffer.from(s, 'base64'));

function isEncrypted(html) { return html.includes(MARKER); }

function stripSoftGate(html) {
  return html.replace(/<link href="\/assets\/css\/gate\.css"[^>]*>/g, '')
             .replace(/<script src="\/assets\/js\/gate\.js"><\/script>/g, '');
}

function shell({ title, salt, iv, payload }) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/>` +
`<meta content="width=device-width, initial-scale=1" name="viewport"/>` +
`<title>${title}</title><meta name="robots" content="noindex"/>` +
`<link href="/assets/65e89fa0190699d5ae4884bf_lw_logo_1.png" rel="shortcut icon" type="image/x-icon"/>` +
`<link href="/assets/css/gate.css" rel="stylesheet" type="text/css"/></head><body>` +
`<div id="lw-gate"><div class="lw-gate-card">` +
`<h1>Protected page</h1>` +
`<p>This case study is password protected. Please enter the password below.</p>` +
`<form><input type="password" autocomplete="current-password" placeholder="Password" aria-label="Password"/>` +
`<button type="submit">View case study</button></form>` +
`<p class="lw-gate-err" hidden>Incorrect password. Please try again.</p>` +
`<p class="lw-gate-back"><a href="/">&larr; Back to laurenwynne.com</a></p>` +
`</div></div>` +
`<script id="${MARKER}" type="application/json">${JSON.stringify({ salt, iv, payload, i: ITERATIONS })}</script>` +
`<script>${decryptor()}</script></body></html>`;
}

function decryptor() {
  return `
(function () {
  var KEY = 'lw-pw';
  var data = JSON.parse(document.getElementById('${MARKER}').textContent);
  var enc = new TextEncoder(), dec = new TextDecoder();
  function unb64(s){ var b=atob(s), a=new Uint8Array(b.length); for(var i=0;i<b.length;i++)a[i]=b.charCodeAt(i); return a; }
  async function open(pw) {
    var base = await crypto.subtle.importKey('raw', enc.encode(pw), 'PBKDF2', false, ['deriveKey']);
    var key = await crypto.subtle.deriveKey(
      { name:'PBKDF2', salt: unb64(data.salt), iterations: data.i, hash:'SHA-256' },
      base, { name:'AES-GCM', length:256 }, false, ['decrypt']);
    var plain = await crypto.subtle.decrypt({ name:'AES-GCM', iv: unb64(data.iv) }, key, unb64(data.payload));
    return dec.decode(plain);
  }
  function render(html) {
    document.open(); document.write(html); document.close();
  }
  function fail(msg) {
    var e = document.querySelector('.lw-gate-err');
    if (e) { e.textContent = msg; e.hidden = false; }
  }
  if (!window.isSecureContext || !(window.crypto && crypto.subtle)) {
    document.addEventListener('DOMContentLoaded', function(){
      fail('This page needs a secure (https) connection to unlock.');
    });
    return;
  }
  var saved = null;
  try { saved = sessionStorage.getItem(KEY); } catch (e) {}
  if (saved) { open(saved).then(render).catch(function(){ try{sessionStorage.removeItem(KEY);}catch(e){} }); }
  document.addEventListener('DOMContentLoaded', function () {
    var form = document.querySelector('#lw-gate form');
    var input = form.querySelector('input');
    var button = form.querySelector('button');
    input.focus();
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      button.disabled = true; button.textContent = 'Unlocking...';
      open(input.value).then(function (html) {
        try { sessionStorage.setItem(KEY, input.value); } catch (e) {}
        render(html);
      }).catch(function () {
        button.disabled = false; button.textContent = 'View case study';
        fail('Incorrect password. Please try again.');
        input.value = ''; input.focus();
      });
    });
  });
})();`;
}

for (const slug of SLUGS) {
  const live = `works/${slug}/index.html`;
  const src = `_source/works/${slug}/index.html`;

  if (cmd === 'lock') {
    let html;
    if (existsSync(src)) html = readFileSync(src, 'utf8');
    else {
      html = readFileSync(live, 'utf8');
      if (isEncrypted(html)) { console.log(`skip   ${slug} (already encrypted, no source)`); continue; }
      html = stripSoftGate(html);
      mkdirSync(dirname(src), { recursive: true });
      writeFileSync(src, html);
      console.log(`saved  ${src}`);
    }
    const title = (html.match(/<title>(.*?)<\/title>/) || [, slug])[1];
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(html));
    writeFileSync(live, shell({ title, salt: b64(salt), iv: b64(iv), payload: b64(ct) }));
    console.log(`locked ${live}  (${html.length} -> ${readFileSync(live).length} bytes)`);
  }

  if (cmd === 'unlock') {
    const html = readFileSync(live, 'utf8');
    const m = html.match(new RegExp(`<script id="${MARKER}" type="application/json">(.*?)</script>`, 's'));
    if (!m) { console.log(`skip   ${slug} (not encrypted)`); continue; }
    const data = JSON.parse(m[1]);
    const key = await deriveKey(password, unb64(data.salt));
    const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: unb64(data.iv) }, key, unb64(data.payload));
    mkdirSync(dirname(src), { recursive: true });
    writeFileSync(src, dec.decode(plain));
    console.log(`unlocked -> ${src}`);
  }
}
