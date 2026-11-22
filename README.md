# Tendril

Marketing site (`/`) and demo trading terminal (`/terminal`) for Tendril, built from the PROP Figma design system.

- **Next.js 16** (App Router, Cache Components) + **Tailwind CSS 4**
- **shadcn/ui-style components** in `src/components/ui`, built on **Base UI**
- Fonts: **Instrument Sans** (UI + display) and **Geist Mono** (data + labels), self-hosted
- **Dark and Light** themes from the Figma "Hyperprop" variables (`src/app/globals.css`), with a shadcn token layer on top
- The terminal runs on **simulated prices** (`src/lib/market.ts`, `src/components/terminal/sim.ts`); nothing connects to a real market or wallet

## Develop

```bash
npm install
npm run dev
```

## Deploy

Import this repo in Vercel (framework preset: Next.js, no settings needed). Every push to `main` deploys.

## UI skills

`.claude/skills/` holds the [jakubkrehel/skills](https://github.com/jakubkrehel/skills) UI polish skills used for this build (motion, typography, layout, accessibility rules).
