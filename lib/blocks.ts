export const blocks: Record<
  string,
  { name: string; description: string; hidden?: boolean }
> = {
  "animated-button": {
    name: "Animated subscribe button",
    description:
      "Toggle button that smoothly transitions between follow and subscribed states",
  },
  "shuffle-theme": {
    name: "Theme shuffler",
    description:
      "Scroll-animated cards with multiple themed colour schemes and backgrounds",
  },
  faq: {
    name: "FAQ accordion",
    description: "Expandable FAQ section with smooth accordion animations",
  },
  sheet: {
    name: "Bottom sheet",
    description: "Multi-stage draggable modal with swipe gestures",
  },
  tabs: {
    name: "Tab navigation",
    description: "Tabbed interface for organising content into sections",
  },
  toast: {
    name: "Toast notifications",
    description:
      "Temporary notification pop-ups with customisable styles and animations",
  },
  "ios-cards": {
    name: "iOS-style cards",
    description: "iOS-inspired cards with smooth transitions",
  },
  "dynamic-island": {
    name: "Dynamic island",
    description:
      "iPhone-style dynamic island with expandable states and morphing animations",
  },
  map: {
    name: "Interactive map",
    description:
      "Mapbox-powered map with custom markers and navigation controls",
  },
  "card-stack": {
    name: "Stacked cards",
    description: "Three-card stack that expands into a grid layout on click",
  },
  expand: {
    name: "Expandable date cards",
    description: "Date cards that expand to reveal additional details on click",
  },
  preview: {
    name: "Preview block",
    description: "Preview component that expands to show more content",
  },
  sky: {
    name: "Sky",
    description:
      "Scroll-driven sky gradient transitioning through sunrise, day, sunset, and night with animated stars",
  },
  album: {
    name: "Album",
    description:
      "Interactive vinyl record player that toggles between spinning record and album cover",
  },
  moon: {
    name: "Moon",
    description: "3D moon with accurate lunar phases and NASA textures",
  },
  "staggered-fade": {
    name: "Staggered fade",
    description: "Auto-cycling text with letter-by-letter fade animations",
  },
  status: {
    name: "Status",
    description: "Popover menu to set user status with animated emoji icons",
  },
  table: {
    name: "Table",
    description:
      "Animated data table with category toggle and staggered cell animations",
  },
  lighting: {
    name: "Lighting",
    description:
      "3D window scene with mouse-controlled light beams, parallax depth, and organic noise animations",
  },
  "password-strength": {
    name: "Password strength",
    description:
      "Password input with animated 3-bar strength metre and colour-coded feedback",
  },
  controls: {
    name: "Controls",
    description: "Design system playground with colour and layout controls",
  },
  dither: {
    name: "Dither",
    description:
      "3D asteroid shooter game with Obra Dinn-style dithering effects",
  },
  "timed-undo": {
    name: "Timed undo",
    description:
      "Delete account button with animated countdown timer and undo functionality",
  },
  // "svg-animations": {
  //   name: "SVG animations",
  //   description: "Morphing SVG shapes with spring animations and color transitions",
  // },
  "document-shadow": {
    name: "Document shadow",
    description:
      "Document card with ambient shadow overlay and interactive dice button",
  },
  "qr-code": {
    name: "QR code generator",
    description:
      "Customisable QR code generator with OKLCH colour picker and downloadable SVG/PNG output",
  },
  dnd: {
    name: "Drag and drop",
    description: "Sortable list with spring physics drag animations",
  },
  "sticky-notes": {
    name: "Sticky notes",
    description: "Sticky notes with animated page turning",
    hidden: true,
  },
  markers: {
    name: "Article markers",
    description:
      "Scroll progress bar with chapter indicators and highlight bookmarks",
  },
  "magnetic-grid": {
    name: "Magnetic grid",
    description:
      "Interactive card grid with cursor-driven magnetic attraction, spring physics, and 3D perspective effects",
  },
};
