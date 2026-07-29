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
  }
> = {
  "animated-button": {
    name: "Animated subscribe button",
    description:
      "Toggle button that smoothly transitions between follow and subscribed states",
    about: [
      "A follow button that swaps to a subscribed state. Click it and the Follow label slides out to the right as the button fades, then the Subscribed label drops in from above with a tick. Click again and it goes back. The chevron nudging right on hover is a separate CSS transition, not part of the state change.",
      "The component takes exactly two spans as children, one per state, and throws if you hand it anything else. That constraint is the interesting bit: the button never has to know what your labels say, and the two states sit next to each other in the source where you can compare them. It works controlled or uncontrolled, so the same button can be wired to a real subscription or, as here, left to toggle itself.",
    ],
  },
  "shuffle-theme": {
    name: "Theme shuffler",
    description:
      "Scroll-animated cards with multiple themed colour schemes and backgrounds",
  },
  faq: {
    name: "FAQ accordion",
    description: "Expandable FAQ section with smooth accordion animations",
    about: [
      "Three questions on a Radix accordion in single-open collapsible mode: opening one closes the others, and you can close all of them. The plus icon on the right is two bars rather than a glyph, so it can rotate and collapse into a minus instead of cross-fading between two icons.",
      "The content animation is the part worth copying. CSS cannot transition to a height of auto, so Motion animates the height for you, and a linear-gradient mask animates alongside it. That means the text is revealed from the top down rather than sliding up from behind a clipped edge, which is what makes long answers open without the last line appearing to fall into place. Radix owns the open state and a MutationObserver on the trigger's data-state mirrors it back into React, so the animation and the accessibility semantics stay in agreement.",
    ],
  },
  sheet: {
    name: "Bottom sheet",
    description: "Multi-stage draggable modal with swipe gestures",
    about: [
      "A bottom sheet built on Vaul that resizes as you move through it. Open it and you get a short wallet menu; from there you can go to the secret recovery phrase, the private key, or a destructive remove step, and the sheet grows or shrinks to fit each one rather than snapping to a fixed height. Drag it down from any stage to dismiss.",
      "Each stage has a height hard-coded against it, with a measured height as the fallback. That looks like a shortcut and is not: animating to a height you measure after the content has rendered gives you a visible jump on the first frame, because the sheet has to be the wrong size once before it can know the right size. The remove stage also exits faster than the others, on a 0.15s curve, since a confirmation that lingers makes the app feel like it is hesitating over something you already decided.",
    ],
  },
  tabs: {
    name: "Tab navigation",
    description: "Tabbed interface for organising content into sections",
    about: [
      "A row of pill tabs with a blue highlight that slides between them. There are actually two copies of the tab row stacked on top of each other: the normal one, and an aria-hidden copy with a blue background and inverted text. A clip-path inset crops the top copy down to just the active tab, and animating that inset is what makes the highlight travel.",
      "Doing it this way means the label inside the pill is genuinely light and the labels outside it are genuinely dark, with the boundary passing through the middle of a letter as the pill slides over it. A single sliding background behind the labels cannot do that. The cost is the duplicated markup, which is why the second copy is aria-hidden with tabIndex -1: screen readers and keyboard focus only ever meet the real row.",
    ],
  },
  toast: {
    name: "Toast notifications",
    description:
      "Temporary notification pop-ups with customisable styles and animations",
    about: [
      "A pill that moves between loading, success and error. Press the buttons underneath to drive it. The container is layout-animated, so it stretches or contracts to whatever the new content needs while the content itself scales in from 0.9.",
      "The detail I like is that the spring is not constant. Before each swap the new content is measured, and the bounce is derived from how far the height has to travel: small changes get a springier 0.5, large ones get damped down towards 0.3, and a shrink is treated differently from a grow. A fixed spring that feels right for the short pill overshoots badly on the tall one. There is also a second, ghost copy of the outgoing content that flies off on a per-transition path, so going loading to error looks different from going loading to success.",
    ],
  },
  "ios-cards": {
    name: "iOS-style cards",
    description: "iOS-inspired cards with smooth transitions",
  },
  "dynamic-island": {
    name: "Dynamic island",
    description:
      "iPhone-style dynamic island with expandable states and morphing animations",
    about: [
      "A rebuild of the iPhone Dynamic Island. The black pill starts idle and expands into a timer, a now-playing view with a waveform, or ring mode, then collapses back. Every transition is a spring, and the pill morphs between sizes rather than swapping one box out for another.",
      "The waveform is the part worth watching. Each bar animates its height through a set of randomly generated keyframes on a repeating 1.1s loop, so the pattern never quite repeats the way a canned animation does, and pausing collapses every bar to a 1px line on a short tween. The timer digits are keyed by slot and value, so only the digit that actually changed blurs and slides. Underneath all of it, the hard problem is that the content has to cross-fade while the container is still resizing beneath it, which is why the views are absolutely sized rather than laid out by their contents.",
    ],
  },
  "card-stack": {
    name: "Stacked cards",
    description: "Three-card stack that expands into a grid layout on click",
    about: [
      "Three cards sit in a shuffled pile, each rotated a few degrees and scaled down slightly. Click anywhere on the stack and they straighten, scale up and slide out into a row; click again and they fold back. It is one button wrapping three absolutely positioned divs, animated on a 0.6s tween with a sharp ease-out curve.",
      "The fiddly part is centring. The stacked cards have to sit in the middle of a container whose width is not known until it renders, so the offset is measured from the DOM and recalculated on resize rather than expressed in CSS. Worth watching the stacking order: each card keeps its z-index through the whole transition, so the red card stays on top even after it has travelled the furthest, which is what stops the spread reading as a reshuffle.",
    ],
  },
  expand: {
    name: "Expandable date cards",
    description: "Date cards that expand to reveal additional details on click",
  },
  preview: {
    name: "Preview block",
    description: "Preview component that expands to show more content",
    about: [
      "Five cards in a list. Each is a short row with a thumbnail on the left and a title on the right; click one and it grows to 400px tall, the thumbnail becomes a large square, and the title moves above it and gets bigger. Only one can be open at a time, so opening a second closes the first and the whole list reflows around it.",
      "The image and the heading do not move: they swap flex order, and Motion's layout animation interpolates the positions that fall out of that. Height, font size, margins and border radius are animated explicitly on one shared easing curve so they arrive together, because a card whose height and type land at different moments reads as two animations. The backface-visibility and translate3d lines are there for Safari, which otherwise shimmers the image while it scales.",
    ],
  },
  sky: {
    name: "Sky",
    description:
      "Scroll-driven sky gradient transitioning through sunrise, day, sunset, and night with animated stars",
    about: [
      "Four full-height sections labelled Sunrise, Day, Sunset and Night, sitting over a fixed background. Scroll progress across the whole page is mapped onto three things at once: the sky gradient, a cloud layer, and a star field that fades in and drifts upward. Nothing runs on a timer, so scrolling back up runs the day in reverse at whatever speed you choose.",
      "The gradients are interpolated between four hand-picked stops rather than computed from a time of day, which is the only way to get the muddy pink of dusk to look like dusk. The clouds are a single PNG used as a CSS mask over a second gradient, so they recolour with the sky instead of needing four cloud images. Shooting stars run the entire time; you only notice them once the sky is dark enough for them to have something to show up against.",
    ],
  },
  album: {
    name: "Album",
    description:
      "Interactive vinyl record player that toggles between spinning record and album cover",
    about: [
      "It starts as a record: the artwork is cropped to a circle, pushed up so the track and artist show underneath, and slowly turning, with a label and spindle in the middle. Click it and the circle opens back out into a square that slides down to fill the frame as a cover. Click again and it goes back. One button, one boolean, one 1s transition.",
      "The artwork is never swapped. The same image is both the sleeve and the vinyl, and the illusion holds because the crop and the border radius move together: by the time you can tell it is a circle, only the middle of the image is left, which is roughly what a record label looks like anyway. The label itself is five stacked circles rather than an image, so it stays crisp at any size, and the spin is a CSS keyframe that only runs in the record state.",
    ],
  },
  moon: {
    name: "Moon",
    description: "3D moon with accurate lunar phases and NASA textures",
    about: [
      "Tonight's moon, rendered from real ephemeris data. astronomy-engine works out the Sun's direction, the illuminated fraction, the phase angle, the position angle of the bright limb and the libration for your location and time. Those numbers place a single directional light around a sphere wearing NASA Lunar Reconnaissance Orbiter colour, normal, roughness and displacement maps.",
      "The moon never rotates to make a phase. The sphere stays put and only the light direction moves, which is how phases actually happen, and it means the terminator falls across real craters instead of across a texture that has been spun to fit the shape you wanted. The page asks for your location because the moon's tilt in the sky depends on where you are standing, and a waxing crescent in Melbourne leans the other way to one in London. Melbourne is the fallback if you decline. Scrub the time forward in two-hour steps and watch the terminator sweep across the craters rather than around them.",
    ],
  },
  "staggered-fade": {
    name: "Staggered fade",
    description: "Auto-cycling text with letter-by-letter fade animations",
    about: [
      "A pill that cycles through four phrases, one every two seconds, fading each letter in from a small blur on a 15ms stagger. The pill's width springs to the new phrase's width at the same time, measured off a hidden copy of the content, so it never jumps to the new size before the letters arrive.",
      "Two details do most of the work. The loop only runs while the pill is on screen, so four intervals are not ticking away on a page nobody is looking at. And the exit is faster and blurrier than the entrance, which gets the outgoing word out of the way before the incoming one is legible: run both at the same speed and the middle of the transition is an unreadable overlap. The chevron applies the same per-letter treatment as a dimmed state for two seconds, so you can see the two ends of it side by side.",
    ],
  },
  status: {
    name: "Status",
    description: "Popover menu to set user status with animated emoji icons",
    about: [
      "A Set status button that opens a row of emoji in a popover. Pick one and the popover closes, the emoji swaps into the button, and the label rewrites itself letter by letter to On vacation or whichever you chose. A small x fades in to clear it, which runs the same animation back to the start.",
      "The width is the awkward part. The button has to grow or shrink around a label that is arriving one character at a time, so the inner content is measured and the outer width is sprung to that measurement rather than left to normal layout, which would snap to the final width on the first frame. The options in the popover grow downward on hover by animating padding rather than scale: scaling an emoji makes it soft, and the padding version keeps every glyph rendering at its native size.",
    ],
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
    about: [
      "A dark room with light coming through a window, built entirely in CSS. Move the mouse and the beams swing, the highlight on the frame shifts, and the perspective origin moves with you, which is what separates the layers into depth. There is no canvas and no WebGL anywhere in it: transformed divs, blurred gradients, and a set of custom properties that a mousemove handler writes to.",
      "The thing CSS will not give you is drift. A still scene with the mouse parked reads as a screenshot, so a small noise function nudges the layers every 800ms, summing several sine waves at unrelated frequencies so the movement never lands on a loop you can hear coming. The x offset moves at a quarter of the y offset, which is roughly how a hanging thing sways. Leave the cursor still for a few seconds and you can watch it breathe.",
    ],
  },
  "password-strength": {
    name: "Password strength",
    description:
      "Password input with animated 3-bar strength metre and colour-coded feedback",
    about: [
      "A password field with three bars under it and a show/hide toggle. Type and the bars light up one at a time, red to orange to green, with the label beside them changing to match.",
      "The scoring is deliberately naive: it is length only, one bar up to four characters, two up to nine, three beyond that. Anything you would actually ship needs something like zxcvbn, and it needs to run on a value you are not sending anywhere. What this demo is about is the feedback. The bars animate their colour on a spring rather than switching, so the gauge feels attached to your typing instead of stepping between three fixed states, and the eye toggle is the other half of it, since telling someone their password is weak is not much use if you will not let them see what they typed.",
    ],
  },
  controls: {
    name: "Controls",
    description: "Design system playground with colour and layout controls",
  },
  dither: {
    name: "Dither",
    description:
      "3D asteroid shooter game with Obra Dinn-style dithering effects",
    about: [
      "A first-person asteroid shooter rendered in exactly two colours. You fly forward through a field of procedurally generated rocks, steer with the mouse or by dragging on touch, and click to shoot. Every hit is 100 points, and the game leans on you as your score climbs: asteroids spawn from one every 1.2 seconds down to one every 0.3, and they move faster with it.",
      "The look comes from a post-processing pass that copies the technique from Return of the Obra Dinn. Dithering in screen space is the obvious approach and it is wrong: the pattern crawls across surfaces whenever the camera moves. Instead each pixel's view direction is reconstructed and sampled against a sphere centred on the camera, which buys two things at once: the pattern holds still against the geometry while you look around, and it still shifts when you actually travel. The last step is a hard step() against luminance, which gives one bit per pixel: either #333319 or white, with no greys anywhere in the output at all.",
    ],
  },
  "timed-undo": {
    name: "Timed undo",
    description:
      "Delete account button with animated countdown timer and undo functionality",
    about: [
      "A delete account button that gives you ten seconds to change your mind. Press it and, instead of a confirmation dialog, the button itself becomes the undo control: it goes pale, the label rewrites to Cancel Deletion letter by letter, an undo icon slides in and a countdown starts. Let it run out and the button blurs away. Press it again and everything reverses.",
      "I prefer this to a modal because the undo ends up where your cursor already is, and because a confirm dialog asks you to predict regret while an undo lets you notice it. Two implementation notes. The countdown digits are keyed per character, so only the digit that changed springs in from above and 10 to 9 does not re-animate the whole number. And the border radius is set inline rather than in a class, because a layout animation will skew a radius it is interpolating as part of the box.",
    ],
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
    about: [
      "Type a URL, pick a colour from a grid of sixteen hues, and download the code as SVG or PNG. It is built on beautiful-qr-code, a package of mine.",
      "The colours are OKLCH rather than HSL, and for a QR code that is not a preference. In HSL a fixed lightness is a lie: yellow at 65% reads far brighter than blue at 65%, so a palette built by sweeping the hue slider gives you swatches that scan and swatches that do not. OKLCH is built so that a fixed lightness looks like a fixed lightness across the whole hue circle, which means every colour in the grid keeps roughly the same contrast against the background. The background is derived rather than chosen: a light foreground gets a dark background and vice versa, with a trace of the same hue carried through so the pair still looks deliberate.",
    ],
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
  "perfect-dnd": {
    name: "Perfect drag and drop",
    description: "Sortable list with spring physics drag animations",
  },
  "dnd-grid": {
    name: "Dnd grid",
    description: "Resizable drag-and-drop grid layout using dnd-grid",
    about: [
      "Eight blocks in a four-column grid. Drag one to move it and blocks push out of the way; drag an edge to resize it and the rest reflow. A vertical compactor pulls everything upward after each change, so you never end up with a hole above a block. This is a demo of dnd-grid, a library of mine.",
      "The interesting problem here is a feedback loop. The grid measures its own container with a ResizeObserver, but resizing a block changes the container, which fires the observer, which re-measures and can re-lay out mid-gesture: measurement drives layout drives measurement. The fix is to park incoming widths while a resize is in flight and apply the last pending one when the gesture ends. Try dragging a block down to a single column and watching what happens to its neighbours.",
    ],
  },
  "multi-stroke-text": {
    name: "Multi-stroke text",
    description:
      "Stacked SVG copies of the Linktree mark with progressively wider strokes build a retro onion-ring outline effect",
  },
  "omni-color-picker": {
    name: "Omni-directional colour picker",
    description:
      "Drag a fish-eye sphere of dots to recolour the page: hue on x, shade on y",
  },
};
