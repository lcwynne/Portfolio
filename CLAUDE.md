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

## Site sections

The nav has two items: **Case studies** (`/works`: a "How I work" intro,
the case studies, and background) and **Offline** (`/offline`: personal
projects, still in progress). The homepage (`/home/`) is deliberately minimal:
name, title, one personal note, and links to those two plus the resume. There is no About page any more. Its content was split between
the two, and `/about-me` just redirects to `/works/#how-i-work`.

## Site-wide password gate

The root `index.html` is a chat-style password gate (`assets/js/gate.js`,
styled by `assets/css/gate.css`). On success it sets
`sessionStorage.lw_unlocked = '1'` and sends the visitor to `/home/`.

Every other page — including the four case studies in `works/<slug>/` — starts
its `<head>` with a one-line check that redirects to `/` if that flag is
missing. **New pages need that same line.**

This is a client-side gate only. The repo is public and the case-study HTML is
plain text, so anyone reading the repo or disabling JS can see the content.
The case studies used to be individually AES-encrypted (`scripts/protect.mjs`);
that was removed so visitors only enter one password. `protect.mjs` is unused.

Pages that load `gate.css` or the works-page scripts reference them with a
`?v=N` query string. Bump it when you change those files, or browsers keep
serving the old copy.

## Side chat panel

After the gate, every page carries the same conversation in a side panel
(`assets/js/site-chat.js`, styled by `assets/css/chat.css`). `gate.js` saves
each message to `sessionStorage.lw_chat`, and the panel replays it, so the
password exchange continues on whatever page the visitor lands on.
`lw_chat_open` remembers whether the panel is open. Visitors close it with the
X and reopen it with the tab on the right edge, or with a project tile's chat
icon (`.lw-ask-btn` on `/works`). There is deliberately no way to start a new
chat; asking for one gets an "out of scope for now" reply.

The AI isn't connected (`WORKER_URL` in `site-chat.js` is empty), so typed
questions get pointed to the relevant page. **New pages need both
`chat.css` and `site-chat.js`**, alongside the session-check line.

## Known follow-ups

See `ROADMAP.md`.
