# laurenwynne.com

The source for [laurenwynne.com](https://laurenwynne.com). Plain static HTML/CSS/JS —
no build step, no framework, no dependencies. What is in this repo is exactly what
gets served.

Migrated off Webflow on 2026-09-15 as a byte-faithful mirror of the live Webflow site.

## Structure

```
index.html                      password gate (chat)
home/index.html                 /home   (homepage after the gate)
works/index.html                /works  "Online": how I work, case study listing, background
works/<slug>/index.html         individual case studies
offline/index.html              /offline  personal projects (in progress)
about-me/index.html             redirect to /works/#how-i-work (About was split into Online and Offline)
coming-soon/index.html          /coming-soon
404.html                        custom 404 (GitHub Pages serves this automatically)
template-info/                  pages inherited from the original Webflow template
assets/                         all css, js, images, fonts, and the resume PDF
CNAME                           custom domain for GitHub Pages
.nojekyll                       tells GitHub Pages not to run Jekyll
```

## Deploying

GitHub Pages serves the `main` branch root. Push to `main` and the live site
updates within a minute or two. There is nothing to build.

```bash
git add -A && git commit -m "your message" && git push
```

## Working locally

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Branches

- `main` — the live site.
- `astro-rebuild` — an in-progress Astro rebuild from an earlier session, parked
  here so nothing is lost. Not deployed.

## Encrypted case studies

The four case studies under `works/` are encrypted at rest with AES-256-GCM
(PBKDF2-SHA256, 250k iterations). The published file contains only ciphertext
and a decryptor — without the password there is nothing to read, even in the
page source.

Editing them goes through `scripts/protect.mjs`; see CLAUDE.md. **Do not edit
`works/<slug>/index.html` directly** — those files are ciphertext.

## Backup

A full archive of the original Webflow site lives in Google Drive under
"laurenwynne.com — Webflow backup (2026-09-15)".
