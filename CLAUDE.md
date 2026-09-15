# Working on this site with Claude Code

## What this is

`laurenwynne.com` — Lauren Wynne's design portfolio. Static HTML/CSS/JS, served
straight from the `main` branch by GitHub Pages. No build step, no package.json,
no framework.

The HTML originated as a mirror of a Webflow site, so it carries Webflow's
markup conventions: utility classes prefixed `w-` (`w-container`,
`w-layout-blockcontainer`, `w-richtext`), `data-wf-*` attributes on `<html>`,
and one large generated stylesheet at
`assets/css/design-portfolio-2f8d13.webflow.d9c70b216.css`.

## Rules of the road

1. **Never edit the generated Webflow CSS file directly.** It is minified,
   machine-generated, and impossible to review in a diff. Put new styles in
   `assets/css/site.css` (create it if absent) and link it after the Webflow
   stylesheet so it wins on specificity ties.
2. **Asset paths are root-relative** (`/assets/...`). Keep them that way — pages
   live at several directory depths and relative paths break.
3. **Every page is its own `index.html` in a folder**, which is what gives clean
   URLs (`/about-me` not `/about-me.html`). New page → new folder → `index.html`.
4. **The nav and footer are duplicated in every page.** There is no templating.
   When changing nav, change it in every `*.html`, and say so explicitly rather
   than silently editing one.
5. **Don't add a build step without being asked.** The no-build setup is
   deliberate: it means the repo contents and the live site are the same thing.
6. `.nojekyll` and `CNAME` at the root are load-bearing for GitHub Pages. Leave
   them alone.

## Deploying

Push to `main`. GitHub Pages picks it up in a minute or two. Verify at
https://laurenwynne.com — hard-refresh, since the Webflow-era assets are
fingerprinted and cache hard.

## Local preview

```bash
python3 -m http.server 8000
```

## Case study gate

`assets/js/gate.js` hides the four case studies behind a password prompt,
comparing a SHA-256 hash. If the password changes, update the hash in that file —
the plaintext is never stored. This is a soft gate; anyone reading the page
source can see the content. If real protection is ever needed, the site has to
move to a host with server-side auth (Cloudflare Pages + Access, Netlify,
Vercel).

## Known follow-ups

See `ROADMAP.md`.
