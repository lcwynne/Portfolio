# laurenwynne.com

The source for [laurenwynne.com](https://laurenwynne.com). Plain static HTML/CSS/JS —
no build step, no framework, no dependencies. What is in this repo is exactly what
gets served.

Migrated off Webflow on 2026-09-15 as a byte-faithful mirror of the live Webflow site.

## Structure

```
index.html                      home
about-me/index.html             /about-me
works/index.html                /works  (case study listing)
works/<slug>/index.html         individual case studies (password-gated)
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

## Password-gated case studies

The four case studies under `works/` carry a client-side password gate
(`assets/js/gate.js`) that reproduces the behavior they had on Webflow. It is a
soft gate: the page markup is still in the HTML source, so it deters casual
browsing but is not real access control.

## Backup

A full archive of the original Webflow site lives in Google Drive under
"laurenwynne.com — Webflow backup (2026-09-15)".
