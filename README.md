# laurenwynne.com

Personal portfolio site, built with [Astro](https://astro.build) + [Tailwind CSS](https://tailwindcss.com).

## Quick start

```sh
npm install
npm run dev          # http://localhost:4321
npm run build        # static output in ./dist
npm run preview      # preview the production build
npm run check        # type & content checks
```

## Project layout

```
src/
├── layouts/Layout.astro       shared HTML shell, metadata, skip link, fonts
├── components/                Nav, Footer, WorkCard
├── data/works.ts              case study metadata
├── pages/                     routes
│   ├── index.astro            home
│   ├── about.astro            about
│   ├── work/index.astro       work index
│   ├── work/[slug].astro      individual case study (public)
│   └── 404.astro
└── styles/global.css          Tailwind + theme tokens
```

Theme colors and fonts live as CSS custom properties in `src/styles/global.css`
under `@theme {}`. Change them in one place and the whole site updates.

## Identity / git safety

This repo enforces a **local** git identity so commits never get attached to a
work email. After cloning on a new machine:

```sh
git config --local user.email "19laurenc@gmail.com"
git config --local user.name  "Lauren Wynne"
npm run verify-identity        # fails the build if a blocklisted email is set
```

Verify before any commit:

```sh
git config user.email          # should be your personal email
```

## Hosting

The site is deployed as a static build (`./dist`). Recommended hosts:

- **GitHub Pages** — free, simple, works with a custom domain
- **Netlify** / **Cloudflare Pages** — also free; add real password protection
  for the protected work routes if needed

## Domain

Domain `laurenwynne.com` is registered with **Squarespace Domains**
(formerly Google Domains). DNS is managed via Google Cloud DNS nameservers.
To switch hosts, change the A/CNAME records — no registrar transfer required.
