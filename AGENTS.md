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
npm run og:generate   # regenerate OG images (scripts/generate-og-images.mts)
```

There is no test runner. The gates are `lint`, `check-types` and `build`, plus
opening the route you changed during `npm run dev` — most of what breaks here is
visual or motion, which none of those catch.

## Adding an experiment

```
app/[name]/
  page.tsx           route component
  [name]-block.tsx   the experiment itself
```

**Register it in `lib/blocks.ts`** — name, description, and the `hidden` flag. The
gallery index reads that file, so an unregistered experiment exists at its URL and
appears nowhere.

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
