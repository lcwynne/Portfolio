# Roadmap

Phase 1 (migration) is done: the site is off Webflow and served from this repo.
Everything below is Phase 2 — turning a faithful copy of the old site into the
portfolio the new positioning actually needs.

Ordered by leverage, not by effort.

---

## 1. Fix what the site currently says about you

The mirror is faithful, which means it is also four years out of date. Before any
new feature work, the content has to stop contradicting the pitch.

- [ ] **Replace the resume PDF.** `assets/6644cdd069cc5affac073621_LaurenWynne.pdf`
      is the Alteryx-era resume and does not mention Klaviyo. This is linked from
      the home page and the About page — it is the single most-downloaded thing
      on the site and currently the most wrong.
- [ ] **Rewrite the home-page line.** "a product designer in greater Boston" is
      generic. The positioning work already done says AI/agentic product design —
      the home page should say that in one sentence.
- [ ] **Update the About page.** "Working my way from designing websites and
      applications in Microsoft Paint to being the lead designer piecing together
      a multi-product suite" tells the pre-Klaviyo story. There is a newer About
      draft in the Design Portfolio Claude project.
- [ ] **Decide what happens to the four legacy case studies.** Your own market
      plan says keep one, retire the rest. Retiring them is a content decision,
      not a technical one — but until it happens, the /works page reads as a
      generalist portfolio.

## 2. Add the case studies the positioning depends on

Three flagship pieces were scoped in the Design Portfolio project and exist as
outlines, not pages:

- [ ] Agentic editing
- [ ] Composer vision
- [ ] AI legibility
- [ ] Prototyping hub (this one is already drafted in full)

Each is a new folder under `works/` with an `index.html`. The existing case
studies are the template — copy one, replace the content.

**Worth doing first:** the four existing case studies are hand-maintained HTML
with the nav and footer duplicated in each. Adding four more makes eight copies
of the same nav. Consider a small build step (or a tiny include script) *before*
writing the new ones, not after.

## 3. Reconsider the password gate

Right now the case studies sit behind a client-side gate that reproduces the
Webflow behavior. It is a soft gate — the content is in the page source.

Two honest options:
- **Drop it.** Most design portfolios are open. A gate is friction between a
  recruiter and the work, and the work is the point.
- **Make it real.** Move hosting to Cloudflare Pages or Netlify, which can do
  server-side auth. This is also the prerequisite for item 4.

## 4. An AI agent on the site

The thing worth being honest about up front: **a static site on GitHub Pages
cannot host an AI agent.** There is no server, so there is nowhere to keep an API
key, and a key shipped to the browser is a key anyone can take and spend.

So this feature forces a hosting decision. The realistic path:

1. Move hosting to **Cloudflare Pages** or **Vercel** (both free at this scale,
   both deploy from this same repo on push, both keep the domain and the URLs).
2. Add one serverless function that holds the API key and proxies to the model.
3. Add the chat UI to the site. It stays static; only the one endpoint is dynamic.

What the agent should actually *do* is the harder question. A generic chat widget
on a portfolio is a gimmick. Options that are not:

- **"Ask about my work"** — grounded on your case studies, so a hiring manager
  can ask "has she shipped anything with evaluation in the loop?" and get a real
  answer with a link to the relevant case study. This doubles as a demonstration
  of retrieval + grounding design, which is the skill you are claiming.
- **"Tailor this portfolio to a job description"** — paste a JD, get back which
  case studies are most relevant and why. Legible, useful, and directly on-theme.
- **A visible reasoning surface** — whatever the agent does, showing *how* it
  decided is the part that demonstrates AI legibility, which is one of the three
  flagship case studies. The agent becomes the case study's own proof.

Pick one. Shipping one well beats three half-built.

## 5. Smaller things

- [ ] Add a real 404 that links back into the site (the current one is the
      template's).
- [ ] Remove `template-info/` — changelog, licensing, and style-guide pages
      inherited from the Arten Webflow template. They are live on the site today
      and serve no purpose.
- [ ] Add an og:image of your own. The current one is the template author's
      default image, still hosted on their Webflow CDN.
- [ ] Add analytics if you want to know whether any of this is working.
- [ ] Compress the case-study screenshots. Several are full-resolution PNGs over
      1 MB; the site would load noticeably faster as WebP.
