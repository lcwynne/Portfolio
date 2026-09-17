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

## Case studies are ENCRYPTED — read this before touching them

**`works/<slug>/index.html` for the four case studies is ciphertext, not HTML.**
Editing those files directly destroys the page. There is no warning; it will
just stop decrypting.

The real content lives in `_source/works/<slug>/index.html`, which is
gitignored and never published. The workflow is:

```bash
node scripts/protect.mjs unlock <password>   # ciphertext -> _source/
# edit _source/works/<slug>/index.html
node scripts/protect.mjs lock <password>     # _source/ -> ciphertext
git add -A && git commit -m "..." && git push
```

If `_source/` is missing (fresh clone), run `unlock` first — the ciphertext
contains the complete original page, so it round-trips. The encrypted page in
the repo IS the backup; `_source/` is only a convenience.

How it works: AES-256-GCM, key derived by PBKDF2-SHA256 at 250,000 iterations
with a random per-page salt. Without the password the page contains nothing
readable — this is real encryption, not the hide-with-CSS gate it replaced.

Two limits worth knowing:
- It needs HTTPS. `crypto.subtle` does not exist in a non-secure context, so the
  page shows "needs a secure connection" over plain HTTP.
- Only the HTML is encrypted. The case-study images under `/assets/` are still
  fetchable by direct URL by anyone who knows the URL. Protecting those needs a
  server, which GitHub Pages is not.

`assets/css/gate.css` styles the password prompt. `assets/js/gate.js` is the old
soft gate — no longer referenced by the case studies, kept only in case a
non-encrypted page ever needs a light gate.

## Known follow-ups

See `ROADMAP.md`.
