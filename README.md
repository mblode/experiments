# Matt's Experiments

A playground of interactive UI/UX experiments — animations, 3D scenes, and polished components built with Next.js and React.

**Live demo:** [experiments.blode.co](https://experiments.blode.co)

## Experiments

| Experiment | Description |
|---|---|
| Dynamic island | iPhone-style dynamic island with expandable states and morphing animations |
| Moon | 3D moon with accurate lunar phases and NASA textures |
| Lighting | 3D window scene with mouse-controlled light beams and parallax depth |
| Dither | 3D asteroid shooter with Obra Dinn-style dithering effects |
| Sky | Scroll-driven sky gradient through sunrise, day, sunset, and night |
| Album | Interactive vinyl record player toggling between spinning record and album cover |
| QR code generator | Customisable QR codes with OKLCH colour picker and SVG/PNG export |
| Perfect drag and drop | Sortable list with spring physics drag animations |
| Dnd grid | Resizable drag-and-drop grid layout |
| Bottom sheet | Multi-stage draggable modal with swipe gestures |
| iOS-style cards | iOS-inspired cards with smooth transitions |
| Stacked cards | Three-card stack that expands into a grid on click |
| Expandable date cards | Date cards that expand to reveal additional details |
| Animated subscribe button | Toggle button transitioning between follow and subscribed states |
| Staggered fade | Auto-cycling text with letter-by-letter fade animations |
| Password strength | Password input with animated strength metre and colour-coded feedback |
| Timed undo | Delete button with animated countdown timer and undo functionality |
| Document shadow | Document card with ambient shadow and interactive dice button |
| Article markers | Scroll progress bar with chapter indicators and highlight bookmarks |
| Theme shuffler | Scroll-animated cards with multiple themed colour schemes |
| Status | Popover menu to set user status with animated emoji icons |
| Table | Animated data table with category toggle and staggered cell animations |
| Controls | Design system playground with colour and layout controls |
| FAQ accordion | Expandable FAQ section with smooth accordion animations |
| Tab navigation | Tabbed interface for organising content into sections |
| Toast notifications | Temporary notifications with customisable styles and animations |
| Interactive map | Mapbox-powered map with custom markers and navigation controls |
| Preview block | Preview component that expands to show more content |

## Getting Started

```bash
git clone https://github.com/mblode/matts-experiments.git
cd matts-experiments
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Lint with Biome
npm run format   # Format with Biome
```

## Adding an Experiment

1. Create `app/[name]/page.tsx` and `app/[name]/[name]-block.tsx`
2. Register it in `lib/blocks.ts` with a name and description
3. Set `hidden: true` to keep it off the index while in development

## Tech Stack

- [Next.js 16](https://nextjs.org/) — framework
- [React 19](https://react.dev/) — UI
- [Tailwind CSS 4](https://tailwindcss.com/) — styling
- [Motion](https://motion.dev/) — animations
- [Three.js](https://threejs.org/) + [React Three Fiber](https://r3f.docs.pmnd.rs/) — 3D rendering
- [Radix UI](https://www.radix-ui.com/) — accessible primitives
- [Biome](https://biomejs.dev/) — linting and formatting

## License

[MIT](LICENSE.md)
