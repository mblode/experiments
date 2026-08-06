export const blocks: Record<
  string,
  {
    name: string;
    description: string;
    hidden?: boolean;
    /**
     * Two paragraphs rendered under the description by `Header`: what the demo
     * is, then what is actually interesting in it. A demo page whose only prose
     * is a one-line description reads as an empty page to anything that can't
     * run the demo, which is every crawler and a fair few readers.
     */
    about?: [string, string];
    /**
     * How the demo should present itself at `?preview`, the mode the gallery's
     * capture script records. Only demos that need something other than the
     * default need an entry.
     *
     * `width` clamps the column. A demo whose content fills the whole
     * `max-w-4xl` has nothing for the recorder to scale into, and its clip
     * comes out looking like a distant screenshot; a narrower measure is also
     * closer to how it reads on a phone.
     *
     * `zoom` is for demos the recorder's own scaling cannot help: anything
     * pinned to the viewport or portalled out of the column, where scaling the
     * column would leave the pinned part at life size. Zoom changes the
     * effective viewport instead, so the whole page comes with it. Above 1 it
     * pulls a small demo closer; below 1 it pulls back from one laid out wider
     * than the square frame.
     */
    preview?: { width?: number; zoom?: number };
    /**
     * An outbound credit or source link, rendered by `Header` between the
     * prose and the prev/next nav. It lived in each page below the header,
     * which put it under the pagination and made it read as a footnote to the
     * navigation rather than to the demo.
     */
    credit?: { href: string; text: string };
  }
> = {
  "animated-button": {
    name: "Animated subscribe button",
    description: "Follow button that swaps to a subscribed state",
    about: [
      "A follow button that swaps to subscribed. Follow slides out to the right, Subscribed drops in from above with a tick. Only the label changes, so keyboard focus survives the toggle.",
      "It takes exactly two spans as children, one per state, and throws if you hand it anything else. The button never has to know what the labels say, and the two states sit side by side in the source.",
    ],
  },
  "shuffle-theme": {
    name: "Theme shuffler",
    description: "Six cards that fade in and restyle to a random theme",
  },
  faq: {
    preview: { width: 620 },
    name: "FAQ accordion",
    description: "Single-open FAQ accordion with a top-down text reveal",
    about: [
      "Three questions on a Radix accordion, single open and collapsible: opening one closes the others, and you can close all three. The plus icon is two bars, so it rotates into a minus.",
      "CSS cannot transition to a height of auto, so Motion animates the height with a linear-gradient mask alongside it. Text is revealed top down instead of sliding up behind a clipped edge, so the last line never drops into place.",
    ],
  },
  sheet: {
    preview: { zoom: 1.45 },
    name: "Bottom sheet",
    description: "Bottom sheet that resizes as you move between stages",
    about: [
      "A wallet sheet built on Vaul. It opens on a short options menu, and from there the recovery phrase, private key or remove step each grow or shrink the sheet to fit. Drag down to dismiss.",
      "Each stage hard-codes its height, 290px for the menu and 465 for the recovery phrase. Animating to a height measured after render jumps on the first frame: the sheet has to be wrong once before it can know what is right.",
    ],
  },
  tabs: {
    preview: { width: 620 },
    name: "Tab navigation",
    description: "Pill tabs with a highlight that slides between them",
    about: [
      "Four pill tabs with a blue highlight that slides between them. Two copies of the row are stacked: the real one, and an inverted copy cropped down to the active tab by a clip-path inset.",
      "Animating that inset moves the highlight, and the boundary can pass through the middle of a letter: light type inside the pill, dark type outside, on the same word. A sliding background cannot do that. The cost is a duplicate row kept inert.",
    ],
  },
  toast: {
    name: "Toast notifications",
    description: "One pill that morphs between loading, success and error",
    about: [
      "A pill that moves between loading, success and error, driven by the three buttons underneath. The container is layout-animated, so it resizes to the new content while that content scales in from 0.9.",
      "The bounce comes from the distance: 0.5 when the height moves under 20px, otherwise between 0.3 and 0.35, with a shrink scaled the opposite way to a grow. A ghost copy of the outgoing pill flies off on a path picked per state pair, so every pairing exits its own way.",
    ],
  },
  "ios-cards": {
    preview: { zoom: 1.35 },
    name: "iOS-style cards",
    description: "Photo cards that expand into a modal on click",
  },
  "dynamic-island": {
    name: "Dynamic island",
    description: "Black pill that morphs between four iPhone-style states",
    about: [
      "A rebuild of the iPhone Dynamic Island. Buttons underneath switch it between idle, ring mode, a timer, and a now-playing view with a waveform, and the black pill morphs between the sizes on a spring.",
      "The nine waveform bars are drawn at full height and squashed with scaleY rather than resized, on randomly generated keyframes over a 1.1s loop. Animating height instead would relayout nine elements sixty times a second, forever.",
    ],
  },
  "card-stack": {
    name: "Stacked cards",
    description: "Three-card pile that spreads into a row on click",
    about: [
      "Three cards sit in a pile, two tilted six degrees behind a third sitting flat. Click anywhere on the stack and they straighten, scale up and slide out into a row; click again and they fold back.",
      "Each card keeps its z-index through the whole 0.6s transition, so the flat card that started on top is still on top after travelling the furthest, which is what stops the spread reading as a reshuffle.",
    ],
  },
  expand: {
    name: "Expandable date cards",
    description: "Date cards that expand one at a time to show details",
  },
  preview: {
    preview: { width: 600 },
    name: "Preview block",
    description: "List rows that expand into a large image preview",
    about: [
      "Five rows, each a thumbnail beside a title. Click one and it grows to 400px tall, the thumbnail becomes a 280px square, and the title moves above it. Only one opens at a time.",
      "The image and the heading are not moved: they swap flex order, and Motion's layout animation interpolates the positions that fall out of that. Height, type, margins and radius ride one 0.42s curve so they land together.",
    ],
  },
  sky: {
    credit: { href: "https://blode.co", text: "See a real-world example" },
    name: "Sky",
    description: "Scroll from sunrise to night through a fixed sky",
    about: [
      "Four full-height sections labelled Sunrise, Day, Sunset and Night sit over one fixed sky. Scroll drives the gradient, the clouds and the star field, and the labels flip from ink to paper near the end.",
      "The gradients interpolate between four hand-picked stops rather than compute from a time of day, which is the only way to make the muddy pink of dusk look like dusk. Nothing runs on a timer, so scrolling up runs the day backwards.",
    ],
  },
  album: {
    name: "Album",
    description: "Vinyl record that opens out into the album cover",
    about: [
      "It starts as a record: the artwork cropped to a circle, nudged up so the track and artist show underneath, turning slowly. Click and the circle opens out into a square that fills the frame as a cover.",
      "The artwork is never swapped. The same image is both sleeve and vinyl, and the illusion holds because the crop and the radius move together: by the time it reads as a circle, only the middle is left, which is about what a label looks like.",
    ],
  },
  moon: {
    hidden: true,
    name: "Moon",
    description: "Tonight's moon in 3D, with real phases and NASA maps",
    about: [
      "Tonight's moon on NASA Lunar Reconnaissance Orbiter colour, normal, roughness and displacement maps. The phase and illuminated fraction come from astronomy-engine. Scrub the time 30 days either way.",
      "The sphere never rotates. Its orientation is set once and only the light direction moves, which is how phases actually happen, so the terminator falls across real craters instead of across a texture spun to fit the shape you wanted.",
    ],
  },
  "staggered-fade": {
    name: "Staggered fade",
    description: "Text that cycles, fading in letter by letter",
    about: [
      "A pill cycling four phrases, one every two seconds. Each letter fades in from a blur on a 15ms stagger while the pill's width springs to the measured width of the incoming phrase.",
      "The exit is faster and blurrier than the entrance, 500 stiffness against 350, so the outgoing word clears before the incoming one is legible. Run both at the same speed and the middle of the transition is an unreadable overlap.",
    ],
  },
  status: {
    preview: { zoom: 2.2 },
    name: "Status",
    description: "Emoji status picker that rewrites its own label",
    about: [
      "A Set status button that opens five emoji in a popover. Pick one and the button takes the emoji and rewrites its label letter by letter to On vacation. A small x clears it again.",
      "The label arrives one character at a time, so the outer width springs to a measured inner width instead of snapping there on the first frame. Options grow on hover by animating padding rather than scale: scaling an emoji makes it soft.",
    ],
  },
  table: {
    preview: { width: 760 },
    name: "Table",
    description: "Tabbed data table with cells that roll in as a wave",
  },
  lighting: {
    preview: { zoom: 0.72 },
    name: "Lighting",
    description: "Light through a window, built from CSS layers",
    about: [
      "A dark room lit through a window. Move the pointer and the perspective, the layer parallax and the frame's shadow shift with it. It is CSS the whole way down, apart from the sky outside.",
      "A still scene with the pointer parked reads as a screenshot, so a noise function nudges the layers every 800ms, summing sine waves at unrelated frequencies so the drift never repeats. Reduced motion skips it entirely.",
    ],
  },
  "password-strength": {
    preview: { width: 560 },
    name: "Password strength",
    description: "Password field with a three-bar strength metre",
    about: [
      "A password field with three bars under it and a show/hide toggle. Type and the bars light up one at a time, red to orange to green, with the label beside them changing to match.",
      "Scoring is naive on purpose: length only, one bar to four characters, two to nine, three beyond. Anything you would ship needs a real estimator, run on a value that never leaves the page. The demo is the feedback, not the scoring.",
    ],
  },
  controls: {
    preview: { zoom: 0.78 },
    name: "Controls",
    description: "Retheme a page live: hue, saturation, radius, gap",
  },
  dither: {
    hidden: true,
    name: "Dither",
    description: "Asteroid shooter rendered in exactly two colours",
    about: [
      "A first-person asteroid shooter in two colours. Fly through generated rocks, steer with the mouse or a drag on touch, and click to shoot. Spawns tighten from 1.2s to 0.3s as you score.",
      "Screen-space dithering crawls across surfaces as the camera moves. Instead, the Obra Dinn trick: each pixel's view direction is sampled against a blue noise sphere centred on the camera, so it sits still on the geometry. A hard step() against luminance leaves one bit per pixel, no greys.",
    ],
  },
  "timed-undo": {
    name: "Timed undo",
    description: "Delete button that becomes its own ten-second undo",
    about: [
      "A delete account button that gives you ten seconds to change your mind. Press it and the button goes pale, the label rewrites to Cancel Deletion letter by letter, and a countdown starts.",
      "I prefer this to a modal: the undo lands where your cursor already is, and a confirm dialog asks you to predict regret while an undo lets you notice it. The border radius is set inline because a layout animation skews a radius it is interpolating.",
    ],
  },
  // "svg-animations": {
  //   name: "SVG animations",
  //   description: "Morphing SVG shapes with spring animations and color transitions",
  // },
  "document-shadow": {
    name: "Document shadow",
    description: "Roll the dice to cast one of 99 shadows over the page",
  },
  "qr-code": {
    credit: {
      href: "https://github.com/mblode/beautiful-qr-code",
      text: "Beautiful QR Code on GitHub",
    },
    name: "QR code generator",
    description: "QR code generator with an OKLCH colour grid, SVG or PNG",
    about: [
      "Type a URL, pick a colour from a grid of sixteen hues and four greys, and download the code as SVG or PNG. It is built on beautiful-qr-code, a package of mine.",
      "The palette is OKLCH, not HSL, which for a QR code is not a preference. In HSL a fixed lightness is a lie: yellow at 65% reads far brighter than blue at 65%, so a hue sweep gives swatches that scan and swatches that do not. OKLCH holds contrast right around the hue circle.",
    ],
  },
  "sticky-notes": {
    name: "Sticky notes",
    description: "Sticky notes with animated page turning",
    hidden: true,
  },
  markers: {
    preview: { zoom: 1.35 },
    name: "Article markers",
    description: "Vertical scroll progress with clickable chapter markers",
  },
  "perfect-dnd": {
    credit: {
      href: "https://github.com/mblode/perfect-dnd",
      text: "Perfect DnD on GitHub",
    },
    preview: { zoom: 1.3 },
    name: "Perfect drag and drop",
    description: "Sortable list where the card swings with drag velocity",
  },
  "dnd-grid": {
    name: "Dnd grid",
    description: "Resizable drag-and-drop grid built on dnd-grid",
    about: [
      "Eight tiles on a recessed four-column board. Drag one to move it and the rest push out of the way, then compact upward; drag a corner to resize. A demo of dnd-grid, a library of mine.",
      "The real problem is a feedback loop: the grid measures its container with a ResizeObserver, but resizing a tile changes the container, fires the observer, and re-lays out mid-gesture. The fix is to park incoming widths while a resize is in flight, then apply the last one.",
    ],
  },
  "multi-stroke-text": {
    name: "Multi-stroke text",
    description:
      "Stacked SVG copies of the Linktree mark with progressively wider strokes build a retro onion-ring outline effect",
    hidden: true,
  },
  "omni-color-picker": {
    credit: {
      href: "https://x.com/mackenziechild",
      text: "Original concept by Mackenzie Child",
    },
    preview: { zoom: 1.15 },
    name: "Omni-directional colour picker",
    description: "Drag a fish-eye sphere of dots to recolour the page",
  },
};
