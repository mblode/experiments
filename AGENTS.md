# AGENTS.md — experiments

A gallery of standalone UI and animation experiments at <https://blode.co/experiments>.
Next.js 16, React 19, Tailwind 4, Motion, Three.js + React Three Fiber, Radix UI.

## Commands

```bash
npm run dev           # localhost:3000
npm run build         # production build
npm run lint          # oxlint
npm run lint:fix      # oxlint --fix
npm run format        # oxfmt --write .
npm run check-types   # tsc --noEmit
npm run og:generate        # regenerate OG images (scripts/generate-og-images.mts)
npm run previews:generate  # re-record gallery clips (scripts/generate-previews.mts)
```

Both capture scripts drive Playwright over a **running server** — `npm run build
&& npm run start`, then `BASE_URL=http://localhost:3000/experiments`, which needs
the basePath. `ONLY=slug1,slug2` narrows either to a subset while tuning one demo.
`npm run previews:generate` also needs `ffmpeg` on PATH.

There is no test runner. The gates are `lint`, `check-types` and `build`, plus
opening the route you changed during `npm run dev` — most of what breaks here is
visual or motion, which none of those catch.

## Adding an experiment

```
app/[name]/
  page.tsx           route component
  [name]-block.tsx   the experiment itself
```

**Register it in `lib/blocks.ts`** with a name, description, `hidden` flag and
`about`. The gallery index reads that file, so an unregistered experiment exists at
its URL and appears nowhere.

`about` is the two paragraphs `Header` renders under the description: what the demo
is, then what is actually interesting in how it works. Write it from the code, not
from the name. Without it the page is a heading, one line and a demo, which is a
thin page to everything that can't run the demo.

Then **give it a gallery clip**: add a routine to `CHOREOGRAPH` in
`scripts/generate-previews.mts` and run `ONLY=[name] npm run previews:generate`.
Two rules for a routine — show the thing the demo is about, and end in the state
it started in, because the clip loops and a seam between unrelated frames is the
one flaw everybody notices. A demo that animates on its own needs no entry.
Without a clip the card falls back to its poster, so a missing one is quiet: the
index looks fine and that experiment is the only still frame on the page.

## Conventions

- **Don't "fix" style the linter deliberately ignores.** `oxlint.config.ts` turns
  off a long list of mechanical preferences (`func-style`, `prefer-const`,
  `sort-keys`, `no-nested-ternary`, `prefer-template`, and more) because this repo
  is full of shader math, canvas ports and generated primitives where they fight
  the code. Correctness and accessibility rules stay on. If `npm run lint` passes,
  the style is correct for this repo.
- **Motion**: follow `ANIMATION.md`. 0.2–0.3s by default and never over 1s,
  `ease-out` for entrances, `ease-in-out` for movement within the screen, animate
  `opacity` and `transform` only, and honour `prefers-reduced-motion`.
- **One source of truth for state.** `useState` for local UI state; never mirror
  one piece of state into another with `useEffect`. The lint rules do not catch
  this and it is the most common bug in these routes.
- Files are kebab-case, components PascalCase, imports ordered React/Next →
  third-party → `@/` → relative.

## Commits

Short, present-tense, no conventional-commit prefix — matching the existing history
("Fix", "Update", "opengraph"). Call out changes to `lib/blocks.ts` and new assets
under `public/`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
